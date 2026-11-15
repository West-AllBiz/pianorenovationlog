import hashlib
import unittest
from backup_storage import safe_path, verify_bytes


class BackupValidation(unittest.TestCase):
    def test_rejects_traversal_and_absolute_object_names(self):
        for name in ('', '.', '../escape', '/tmp/escape', 'piano/../../escape', 'piano\\escape'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                safe_path(name)

    def test_accepts_nested_object_names(self):
        self.assertEqual(str(safe_path('piano/example.jpeg')), 'piano/example.jpeg')

    def test_rejects_corrupt_same_size_image(self):
        item = {'metadata': {'size': 4, 'eTag': hashlib.md5(b'good').hexdigest()}}
        with self.assertRaises(ValueError):
            verify_bytes(b'evil', item)

    def test_rejects_missing_or_wrong_size(self):
        for metadata in ({}, {'size': 99}):
            with self.subTest(metadata=metadata), self.assertRaises(ValueError):
                verify_bytes(b'image', {'metadata': metadata})

    def test_reports_checksum_limit_without_claiming_md5(self):
        result = verify_bytes(b'image', {'metadata': {'size': 5, 'eTag': 'multipart-2'}})
        self.assertFalse(result['md5_verified'])
        self.assertEqual(result['sha256'], hashlib.sha256(b'image').hexdigest())

    def test_verifies_quoted_md5(self):
        result = verify_bytes(b'image', {'metadata': {'size': 5, 'eTag': '"' + hashlib.md5(b'image').hexdigest() + '"'}})
        self.assertTrue(result['md5_verified'])


if __name__ == '__main__':
    unittest.main()
