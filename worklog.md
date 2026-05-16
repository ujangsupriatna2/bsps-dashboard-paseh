---
Task ID: 1
Agent: Main Agent
Task: Add Lampegan data entries and 7 "tidak lolos" entries to BSPS dashboard

Work Log:
- Read existing bsps-data.json (49 entries) and photo-manifest.json
- Attempted Google Drive download (gdown installed, folder too large for full download)
- Checked existing Lampegan photos in public/dokumentasi/lampegan/ (16 folders already present)
- Extracted EXIF data from existing photos - no GPS coordinates found
- Updated entry 33: CIREM → ENCAR L (NIK 3204364101600008 confirmed match)
- Updated entry 49: TOMI HARUN ARASYID with NIK 3204360505780007, KK 3204360906051418, alamat KP. Lampegan RT 003 RW 005
- Added 7 new "tidak_acc_layak_huni" entries (IDs 50-56):
  1. ARIEF MOCHAMAD IKBAL - Diganti oleh Andri
  2. YATI - Diganti oleh Memen
  3. ROHMAT - Diganti oleh Sodikin
  4. ASIH - Diganti oleh Dedeh
  5. WAWAN SETIAWAN - Diganti oleh Encar
  6. AI MARYATI - Diganti oleh Cecep
  7. ONENG - Diganti oleh Tomi Harun Arasyid
- Removed cirem entry from photo-manifest.json, fixed trailing comma
- Regenerated Excel, Word, PDF documents (now named Data_BSPS_Paseh_Loa_Lampegan.*)
- Removed old document files (Data_BSPS_Paseh_Loa.*)
- Lint passed, committed and pushed to git

Stage Summary:
- Total entries: 56 (36 data_acc, 18 tidak_acc_layak_huni, 2 tidak_acc_tidak_melanjutkan)
- Desa Loa: 32 entries | Desa Lampegan: 24 entries
- Coordinates for 7 new entries are estimated based on address areas
- ONENG entry has placeholder NIK/KK ("-") - needs actual data
- Documents regenerated with both desa data
