#!/usr/bin/env python3
"""Copy the allowlisted Workshop bucket and verify each file against its manifest.

Uses public GETs only. No database writes, uploads, authentication, or cutover.
The metadata/data files must be private exports from the same source snapshot.
"""
import argparse
import base64
import concurrent.futures
import hashlib
import json
import re
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath

SOURCE = 'https://bxurezzzvdnuiiwtaqxw.supabase.co'


def safe_path(value):
    path = PurePosixPath(value)
    if not value or str(path) == '.' or path.is_absolute() or '..' in path.parts or '\\' in value:
        raise ValueError('Unsafe object path')
    return path


def verify_bytes(data, item):
    metadata = item.get('metadata') or {}
    expected_size = metadata.get('size', metadata.get('contentLength'))
    if expected_size is None or len(data) != int(expected_size):
        raise ValueError('Object size mismatch')
    etag = str(metadata.get('eTag', '')).strip('"')
    md5 = hashlib.md5(data).hexdigest()
    checked_md5 = bool(re.fullmatch(r'[0-9a-fA-F]{32}', etag))
    if checked_md5 and md5.lower() != etag.lower():
        raise ValueError('Object MD5 mismatch')
    return {'size': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
            'md5_verified': checked_md5}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--previous-zip', type=Path)
    args = parser.parse_args()
    root = args.directory.resolve()
    metadata = json.loads((root / 'workshop-metadata.json').read_text())
    records = json.loads((root / 'workshop-data.json').read_text())
    objects = metadata['storage_objects']
    keys = [(x['bucket_id'], x['name']) for x in objects]
    if len(keys) != len(set(keys)):
        raise ValueError('Duplicate manifest objects')
    previous = {}
    if args.previous_zip:
        with zipfile.ZipFile(args.previous_zip) as archive:
            for item in objects:
                key = 'workshop-storage/' + item['bucket_id'] + '/' + item['name']
                if key in archive.namelist():
                    data = archive.read(key)
                    try:
                        result = verify_bytes(data, item)
                        # No remote checksum means the old file cannot prove freshness.
                        if result['md5_verified']:
                            previous[key] = data
                    except ValueError:
                        pass

    def copy(item):
        if item['bucket_id'] != 'piano-photos':
            raise ValueError('Unexpected bucket; review before extending allowlist')
        name = safe_path(item['name'])
        key = 'workshop-storage/piano-photos/' + str(name)
        data = previous.get(key)
        reused = data is not None
        if data is None:
            url = SOURCE + '/storage/v1/object/public/piano-photos/' + urllib.parse.quote(str(name), safe='/')
            with urllib.request.urlopen(url, timeout=45) as response:
                if not response.url.startswith(SOURCE + '/storage/v1/object/public/'):
                    raise ValueError('Unexpected redirect')
                data = response.read()
        result = verify_bytes(data, item)
        path = root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return {'path': key, 'reused_verified_backup': reused, **result}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(copy, objects))
    available = {item['name'] for item in objects}
    missing, external, embedded, remote = [], [], [], 0
    prefix = SOURCE + '/storage/v1/object/public/piano-photos/'
    for row in records['piano_photos']:
        url = row.get('url') or ''
        if url.startswith('data:image/'):
            header, payload = url.split(',', 1)
            if not header.endswith(';base64'):
                raise ValueError('Unsupported embedded image encoding')
            data = base64.b64decode(payload, validate=True)
            if not data:
                raise ValueError('Empty embedded image')
            embedded.append({'photo_id': row['id'], 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        elif url.startswith(prefix):
            remote += 1
            name = urllib.parse.unquote(urllib.parse.urlsplit(url).path.split('/piano-photos/', 1)[1])
            if name not in available:
                missing.append(row['id'])
        else:
            external.append(row['id'])
    if missing or external:
        raise ValueError('Unresolved photo references: ' + json.dumps({'missing': missing, 'external': external}))
    summary = {'source_project': SOURCE, 'snapshot_at': metadata['captured_at'],
               'objects': len(results), 'bytes': sum(r['size'] for r in results),
               'md5_verified': sum(r['md5_verified'] for r in results),
               'reused_verified_backup': sum(r['reused_verified_backup'] for r in results),
               'photo_records': len(records['piano_photos']), 'remote_photo_references': remote,
               'embedded_photo_records': len(embedded), 'embedded_images': embedded, 'missing_references': missing,
               'external_references': external, 'files': results}
    (root / 'storage-verification.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps({k: v for k, v in summary.items() if k != 'files'}, indent=2))


if __name__ == '__main__':
    main()
