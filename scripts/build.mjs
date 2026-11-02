import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html', 'styles.css', 'src', 'favicon.svg']) await cp(file, `dist/${file}`, { recursive: true });
console.log('Built dependency-free offline game in dist/');
