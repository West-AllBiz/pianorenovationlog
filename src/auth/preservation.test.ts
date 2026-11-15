import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
// Preserve the generated auth files at main 7c600097 (November 10, 2026).
// Package consistency is validated by npm ci in CI, not frozen obsolete hashes.
it('preserves the current generated client and preview broker exactly', () => {
  for (const [path, hash] of Object.entries({ 'src/integrations/supabase/client.ts': '12f3d36db6d2bac27fa82f78d888a4742c89b102', 'src/integrations/supabase/previewAuthStorage.ts': '2427ae9d84ce44478d7d82660864c3b438c8edfe' })) {
    const content = readFileSync(path); expect(createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex')).toBe(hash);
  }
});
it('callback sanitization is run before dynamic App and generated-client import', () => {
  const source = readFileSync('src/main.tsx', 'utf8'); expect(source).not.toMatch(/import App from/); expect(source.indexOf('captureEmailCallback(window.location')).toBeLessThan(source.indexOf("import('./App.tsx')"));
});
