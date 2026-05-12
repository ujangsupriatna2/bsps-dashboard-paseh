#!/usr/bin/env python3
"""Generate BSPS Word document for Kecamatan Paseh, Desa Loa."""

import json
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

# ── Load data ───────────────────────────────────────────────────────────────
with open("/home/z/my-project/src/data/bsps-data.json", "r") as f:
    all_data = json.load(f)

data_acc = [d for d in all_data if d["kategori"] == "data_acc"]
tidak_acc_layak = [d for d in all_data if d["kategori"] == "tidak_acc_layak_huni"]
tidak_acc_tidak = [d for d in all_data if d["kategori"] == "tidak_acc_tidak_melanjutkan"]

print(f"data_acc: {len(data_acc)}")
print(f"tidak_acc_layak_huni: {len(tidak_acc_layak)}")
print(f"tidak_acc_tidak_melanjutkan: {len(tidak_acc_tidak)}")

# ── Helper: set cell shading ────────────────────────────────────────────────
def set_cell_shading(cell, color_hex: str):
    """Set cell background color. color_hex like '4472C4' (no #)."""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}" w:val="clear"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_text(cell, text, bold=False, font_size=9, font_name="Calibri", alignment=None, color=None):
    """Set cell text with formatting."""
    cell.text = ""
    p = cell.paragraphs[0]
    if alignment:
        p.alignment = alignment
    run = p.add_run(str(text))
    run.bold = bold
    run.font.size = Pt(font_size)
    run.font.name = font_name
    if color:
        run.font.color.rgb = color
    # Set vertical alignment to center
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcVAlign = parse_xml(f'<w:vAlign {nsdecls("w")} w:val="center"/>')
    tcPr.append(tcVAlign)
    # Set cell margins
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1)

def add_table_borders(table):
    """Add borders to all cells in the table."""
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else parse_xml(f'<w:tblPr {nsdecls("w")}/>')
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        '  <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '  <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '  <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '</w:tblBorders>'
    )
    tblPr.append(borders)

def add_page_break(doc):
    """Add a page break."""
    doc.add_page_break()

# ── Create document ─────────────────────────────────────────────────────────
doc = Document()

# Set default font
style = doc.styles["Normal"]
font = style.font
font.name = "Calibri"
font.size = Pt(11)

# Set page size to A4 and margins
for section in doc.sections:
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(2.54)
    section.right_margin = Cm(2.54)

# ── TITLE PAGE ──────────────────────────────────────────────────────────────
# Add several blank lines for vertical centering effect
for _ in range(6):
    doc.add_paragraph("")

# Title line 1
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("DATA PENERIMA BSPS")
run.bold = True
run.font.size = Pt(28)
run.font.name = "Calibri"
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

# Title line 2
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Bantuan Stimulan Perumahan Swadaya")
run.bold = True
run.font.size = Pt(16)
run.font.name = "Calibri"

# Separator line
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("─" * 40)
run.font.size = Pt(12)
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

# Subtitle lines
for text in ["Kecamatan Paseh - Desa Loa", "Kabupaten Bandung", "Tahun 2024"]:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.size = Pt(14)
    run.font.name = "Calibri"

# ── DAFTAR ISI PAGE ────────────────────────────────────────────────────────
add_page_break(doc)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("DAFTAR ISI")
run.bold = True
run.font.size = Pt(16)
run.font.name = "Calibri"
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

doc.add_paragraph("")

toc_items = [
    ("I.", "Data Penerima yang Di ACC", f"{len(data_acc)} orang"),
    ("II.", "Data Tidak ACC - Layak Huni", f"{len(tidak_acc_layak)} orang"),
    ("III.", "Data Tidak ACC - Tidak Melanjutkan", f"{len(tidak_acc_tidak)} orang"),
]

for num, title, count in toc_items:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(f"{num}  {title}")
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = "Calibri"
    run2 = p.add_run(f"  ({count})")
    run2.font.size = Pt(12)
    run2.font.name = "Calibri"

# ── SECTION I: DATA PENERIMA YANG DI ACC ───────────────────────────────────
add_page_break(doc)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("I. DATA PENERIMA YANG DI ACC")
run.bold = True
run.font.size = Pt(14)
run.font.name = "Calibri"
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run(f"Jumlah: {len(data_acc)} Orang")
run.font.size = Pt(10)
run.font.name = "Calibri"

doc.add_paragraph("")

# Create table: No, Nama, NIK, No KK, Alamat, RT/RW
acc_cols = ["No", "Nama", "NIK", "No KK", "Alamat", "RT/RW"]
acc_col_widths = [Cm(1.0), Cm(3.5), Cm(3.5), Cm(3.5), Cm(4.0), Cm(1.5)]

