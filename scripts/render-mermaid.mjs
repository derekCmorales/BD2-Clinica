#!/usr/bin/env node
/**
 * Exporta bloques ```mermaid de docs/entrega-1/*.md a SVG y PNG (2x) en render/.
 * Requiere: @mermaid-js/mermaid-cli
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const docsDir = join(root, 'docs', 'entrega-1');
const outDir = join(docsDir, 'render');
const tmpDir = join(outDir, '.cache');

await mkdir(tmpDir, { recursive: true });

const files = (await readdir(docsDir)).filter((f) => f.endsWith('.md'));
let n = 0;

function runMmdc(input, output, extraArgs = []) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'mmdc', '-i', input, '-o', output, ...extraArgs],
    { cwd: root, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    console.error(`Fallo renderizando ${input} → ${output}`);
    process.exit(result.status ?? 1);
  }
}

for (const file of files) {
  const text = await readFile(join(docsDir, file), 'utf8');
  const re = /```mermaid\n([\s\S]*?)```/g;
  let match;
  let idx = 0;
  while ((match = re.exec(text)) !== null) {
    idx += 1;
    n += 1;
    const stem = `${basename(file, '.md')}-${idx}`;
    const mmd = join(tmpDir, `${stem}.mmd`);
    const svg = join(outDir, `${stem}.svg`);
    const png = join(outDir, `${stem}.png`);
    await writeFile(mmd, match[1], 'utf8');
    runMmdc(mmd, svg, ['-b', 'transparent']);
    console.log('OK', svg);
    // PNG 2x, fondo blanco: pegado fiable en Word / Google Docs
    runMmdc(mmd, png, ['-b', 'white', '-s', '2']);
    console.log('OK', png);
  }
}

console.log(`Renderizados: ${n} diagramas (SVG + PNG)`);
