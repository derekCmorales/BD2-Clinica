#!/usr/bin/env node
/**
 * Consolida docs/entrega-2/*.md → ENTREGA-II.html con diagramas PNG embebidos.
 * Uso: pnpm docs:entrega-2  (tras pnpm docs:entrega-2:mermaid)
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const docsDir = join(root, 'docs', 'entrega-2');
const renderDir = join(docsDir, 'render');
const outFile = join(docsDir, 'ENTREGA-II.html');

const SECTION_ORDER = [
  '00-contexto.md',
  '01-asignacion-motores.md',
  '02-modelado-por-motor.md',
  '03-consistencia.md',
  '04-seguridad.md',
  '05-embeber-vs-referenciar.md',
  '06-hallazgos.md',
  '07-correcciones-entrega-1.md',
  '08-limitaciones.md',
  '09-evidencia.md',
  '10-matriz-cobertura.md',
  '11-guion-demo.md',
];

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function parseTable(rows) {
  if (rows.length < 2) return null;
  const cells = (line) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  const header = cells(rows[0]);
  const body = rows.slice(2).map(cells); // skip separator
  const thead = `<thead><tr>${header.map((h) => `<th>${inlineFormat(h)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td>${inlineFormat(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

/**
 * Markdown ligero → HTML. Sustituye mermaid por <img> a PNG.
 */
function mdToHtml(md, fileName) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let mermaidIdx = 0;
  let inCode = false;
  let codeLang = '';
  let codeBuf = [];
  let listBuf = [];
  let listOrdered = false;

  const flushList = () => {
    if (!listBuf.length) return;
    const tag = listOrdered ? 'ol' : 'ul';
    out.push(
      `<${tag}>${listBuf.map((li) => `<li>${inlineFormat(li)}</li>`).join('')}</${tag}>`,
    );
    listBuf = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    if (inCode) {
      if (line.startsWith('```')) {
        if (codeLang === 'mermaid') {
          mermaidIdx += 1;
          const stem = `${basename(fileName, '.md')}-${mermaidIdx}`;
          const pngRel = `render/${stem}.png`;
          out.push(
            `<figure class="diagram"><img src="${pngRel}" alt="Diagrama ${stem}" /><figcaption>${escapeHtml(stem)}</figcaption></figure>`,
          );
        } else {
          out.push(
            `<pre><code class="lang-${escapeHtml(codeLang)}">${escapeHtml(codeBuf.join('\n'))}</code></pre>`,
          );
        }
        inCode = false;
        codeBuf = [];
        codeLang = '';
      } else {
        codeBuf.push(line);
      }
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      flushList();
      inCode = true;
      codeLang = line.slice(3).trim();
      codeBuf = [];
      i += 1;
      continue;
    }

    // Table block
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|?\s*-+/.test(lines[i + 1])) {
      flushList();
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableRows.push(lines[i]);
        i += 1;
      }
      const table = parseTable(tableRows);
      if (table) out.push(table);
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      if (listBuf.length && listOrdered) flushList();
      listOrdered = false;
      listBuf.push(ul[1]);
      i += 1;
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(line);
    if (ol) {
      if (listBuf.length && !listOrdered) flushList();
      listOrdered = true;
      listBuf.push(ol[1]);
      i += 1;
      continue;
    }

    if (line.trim() === '') {
      flushList();
      i += 1;
      continue;
    }

    flushList();
    out.push(`<p>${inlineFormat(line)}</p>`);
    i += 1;
  }

  flushList();
  return out.join('\n');
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