table = doc.add_table(rows=1 + len(data_acc), cols=len(acc_cols))
table.alignment = WD_TABLE_ALIGNMENT.CENTER
add_table_borders(table)

# Header row (green)
GREEN_HEX = "548235"
GREEN_TEXT = RGBColor(0xFF, 0xFF, 0xFF)
for i, col_name in enumerate(acc_cols):
    cell = table.rows[0].cells[i]
    set_cell_shading(cell, GREEN_HEX)
    set_cell_text(cell, col_name, bold=True, font_size=9, color=GREEN_TEXT,
                  alignment=WD_ALIGN_PARAGRAPH.CENTER)

# Data rows
for idx, entry in enumerate(data_acc, 1):
    row = table.rows[idx]
    # Prefix NIK and KK with tab character to prevent Excel/Word auto-formatting as number
    nik_text = "\t" + entry["nik"]
    kk_text = "\t" + entry["kk"]
    rt_rw = f'{entry["rt"]}/{entry["rw"]}'
    
    values = [str(idx), entry["nama"], nik_text, kk_text, entry["alamat"], rt_rw]
    aligns = [
        WD_ALIGN_PARAGRAPH.CENTER,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.CENTER,
    ]
    for i, (val, align) in enumerate(zip(values, aligns)):
        set_cell_text(row.cells[i], val, font_size=8, alignment=align)
    # Alternate row shading
    if idx % 2 == 0:
        for i in range(len(acc_cols)):
            set_cell_shading(row.cells[i], "E2EFDA")

# Set column widths
for i, width in enumerate(acc_col_widths):
    for row in table.rows:
        row.cells[i].width = width

# ── SECTION II: DATA TIDAK ACC - LAYAK HUNI ────────────────────────────────
add_page_break(doc)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("II. DATA TIDAK ACC - LAYAK HUNI")
run.bold = True
run.font.size = Pt(14)
run.font.name = "Calibri"
run.font.color.rgb = RGBColor(0xBF, 0x8F, 0x00)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run(f"Jumlah: {len(tidak_acc_layak)} Orang")
run.font.size = Pt(10)
run.font.name = "Calibri"

doc.add_paragraph("")

# Create table: No, Nama, NIK, No KK, Alamat, RT/RW, Keterangan
layak_cols = ["No", "Nama", "NIK", "No KK", "Alamat", "RT/RW", "Keterangan"]
layak_col_widths = [Cm(1.0), Cm(3.0), Cm(3.2), Cm(3.2), Cm(3.5), Cm(1.3), Cm(2.8)]

table2 = doc.add_table(rows=1 + len(tidak_acc_layak), cols=len(layak_cols))
table2.alignment = WD_TABLE_ALIGNMENT.CENTER
add_table_borders(table2)

# Header row (yellow/amber)
AMBER_HEX = "BF8F00"
AMBER_TEXT = RGBColor(0xFF, 0xFF, 0xFF)
for i, col_name in enumerate(layak_cols):
    cell = table2.rows[0].cells[i]
    set_cell_shading(cell, AMBER_HEX)
    set_cell_text(cell, col_name, bold=True, font_size=9, color=AMBER_TEXT,
                  alignment=WD_ALIGN_PARAGRAPH.CENTER)

# Data rows
for idx, entry in enumerate(tidak_acc_layak, 1):
    row = table2.rows[idx]
    nik_text = "\t" + entry["nik"]
    kk_text = "\t" + entry["kk"]
    rt_rw = f'{entry["rt"]}/{entry["rw"]}'
    keterangan = entry.get("keterangan") or "-"
    
    values = [str(idx), entry["nama"], nik_text, kk_text, entry["alamat"], rt_rw, keterangan]
    aligns = [
        WD_ALIGN_PARAGRAPH.CENTER,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.CENTER,
        WD_ALIGN_PARAGRAPH.LEFT,
    ]
    for i, (val, align) in enumerate(zip(values, aligns)):
        set_cell_text(row.cells[i], val, font_size=8, alignment=align)
    if idx % 2 == 0:
        for i in range(len(layak_cols)):
            set_cell_shading(row.cells[i], "FFF2CC")

# Set column widths
for i, width in enumerate(layak_col_widths):
    for row in table2.rows:
        row.cells[i].width = width

# ── SECTION III: DATA TIDAK ACC - TIDAK MELANJUTKAN ────────────────────────
add_page_break(doc)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("III. DATA TIDAK ACC - TIDAK MELANJUTKAN")
run.bold = True
run.font.size = Pt(14)
run.font.name = "Calibri"
run.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run(f"Jumlah: {len(tidak_acc_tidak)} Orang")
run.font.size = Pt(10)
run.font.name = "Calibri"

