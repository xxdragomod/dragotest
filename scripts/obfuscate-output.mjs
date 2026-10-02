// Build ke baad SvelteKit ke bundled JS ko obfuscate karo taaki Sources me
// code padha na ja sake. `drago-guard.js` / `drago-security.js` (static/) ko
// alag se handle karte hain — guard me `debugger` logic hai, use obfuscate
// nahi karte warna timing trick toot jaati hai.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = '.vercel/output/static/_app/immutable';
const files = [];
(function walk(d){
  for (const n of readdirSync(d)) {
    const p = join(d,n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.js')) files.push(p);
  }
})(root);

let done=0;
for (const f of files) {
  const src = readFileSync(f,'utf8');
  try {
    const out = JavaScriptObfuscator.obfuscate(src, {
      compact: true,
      controlFlowFlattening: false,      // Svelte runtime ke saath risky
      deadCodeInjection: false,
      debugProtection: false,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      selfDefending: false,              // Svelte ke saath conflict kar sakta hai
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.5,
    }).getObfuscatedCode();
    writeFileSync(f, out);
    done++;
  } catch (e) {
    console.warn('  ⚠️ obfuscate fail (skip):', f, e.message.slice(0,60));
  }
}
console.log(`✅ obfuscated ${done}/${files.length} bundled JS files`);
