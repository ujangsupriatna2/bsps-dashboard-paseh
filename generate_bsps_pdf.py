#!/usr/bin/env python3
"""
Generate BSPS PDF Report for Kecamatan Paseh, Desa Loa
Using ReportLab with professional formatting
"""

import json
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import (
    HexColor, white, black, Color
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Paths ──
DATA_PATH = "/home/z/my-project/src/data/bsps-data.json"
OUTPUT_PATH = "/home/z/my-project/public/outputs/Data_BSPS_Paseh_Loa.pdf"

# ── Load Data ──
with open(DATA_PATH, "r", encoding="utf-8") as f:
    all_data = json.load(f)

data_acc = [d for d in all_data if d["kategori"] == "data_acc"]
tidak_acc_layak_huni = [d for d in all_data if d["kategori"] == "tidak_acc_layak_huni"]
tidak_acc_tidak_melanjutkan = [d for d in all_data if d["kategori"] == "tidak_acc_tidak_melanjutkan"]

# ── Colors ──
GREEN_HEADER = HexColor("#2E7D32")
GREEN_LIGHT = HexColor("#E8F5E9")
YELLOW_HEADER = HexColor("#F57F17")
YELLOW_LIGHT = HexColor("#FFF8E1")
RED_HEADER = HexColor("#C62828")
RED_LIGHT = HexColor("#FFEBEE")
BLUE_HEADER = HexColor("#1565C0")
BLUE_LIGHT = HexColor("#E3F2FD")
ROW_ALT_LIGHT = HexColor("#F5F5F5")
DARK_TEXT = HexColor("#212121")
BORDER_COLOR = HexColor("#BDBDBD")

# ── Styles ──
styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    "CustomTitle",
    parent=styles["Title"],
    fontSize=28,
    leading=34,
    alignment=TA_CENTER,
    textColor=HexColor("#1B5E20"),
    spaceAfter=12,
    fontName="Helvetica-Bold",
)

style_subtitle = ParagraphStyle(
    "CustomSubtitle",
    parent=styles["Title"],
    fontSize=18,
    leading=24,
    alignment=TA_CENTER,
    textColor=HexColor("#333333"),
    spaceAfter=8,
    fontName="Helvetica",
)

style_location = ParagraphStyle(
    "Location",
    parent=styles["Title"],
    fontSize=16,
    leading=20,
    alignment=TA_CENTER,
    textColor=HexColor("#555555"),
    spaceAfter=6,
    fontName="Helvetica",
)

style_year = ParagraphStyle(
    "Year",
    parent=styles["Title"],
    fontSize=20,
    leading=26,
    alignment=TA_CENTER,
    textColor=HexColor("#1B5E20"),
    spaceAfter=10,
    fontName="Helvetica-Bold",
)

style_section_title = ParagraphStyle(
    "SectionTitle",
    parent=styles["Heading1"],
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    textColor=HexColor("#1B5E20"),
    spaceBefore=4,
    spaceAfter=4,
    fontName="Helvetica-Bold",
)

style_header_cell = ParagraphStyle(
    "HeaderCell",
    parent=styles["Normal"],
    fontSize=8,
    leading=10,
    alignment=TA_CENTER,
    textColor=white,
    fontName="Helvetica-Bold",
)

style_data_cell = ParagraphStyle(
    "DataCell",
    parent=styles["Normal"],
    fontSize=7,
    leading=9,
    alignment=TA_LEFT,
    textColor=DARK_TEXT,
    fontName="Helvetica",
)

style_data_cell_center = ParagraphStyle(
    "DataCellCenter",
    parent=style_data_cell,
    alignment=TA_CENTER,
)

style_data_cell_right = ParagraphStyle(
    "DataCellRight",
    parent=style_data_cell,
    alignment=TA_RIGHT,
)

style_summary_label = ParagraphStyle(
    "SummaryLabel",
    parent=styles["Normal"],
    fontSize=12,
    leading=16,
    fontName="Helvetica",
    textColor=DARK_TEXT,
)

