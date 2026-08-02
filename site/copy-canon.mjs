// ponytail: el sitio consume el build real del framework, no una copia divergente.
import { copyFileSync } from 'node:fs';
copyFileSync(
  new URL('../dist/canon.css', import.meta.url),
  new URL('./app/canon.css', import.meta.url),
);
console.log('✓ canon.css copied into site/app/');
