import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
it('preserves generated client, preview broker and both package manifests exactly', () => {
  for (const [path, hash] of Object.entries({ 'src/integrations/supabase/client.ts': '12f3d36db6d2bac27fa82f78d888a4742c89b102', 'src/integrations/supabase/previewAuthStorage.ts': '56f21e3e1fd0f3fd33b42132153097325e5f214f', 'package.json': '16a53108c6d839e706b64ff8f5ec4a2e32203b6e', 'package-lock.json': 'e1e8e5441576e9086549d053cfe6387c092e964d' })) {
    const content = readFileSync(path); expect(createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex')).toBe(hash);
  }
});
it('callback sanitization is run before dynamic App and generated-client import', () => {
  const source = readFileSync('src/main.tsx', 'utf8'); expect(source).not.toMatch(/import App from/); expect(source.indexOf('captureEmailCallback(window.location')).toBeLessThan(source.indexOf("import('./App.tsx')"));
});