style_summary_value = ParagraphStyle(
    "SummaryValue",
    parent=styles["Normal"],
    fontSize=12,
    leading=16,
    fontName="Helvetica-Bold",
    textColor=HexColor("#1B5E20"),
    alignment=TA_RIGHT,
)


# ── Helper Functions ──

def make_header_cell(text, style=style_header_cell):
    return Paragraph(str(text), style)

def make_data_cell(text, style=style_data_cell):
    return Paragraph(str(text), style)

def make_data_cell_center(text):
    return Paragraph(str(text), style_data_cell_center)


def build_data_table(data, columns, col_widths, header_color, alt_color, include_keterangan=False):
    """Build a professional table with header, data rows, and alternating colors."""

    # Build header row
    header_row = [make_header_cell(col) for col in columns]

    # Build data rows
    table_data = [header_row]

    for i, entry in enumerate(data):
        row = [
            make_data_cell_center(str(i + 1)),
            make_data_cell(entry["nama"]),
            make_data_cell_center(str(entry["nik"])),
            make_data_cell_center(str(entry["kk"])),
            make_data_cell(entry["alamat"]),
            make_data_cell_center(f"{entry['rt']}/{entry['rw']}"),
        ]
        if include_keterangan:
            keterangan = entry.get("keterangan") or "-"
            row.append(make_data_cell(keterangan))
        table_data.append(row)

    # Create table
    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    # Build style commands
    style_cmds = [
        # Header styling
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("BOX", (0, 0), (-1, -1), 1, header_color),

        # Padding
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]

    # Alternating row colors
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), alt_color))
        else:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), white))

    table.setStyle(TableStyle(style_cmds))
    return table


# ── Build PDF ──

# We'll use a custom build approach: first cover (portrait), then data pages (landscape),
# then summary (portrait). We'll build the PDF manually using canvas.

from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.lib.pagesizes import A4

# Page dimensions
PORTRAIT_W, PORTRAIT_H = A4
LANDSCAPE_W, LANDSCAPE_H = landscape(A4)

MARGIN = 2 * cm