const sections = [];
for (const file of SECTION_ORDER) {
  const path = join(docsDir, file);
  if (!(await fileExists(path))) {
    console.warn(`Omitido (no existe): ${file}`);
    continue;
  }
  const md = await readFile(path, 'utf8');
  // Contar mermaid y verificar PNG
  const mermaidCount = (md.match(/```mermaid\n/g) || []).length;
  for (let n = 1; n <= mermaidCount; n += 1) {
    const png = join(renderDir, `${basename(file, '.md')}-${n}.png`);
    if (!(await fileExists(png))) {
      console.error(`Falta ${png}. Ejecuta primero: pnpm docs:mermaid`);
      process.exit(1);
    }
  }
  sections.push(`<section class="doc-section" id="${basename(file, '.md')}">\n${mdToHtml(md, file)}\n</section>`);
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Entrega II — Aplicación cliente-servidor · Historiales clínicos</title>
  <style>
    :root {
      --ink: #1a2332;
      --muted: #5a6b7d;
      --line: #d0d7de;
      --bg: #ffffff;
      --soft: #f6f8fa;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0 auto;
      max-width: 52rem;
      padding: 2rem 1.5rem 4rem;
      color: var(--ink);
      background: var(--bg);
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      line-height: 1.55;
      font-size: 11pt;
    }
    .cover {
      text-align: center;
      padding: 3rem 1rem 2.5rem;
      border-bottom: 2px solid var(--ink);
      margin-bottom: 2.5rem;
      page-break-after: always;
    }
    .cover .uni { text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.85rem; color: var(--muted); }
    .cover h1 { font-size: 1.75rem; margin: 1rem 0 0.5rem; }
    .cover .meta { color: var(--muted); margin: 0.25rem 0; }
    .howto {
      background: var(--soft);
      border: 1px solid var(--line);
      padding: 0.85rem 1rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    h1 { font-size: 1.45rem; margin-top: 0; }
    h2 { font-size: 1.2rem; border-bottom: 1px solid var(--line); padding-bottom: 0.25rem; margin-top: 1.75rem; }
    h3 { font-size: 1.05rem; margin-top: 1.25rem; }
    section.doc-section {
      margin-bottom: 2.5rem;
      page-break-inside: avoid;
    }
    section.doc-section + section.doc-section {
      border-top: 1px solid var(--line);
      padding-top: 1.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0 1.25rem;
      font-size: 0.92rem;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 0.4rem 0.55rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: var(--soft); }
    code {
      font-family: ui-monospace, "SF Mono", Consolas, monospace;
      font-size: 0.88em;
      background: var(--soft);
      padding: 0.05em 0.3em;
      border-radius: 3px;
    }
    pre {
      background: var(--soft);
      border: 1px solid var(--line);
      padding: 0.75rem 1rem;
      overflow-x: auto;
      font-size: 0.85rem;
    }
    pre code { background: none; padding: 0; }
    figure.diagram {
      margin: 1.25rem 0;
      text-align: center;
      page-break-inside: avoid;
    }
    figure.diagram img {
      max-width: 100%;
      height: auto;
      border: 1px solid var(--line);
      background: #fff;
    }
    figcaption {
      font-size: 0.8rem;
      color: var(--muted);
      margin-top: 0.35rem;
    }
    ul, ol { padding-left: 1.35rem; }
    a { color: #0b5fff; }
    @media print {
      body { max-width: none; padding: 0; font-size: 10pt; }
      .howto { display: none; }
      .cover { border-bottom-width: 1px; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <header class="cover">
    <p class="uni">Universidad Rafael Landívar</p>
    <p class="uni">Facultad de Ingeniería · Ingeniería en Informática y Sistemas</p>
    <p class="uni">Bases de Datos II</p>
    <h1>Entrega II — Aplicación cliente-servidor</h1>
    <p class="meta">Plataforma de historiales clínicos · Red de cuatro instituciones</p>
    <p class="meta">Hospital (PostgreSQL) · Odontología (MySQL) · Laboratorio (MongoDB) · Pediátrico (Redis)</p>
  </header>

  <aside class="howto">
    <strong>Cómo armar el documento:</strong> abre este archivo en el navegador →
    Cmd+A → Cmd+C → pega en Word o Google Docs. Los diagramas ya van como imagen.
  </aside>

  ${sections.join('\n\n')}
</body>
</html>
`;

await writeFile(outFile, html, 'utf8');
console.log('OK', outFile);
console.log(`Secciones: ${sections.length}`);
