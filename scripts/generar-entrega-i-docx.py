#!/usr/bin/env python3
"""Genera ENTREGA-I.docx desde ENTREGA-I.html con diagramas y DDL embebidos."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "docs/entrega-1/ENTREGA-I.html"
RENDER_DIR = ROOT / "docs/entrega-1/render"
PNG_CACHE = ROOT / ".tmp-docx-png"
OUTPUT = ROOT / "ENTREGA-I.docx"

PG_DDL = ROOT / "apps/api/src/infraestructura/postgres/migrations/001_clinico.sql"
MYSQL_DDL = ROOT / "apps/api/src/infraestructura/mysql/migrations/001_clinico.sql"

DDL_MARKERS = {
    "postgres/migrations/001_clinico.sql": PG_DDL,
    "mysql/migrations/001_clinico.sql": MYSQL_DDL,
}


def svg_to_png(svg_path: Path) -> Path:
    PNG_CACHE.mkdir(parents=True, exist_ok=True)
    out = PNG_CACHE / f"{svg_path.stem}.png"
    if out.exists() and out.stat().st_mtime >= svg_path.stat().st_mtime:
        return out
    subprocess.run(
        ["qlmanage", "-t", "-s", "1400", "-o", str(PNG_CACHE), str(svg_path)],
        check=True,
        capture_output=True,
    )
    generated = PNG_CACHE / f"{svg_path.name}.png"
    if generated != out and generated.exists():
        generated.rename(out)
    return out


def resolve_image(src: str) -> Path | None:
    rel = src.replace("render/", "")
    stem = Path(rel).stem
    for ext in (".png", ".svg"):
        candidate = RENDER_DIR / f"{stem}{ext}"
        if candidate.exists():
            if ext == ".svg":
                return svg_to_png(candidate)
            return candidate
    return None


def set_run_font(run, name: str = "Calibri", size: int = 11, bold: bool = False, mono: bool = False):
    run.bold = bold
    run.font.size = Pt(size)
    font_name = "Courier New" if mono else name
    run.font.name = font_name
    r = run._element.get_or_add_rPr()
    r.rFonts.set(qn("w:ascii"), font_name)
    r.rFonts.set(qn("w:hAnsi"), font_name)
    r.rFonts.set(qn("w:eastAsia"), font_name)


def add_rich_paragraph(doc: Document, node: Tag, style: str | None = None):
    p = doc.add_paragraph(style=style)
    for child in node.children:
        if isinstance(child, NavigableString):
            text = str(child)
            if text.strip():
                run = p.add_run(text)
                set_run_font(run)
        elif child.name == "code":
            run = p.add_run(child.get_text())
            set_run_font(run, mono=True, size=10)
        elif child.name == "strong":
            run = p.add_run(child.get_text())
            set_run_font(run, bold=True)
        elif child.name == "a":
            run = p.add_run(child.get_text())
            set_run_font(run)
        else:
            run = p.add_run(child.get_text())
            set_run_font(run)
    return p


def add_table(doc: Document, table_tag: Tag):
    rows = table_tag.find_all("tr")
    if not rows:
        return
    headers = [th.get_text(strip=True) for th in rows[0].find_all(["th", "td"])]
    cols = len(headers)
    table = doc.add_table(rows=1, cols=cols)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, text in enumerate(headers):
        hdr[i].text = text
        for p in hdr[i].paragraphs:
            for r in p.runs:
                r.bold = True
    for row in rows[1:]:
        cells = row.find_all(["td", "th"])
        if not cells:
            continue
        row_cells = table.add_row().cells
        for i, cell in enumerate(cells[:cols]):
            row_cells[i].text = cell.get_text(" ", strip=True)


def add_code_block(doc: Document, text: str):
    for line in text.splitlines() or [""]:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.left_indent = Inches(0.15)
        run = p.add_run(line)
        set_run_font(run, mono=True, size=8)
        run.font.color.rgb = RGBColor(0x1A, 0x23, 0x32)


def add_ddl_section(doc: Document, ddl_path: Path, title: str):
    doc.add_heading(title, level=3)
    doc.add_paragraph(f"Archivo: {ddl_path.relative_to(ROOT)}")
    add_code_block(doc, ddl_path.read_text(encoding="utf-8"))


def maybe_append_ddl(doc: Document, text: str):
    for marker, path in DDL_MARKERS.items():
        if marker in text and path.exists():
            motor = "PostgreSQL" if "postgres" in marker else "MySQL"
            add_ddl_section(doc, path, f"DDL completo — {motor}")
            return True
    return False


def process_children(doc: Document, parent: Tag):
    for child in parent.children:
        if isinstance(child, NavigableString):
            continue
        if not isinstance(child, Tag):
            continue

        name = child.name

        if name == "header" and "cover" in child.get("class", []):
            for p_tag in child.find_all("p", recursive=False):
                p = doc.add_paragraph(p_tag.get_text(strip=True))
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    set_run_font(r, size=10 if "uni" in p_tag.get("class", []) else 11)
            h = child.find("h1")
            if h:
                p = doc.add_heading(h.get_text(strip=True), level=0)
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            doc.add_page_break()
            continue

        if name == "aside":
            continue

        if name == "section":
            for sub in child.children:
                if isinstance(sub, NavigableString):
                    continue
                if not isinstance(sub, Tag):
                    continue
                process_element(doc, sub, section_id=child.get("id", ""))
            doc.add_paragraph()
            continue

        process_element(doc, child)


def process_element(doc: Document, el: Tag, section_id: str = ""):
    name = el.name

    if name in ("h1", "h2", "h3"):
        level = {"h1": 1, "h2": 2, "h3": 3}[name]
        doc.add_heading(el.get_text(strip=True), level=level)
        return

    if name == "p":
        text = el.get_text(strip=True)
        if not text:
            return
        add_rich_paragraph(doc, el)
        if maybe_append_ddl(doc, text):
            return
        return

    if name == "table":
        add_table(doc, el)
        return

    if name == "figure":
        img = el.find("img")
        cap = el.find("figcaption")
        if img and img.get("src"):
            png = resolve_image(img["src"])
            if png and png.exists():
                doc.add_picture(str(png), width=Inches(6.2))
                last = doc.paragraphs[-1]
                last.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if cap:
            p = doc.add_paragraph(cap.get_text(strip=True))
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                set_run_font(r, size=9)
                r.font.color.rgb = RGBColor(0x5A, 0x6B, 0x7D)
        return

    if name == "pre":
        code = el.find("code")
        add_code_block(doc, (code or el).get_text())
        return

    if name == "ul":
        for li in el.find_all("li", recursive=False):
            doc.add_paragraph(li.get_text(" ", strip=True), style="List Bullet")
        return

    if name == "ol":
        for li in el.find_all("li", recursive=False):
            doc.add_paragraph(li.get_text(" ", strip=True), style="List Number")
        return


def add_er_relationships_summary(doc: Document):
    """Resumen textual de relaciones ER (complemento a los diagramas)."""
    doc.add_heading("Relaciones clave — Hospital (PostgreSQL)", level=3)
    rels = [
        "paciente 1:1 expediente",
        "expediente 1:N cita, 1:N consulta",
        "usuario 1:N cita, 1:N consulta, 1:N auditoria_acceso",
        "cita ↔ consulta (0..1 : 0..1, FK cruzadas)",
        "consulta 1:N diagnostico, 1:N receta",
        "catalogo_diagnostico / catalogo_medicamento → FK opcional en diagnostico / receta",
    ]
    for r in rels:
        doc.add_paragraph(r, style="List Bullet")

    doc.add_heading("Relaciones clave — Odontología (MySQL)", level=3)
    rels_mysql = [
        "Núcleo idéntico al hospital",
        "expediente 1:N pieza_dental (UNIQUE expediente_id + codigo_fdi, FDI 11–48)",
        "pieza_dental 1:N procedimiento_dental",
        "consulta 1:N procedimiento_dental",
    ]
    for r in rels_mysql:
        doc.add_paragraph(r, style="List Bullet")


def main():
    html = HTML_PATH.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    body = soup.find("body")
    if not body:
        raise SystemExit("No se encontró <body> en el HTML")

    doc = Document()
    section = doc.sections[0]
    section.page_height = Inches(11)
    section.page_width = Inches(8.5)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)

    process_children(doc, body)
    add_er_relationships_summary(doc)

    doc.save(OUTPUT)
    print(f"Generado: {OUTPUT}")


if __name__ == "__main__":
    main()