def build_pdf():
    """Build the complete PDF document."""

    from reportlab.pdfgen import canvas
    from reportlab.platypus.flowables import Flowable

    c = canvas.Canvas(OUTPUT_PATH, pagesize=A4)

    # ═══════════════════════════════════════════
    # PAGE 1: COVER PAGE (Portrait A4)
    # ═══════════════════════════════════════════

    pw, ph = A4
    c.setPageSize(A4)

    # Decorative top bar
    c.setFillColor(HexColor("#1B5E20"))
    c.rect(0, ph - 40, pw, 40, fill=1, stroke=0)

    # Decorative bottom bar
    c.setFillColor(HexColor("#1B5E20"))
    c.rect(0, 0, pw, 40, fill=1, stroke=0)

    # Left vertical accent
    c.setFillColor(HexColor("#4CAF50"))
    c.rect(0, 40, 8, ph - 80, fill=1, stroke=0)

    # Center content
    y = ph * 0.72

    # Title
    c.setFillColor(HexColor("#1B5E20"))
    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(pw / 2, y, "DATA PENERIMA BSPS")

    y -= 40
    c.setFillColor(HexColor("#333333"))
    c.setFont("Helvetica", 18)
    c.drawCentredString(pw / 2, y, "Bantuan Stimulan Perumahan Swadaya")

    # Decorative line
    y -= 25
    c.setStrokeColor(HexColor("#4CAF50"))
    c.setLineWidth(2)
    c.line(pw * 0.25, y, pw * 0.75, y)

    # Location info
    y -= 35
    c.setFillColor(HexColor("#555555"))
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(pw / 2, y, "Kecamatan Paseh - Desa Loa")

    y -= 28
    c.setFont("Helvetica", 14)
    c.drawCentredString(pw / 2, y, "Kabupaten Bandung")

    # Year
    y -= 50
    c.setFillColor(HexColor("#1B5E20"))
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(pw / 2, y, "Tahun 2024")

    # Decorative line below year
    y -= 20
    c.setStrokeColor(HexColor("#4CAF50"))
    c.setLineWidth(1.5)
    c.line(pw * 0.3, y, pw * 0.7, y)

    # Stats preview at bottom
    y -= 60
    c.setFillColor(HexColor("#666666"))
    c.setFont("Helvetica", 11)
    c.drawCentredString(pw / 2, y, f"Total Penerima: {len(all_data)} Orang")
    y -= 18
    c.drawCentredString(pw / 2, y, f"Di ACC: {len(data_acc)} | Tidak ACC Layak Huni: {len(tidak_acc_layak_huni)} | Tidak ACC Tidak Melanjutkan: {len(tidak_acc_tidak_melanjutkan)}")

    c.showPage()

    # ═══════════════════════════════════════════
    # PAGE 2: DATA PENERIMA YANG DI ACC (Landscape)
    # ═══════════════════════════════════════════

    c.setPageSize(landscape(A4))
    lw, lh = landscape(A4)

    # Section title at top
    c.setFillColor(GREEN_HEADER)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(lw / 2, lh - MARGIN + 10, "I. DATA PENERIMA YANG DI ACC")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#666666"))
    c.drawCentredString(lw / 2, lh - MARGIN - 2, f"Jumlah: {len(data_acc)} Orang")

    # Build table using Platypus and draw on canvas
    available_width = lw - 2 * MARGIN
    col_widths_acc = [
        available_width * 0.04,   # No
        available_width * 0.14,   # Nama
        available_width * 0.18,   # NIK
        available_width * 0.18,   # No KK
        available_width * 0.32,   # Alamat
        available_width * 0.08,   # RT/RW
    ]

    columns_acc = ["No", "Nama", "NIK", "No KK", "Alamat", "RT/RW"]

    # Build table data
    from reportlab.platypus import Table as RLTable, TableStyle as RLTableStyle

    header_row = [make_header_cell(col) for col in columns_acc]
    table_data_acc = [header_row]
    for i, entry in enumerate(data_acc):
        row = [
            make_data_cell_center(str(i + 1)),
            make_data_cell(entry["nama"]),
            make_data_cell_center(str(entry["nik"])),
            make_data_cell_center(str(entry["kk"])),
            make_data_cell(entry["alamat"]),
            make_data_cell_center(f"{entry['rt']}/{entry['rw']}"),
        ]
        table_data_acc.append(row)

    table_acc = RLTable(table_data_acc, colWidths=col_widths_acc, repeatRows=1)
    style_cmds_acc = [
        ("BACKGROUND", (0, 0), (-1, 0), GREEN_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("BOX", (0, 0), (-1, -1), 1.2, GREEN_HEADER),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(table_data_acc)):
        if i % 2 == 0:
            style_cmds_acc.append(("BACKGROUND", (0, i), (-1, i), GREEN_LIGHT))
        else:
            style_cmds_acc.append(("BACKGROUND", (0, i), (-1, i), white))

    table_acc.setStyle(RLTableStyle(style_cmds_acc))

    # Draw table on the canvas
    tw, th = table_acc.wrap(available_width, lh - 2 * MARGIN)
    table_acc.drawOn(c, MARGIN, lh - MARGIN - 20 - th)

    # Footer
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#999999"))
    c.drawCentredString(lw / 2, 15, "Data BSPS - Kecamatan Paseh, Desa Loa - Kabupaten Bandung - 2024")

    c.showPage()

    # ═══════════════════════════════════════════
    # PAGE 3: DATA TIDAK ACC - LAYAK HUNI (Landscape)
    # ═══════════════════════════════════════════

    c.setPageSize(landscape(A4))

    # Section title
    c.setFillColor(YELLOW_HEADER)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(lw / 2, lh - MARGIN + 10, "II. DATA TIDAK ACC - LAYAK HUNI")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#666666"))
    c.drawCentredString(lw / 2, lh - MARGIN - 2, f"Jumlah: {len(tidak_acc_layak_huni)} Orang")

    available_width = lw - 2 * MARGIN
    col_widths_lh = [
        available_width * 0.035,  # No
        available_width * 0.12,   # Nama
        available_width * 0.16,   # NIK
        available_width * 0.16,   # No KK
        available_width * 0.27,   # Alamat
        available_width * 0.07,   # RT/RW
        available_width * 0.185,  # Keterangan
    ]

    columns_lh = ["No", "Nama", "NIK", "No KK", "Alamat", "RT/RW", "Keterangan"]

    header_row_lh = [make_header_cell(col) for col in columns_lh]
    table_data_lh = [header_row_lh]
    for i, entry in enumerate(tidak_acc_layak_huni):
        keterangan = entry.get("keterangan") or "-"
        row = [
            make_data_cell_center(str(i + 1)),
            make_data_cell(entry["nama"]),
            make_data_cell_center(str(entry["nik"])),
            make_data_cell_center(str(entry["kk"])),
            make_data_cell(entry["alamat"]),
            make_data_cell_center(f"{entry['rt']}/{entry['rw']}"),
            make_data_cell(keterangan),
        ]
        table_data_lh.append(row)

    table_lh = RLTable(table_data_lh, colWidths=col_widths_lh, repeatRows=1)
    style_cmds_lh = [
        ("BACKGROUND", (0, 0), (-1, 0), YELLOW_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("BOX", (0, 0), (-1, -1), 1.2, YELLOW_HEADER),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(table_data_lh)):
        if i % 2 == 0:
            style_cmds_lh.append(("BACKGROUND", (0, i), (-1, i), YELLOW_LIGHT))
        else:
            style_cmds_lh.append(("BACKGROUND", (0, i), (-1, i), white))

    table_lh.setStyle(RLTableStyle(style_cmds_lh))

    tw2, th2 = table_lh.wrap(available_width, lh - 2 * MARGIN)
    table_lh.drawOn(c, MARGIN, lh - MARGIN - 20 - th2)

    # Footer
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#999999"))
    c.drawCentredString(lw / 2, 15, "Data BSPS - Kecamatan Paseh, Desa Loa - Kabupaten Bandung - 2024")

    c.showPage()

    # ═══════════════════════════════════════════
    # PAGE 4: DATA TIDAK ACC - TIDAK MELANJUTKAN (Landscape)
    # ═══════════════════════════════════════════

    c.setPageSize(landscape(A4))

    # Section title
    c.setFillColor(RED_HEADER)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(lw / 2, lh - MARGIN + 10, "III. DATA TIDAK ACC - TIDAK MELANJUTKAN")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#666666"))
    c.drawCentredString(lw / 2, lh - MARGIN - 2, f"Jumlah: {len(tidak_acc_tidak_melanjutkan)} Orang")

    col_widths_tm = col_widths_lh  # same columns as layak huni
    columns_tm = ["No", "Nama", "NIK", "No KK", "Alamat", "RT/RW", "Keterangan"]

    header_row_tm = [make_header_cell(col) for col in columns_tm]
    table_data_tm = [header_row_tm]
    for i, entry in enumerate(tidak_acc_tidak_melanjutkan):
        keterangan = entry.get("keterangan") or "-"
        row = [
            make_data_cell_center(str(i + 1)),
            make_data_cell(entry["nama"]),
            make_data_cell_center(str(entry["nik"])),
            make_data_cell_center(str(entry["kk"])),
            make_data_cell(entry["alamat"]),
            make_data_cell_center(f"{entry['rt']}/{entry['rw']}"),
            make_data_cell(keterangan),
        ]
        table_data_tm.append(row)

    table_tm = RLTable(table_data_tm, colWidths=col_widths_tm, repeatRows=1)
    style_cmds_tm = [
        ("BACKGROUND", (0, 0), (-1, 0), RED_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("BOX", (0, 0), (-1, -1), 1.2, RED_HEADER),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(table_data_tm)):
        if i % 2 == 0:
            style_cmds_tm.append(("BACKGROUND", (0, i), (-1, i), RED_LIGHT))
        else:
            style_cmds_tm.append(("BACKGROUND", (0, i), (-1, i), white))

    table_tm.setStyle(RLTableStyle(style_cmds_tm))

    tw3, th3 = table_tm.wrap(available_width, lh - 2 * MARGIN)
    table_tm.drawOn(c, MARGIN, lh - MARGIN - 20 - th3)

    # Footer
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#999999"))
    c.drawCentredString(lw / 2, 15, "Data BSPS - Kecamatan Paseh, Desa Loa - Kabupaten Bandung - 2024")

    c.showPage()

    # ═══════════════════════════════════════════
    # PAGE 5: RINGKASAN (Portrait A4)
    # ═══════════════════════════════════════════

    c.setPageSize(A4)
    pw, ph = A4

    # Decorative top bar
    c.setFillColor(HexColor("#1B5E20"))
    c.rect(0, ph - 40, pw, 40, fill=1, stroke=0)

    # Title
    c.setFillColor(HexColor("#1B5E20"))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(pw / 2, ph - 80, "RINGKASAN DATA BSPS")

    # Subtitle
    c.setFillColor(HexColor("#555555"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(pw / 2, ph - 100, "Kecamatan Paseh - Desa Loa, Kabupaten Bandung")

    # Decorative line
    c.setStrokeColor(HexColor("#4CAF50"))
    c.setLineWidth(1.5)
    c.line(pw * 0.2, ph - 115, pw * 0.8, ph - 115)

    # Summary table
    summary_data = [
        [Paragraph("Keterangan", style_header_cell), Paragraph("Jumlah", style_header_cell)],
        [Paragraph("Di ACC", style_summary_label), Paragraph(f"{len(data_acc)} Orang", style_summary_value)],
        [Paragraph("Tidak ACC - Layak Huni", style_summary_label), Paragraph(f"{len(tidak_acc_layak_huni)} Orang", style_summary_value)],
        [Paragraph("Tidak ACC - Tidak Melanjutkan", style_summary_label), Paragraph(f"{len(tidak_acc_tidak_melanjutkan)} Orang", style_summary_value)],
    ]

    # Total row
    style_total_label = ParagraphStyle(
        "TotalLabel",
        parent=style_summary_label,
        fontName="Helvetica-Bold",
        fontSize=13,
    )
    style_total_value = ParagraphStyle(
        "TotalValue",
        parent=style_summary_value,
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=HexColor("#1B5E20"),
    )

    summary_data.append([
        Paragraph("TOTAL PENERIMA", style_total_label),
        Paragraph(f"{len(all_data)} Orang", style_total_value),
    ])

    summary_table = RLTable(summary_data, colWidths=[pw * 0.5, pw * 0.25])
    summary_style = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("BOX", (0, 0), (-1, -1), 1.5, BLUE_HEADER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        # Alternating colors
        ("BACKGROUND", (0, 1), (-1, 1), GREEN_LIGHT),
        ("BACKGROUND", (0, 2), (-1, 2), YELLOW_LIGHT),
        ("BACKGROUND", (0, 3), (-1, 3), RED_LIGHT),
        ("BACKGROUND", (0, 4), (-1, 4), BLUE_LIGHT),
        # Total row border
        ("LINEABOVE", (0, 4), (-1, 4), 2, BLUE_HEADER),
    ]
    summary_table.setStyle(RLTableStyle(summary_style))

    stw, sth = summary_table.wrap(pw, ph)
    summary_table.drawOn(c, (pw - stw) / 2, ph - 160 - sth)

    # Breakdown section
    breakdown_y = ph - 160 - sth - 40
    c.setFillColor(HexColor("#333333"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(pw / 2, breakdown_y, "Rincian Kategori Tidak ACC - Layak Huni")

    # Count sub-categories
    from collections import Counter
    layak_huni_details = Counter()
    for entry in tidak_acc_layak_huni:
        keterangan = entry.get("keterangan") or "Tidak Diketahui"
        layak_huni_details[keterangan] += 1

    detail_y = breakdown_y - 25
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#555555"))
    for keterangan, count in layak_huni_details.items():
        c.drawCentredString(pw / 2, detail_y, f"• {keterangan}: {count} orang")
        detail_y -= 18

    # Footer
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#999999"))
    c.drawCentredString(pw / 2, 25, "Data BSPS - Kecamatan Paseh, Desa Loa - Kabupaten Bandung - 2024")

    # Bottom decorative bar
    c.setFillColor(HexColor("#1B5E20"))
    c.rect(0, 0, pw, 15, fill=1, stroke=0)

    c.save()
    print(f"PDF generated successfully: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