doc.add_paragraph("")

# Create table
tidak_cols = ["No", "Nama", "NIK", "No KK", "Alamat", "RT/RW", "Keterangan"]
tidak_col_widths = [Cm(1.0), Cm(3.0), Cm(3.2), Cm(3.2), Cm(3.5), Cm(1.3), Cm(2.8)]

table3 = doc.add_table(rows=1 + len(tidak_acc_tidak), cols=len(tidak_cols))
table3.alignment = WD_TABLE_ALIGNMENT.CENTER
add_table_borders(table3)

# Header row (red)
RED_HEX = "C00000"
RED_TEXT = RGBColor(0xFF, 0xFF, 0xFF)
for i, col_name in enumerate(tidak_cols):
    cell = table3.rows[0].cells[i]
    set_cell_shading(cell, RED_HEX)
    set_cell_text(cell, col_name, bold=True, font_size=9, color=RED_TEXT,
                  alignment=WD_ALIGN_PARAGRAPH.CENTER)

# Data rows
for idx, entry in enumerate(tidak_acc_tidak, 1):
    row = table3.rows[idx]
    nik_text = "\t" + entry["nik"]
    kk_text = "\t" + entry["kk"]
    rt_rw = f'{entry["rt"]}/{entry["rw"]}'
    keterangan = entry.get("keterangan") or "-"
    
    values = [str(idx), entry["nama"], nik_text, kk_text, entry["alamat"], rt_rw, keterangan]
    aligns = [
        WD_ALIGN_PARAGRAPH.CENTER,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.LEFT,
        WD_ALIGN_PARAGRAPH.CENTER,
        WD_ALIGN_PARAGRAPH.LEFT,
    ]
    for i, (val, align) in enumerate(zip(values, aligns)):
        set_cell_text(row.cells[i], val, font_size=8, alignment=align)

# Set column widths
for i, width in enumerate(tidak_col_widths):
    for row in table3.rows:
        row.cells[i].width = width

# ── RINGKASAN PAGE ─────────────────────────────────────────────────────────
add_page_break(doc)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("RINGKASAN")
run.bold = True
run.font.size = Pt(16)
run.font.name = "Calibri"
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

doc.add_paragraph("")

# Summary table
summary_data = [
    ("Di ACC", str(len(data_acc)), "orang", "548235"),
    ("Tidak ACC - Layak Huni", str(len(tidak_acc_layak)), "orang", "BF8F00"),
    ("Tidak ACC - Tidak Melanjutkan", str(len(tidak_acc_tidak)), "orang", "C00000"),
    ("Total", str(len(all_data)), "orang", "1F497D"),
]

sum_table = doc.add_table(rows=len(summary_data) + 1, cols=3)
sum_table.alignment = WD_TABLE_ALIGNMENT.CENTER
add_table_borders(sum_table)

# Header
for i, hdr in enumerate(["Kategori", "Jumlah", ""]):
    cell = sum_table.rows[0].cells[i]
    set_cell_shading(cell, "1F497D")
    set_cell_text(cell, hdr, bold=True, font_size=10, color=RGBColor(0xFF, 0xFF, 0xFF),
                  alignment=WD_ALIGN_PARAGRAPH.CENTER)

for idx, (label, count, unit, color) in enumerate(summary_data, 1):
    row = sum_table.rows[idx]
    is_total = label == "Total"
    
    set_cell_text(row.cells[0], label, bold=is_total, font_size=10,
                  alignment=WD_ALIGN_PARAGRAPH.LEFT)
    set_cell_text(row.cells[1], count, bold=is_total, font_size=10,
                  alignment=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_text(row.cells[2], unit, bold=is_total, font_size=10,
                  alignment=WD_ALIGN_PARAGRAPH.LEFT)
    
    # Color the category cell
    set_cell_shading(row.cells[0], color)
    # White text on colored background
    row.cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    row.cells[0].paragraphs[0].runs[0].bold = True
    
    if is_total:
        for i in range(3):
            set_cell_shading(row.cells[i], "D6E4F0")

# Set widths for summary table
sum_widths = [Cm(8), Cm(3), Cm(3)]
for i, width in enumerate(sum_widths):
    for row in sum_table.rows:
        row.cells[i].width = width

# ── Save ────────────────────────────────────────────────────────────────────
output_path = "/home/z/my-project/public/outputs/Data_BSPS_Paseh_Loa.docx"
doc.save(output_path)
print(f"\nDocument saved to: {output_path}")
print("Done!")
