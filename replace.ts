import fs from 'fs';

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/Vibe OS/g, 'MenifestOS');
content = content.replace(/VIBE OS/g, 'MENIFESTOS');
content = content.replace(/VibeOS/g, 'MenifestOS');
content = content.replace(/vibe_os/g, 'menifest_os');
content = content.replace(/vibe seeker/gi, 'Menifest Seeker');
content = content.replace(/Vibe Core/g, 'Menifest Core');
content = content.replace(/VIBE SYSTEM/g, 'MENIFEST SYSTEM');
content = content.replace(/VIBE\.2\.0/g, 'MENIFEST.2.0');
content = content.replace(/>Vibe</g, '>Menifest<');

fs.writeFileSync(path, content, 'utf8');
console.log("Replacements complete!");
