import fs from 'node:fs';
import { expect,it } from 'vitest';
it('adds only two nonsecret production flags and leaves existing service settings out of the release file',()=>{
 const source=fs.readFileSync('.env.production','utf8');const lines=source.split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('#'));
 expect(lines).toEqual(['VITE_WORKSHOP_AUTH_MODE=review','VITE_WORKSHOP_EMAIL_SEND_ENABLED=true']);expect(source).not.toMatch(/SUPABASE|KEY=|PASSWORD|TOKEN=/);
});
