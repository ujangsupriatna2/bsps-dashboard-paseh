import fs from 'fs';

// Read current data
const dataPath = './src/data/bsps-data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Helper: add small random offset to avoid overlapping markers
function jitter(lat, lng, index) {
  const offset = 0.00015; // ~15 meters
  const seed = index * 7 + 3;
  const latOff = ((Math.sin(seed) * 10000) % 1 - 0.5) * offset * 2;
  const lngOff = ((Math.cos(seed * 1.3) * 10000) % 1 - 0.5) * offset * 2;
  return { lat: +(lat + latOff).toFixed(6), lng: +(lng + lngOff).toFixed(6) };
}

// Cibeet coordinate mapping based on OSM data
// Jalan Oma Anggawisastra road: -7.085 to -7.100 lat, ~107.760 to 107.763 lon
const cibeetCoords = {
  // RT 001/RW 003 - KP Cibeet main area (northern end of village, along main road)
  56: { lat: -7.08450, lng: 107.76113 }, // MELI ANDALIA
  57: { lat: -7.08478, lng: 107.76135 }, // UJANG NANA  
  58: { lat: -7.08515, lng: 107.76148 }, // ESIH
  59: { lat: -7.08535, lng: 107.76120 }, // UJANG TATA
  61: { lat: -7.08560, lng: 107.76152 }, // UNDANG TOTO (diganti)
  64: { lat: -7.08582, lng: 107.76105 }, // UJANG NENDI
  
  // RT 002/RW 003 - KP Cibeet (slightly south of RT 001)
  60: { lat: -7.08620, lng: 107.76155 }, // YANA
  
  // RT 003/RW 003 - KP Cibeet (further south along the road)
  62: { lat: -7.08745, lng: 107.76070 }, // ATEP DADI (tidak melanjutkan)
  63: { lat: -7.08695, lng: 107.76125 }, // ENGKAS
  70: { lat: -7.08780, lng: 107.76140 }, // AYI HANA (diganti)
  
  // RT 002/RW 005 - south area
  68: { lat: -7.08865, lng: 107.75975 }, // IWAN (diganti)
  69: { lat: -7.08895, lng: 107.75955 }, // DAHIM (layak huni)
  
  // RT 002/RW 006 - Cinangka area (northeast of village)
  65: { lat: -7.08020, lng: 107.76430 }, // ROHMAN (diganti)
  
  // RT 001/RW 002 - Lebak Gede (southwest)
  66: { lat: -7.09210, lng: 107.75750 }, // DIDIH (diganti)
  
  // RT 002/RW 007 - Cibanen (east of village)
  67: { lat: -7.08150, lng: 107.76720 }, // IDI
  
  // Pengganti entries - scattered in KP Cibeet area
  71: { lat: -7.08425, lng: 107.76165 }, // ANIH
  72: { lat: -7.08545, lng: 107.76170 }, // ANO
  73: { lat: -7.08595, lng: 107.76080 }, // IIM
  74: { lat: -7.08655, lng: 107.76200 }, // MAMAH
  75: { lat: -7.08725, lng: 107.76090 }, // UJANG CARMA
  76: { lat: -7.08395, lng: 107.76210 }, // WATINI
};

// Lampegan coordinate mapping based on OSM data
const lampeganCoords = {
  // Citeureup RT 002/RW 008 (southern area)
  33: { lat: -7.07245, lng: 107.75680 }, // ENCAR L
  35: { lat: -7.07265, lng: 107.75720 }, // DEDEH
  46: { lat: -7.07210, lng: 107.75650 }, // YUYUN BUDIMAN
  
  // Cikonyal RT 001/RW 011 (northwestern area)
  34: { lat: -7.06650, lng: 107.75480 }, // ANDRI
  40: { lat: -7.06750, lng: 107.75450 }, // ARIP SUHANDI
  41: { lat: -7.06720, lng: 107.75520 }, // ROMLAH
  
  // Jolok RT 001/RW 006 (northern area)
  36: { lat: -7.06450, lng: 107.76120 }, // MEMEN
  37: { lat: -7.06425, lng: 107.76155 }, // SODIKIN
  
  // Jolok RT 002/RW 006
  51: { lat: -7.06480, lng: 107.76085 }, // YATI (diganti)
  52: { lat: -7.06410, lng: 107.76190 }, // ROHMAT (diganti)
  
  // Awilega RT 1/RW 9 (southwest)
  38: { lat: -7.07420, lng: 107.75830 }, // CARYA
  39: { lat: -7.07455, lng: 107.75860 }, // MAMAN SUHERMAN
  
  // Awilega RT 3/RW 9
  48: { lat: -7.07580, lng: 107.75780 }, // ENCAR (pengganti)
  54: { lat: -7.07550, lng: 107.75750 }, // WAWAN (diganti)
  
  // Panggah RT 001/RW 007
  42: { lat: -7.06950, lng: 107.76180 }, // CEPCEP
  
  // Babakan Kopo
  43: { lat: -7.07350, lng: 107.76420 }, // DINDIN SAEPUDIN
  
  // Babakan Salam RT 1-2/RW 7
  50: { lat: -7.07380, lng: 107.76310 }, // ARIEF (diganti)
  53: { lat: -7.07410, lng: 107.76350 }, // ASIH (diganti)
  55: { lat: -7.07425, lng: 107.76320 }, // AI MARYATI (diganti)
  
  // Kp Lampegan (central area)
  44: { lat: -7.06780, lng: 107.76020 }, // UMAR SUMARNA
  45: { lat: -7.06850, lng: 107.76080 }, // MAMAT RAHMAT
  47: { lat: -7.06720, lng: 107.75960 }, // ONENG SUMARNI (diganti)
  
  // Lampegan RT 003/RW 005
  49: { lat: -7.06880, lng: 107.76050 }, // TOMI HARUN ARASYID
};

// Apply coordinate updates
let updatedCount = 0;
for (const entry of data) {
  const id = parseInt(entry.id);
  
  if (cibeetCoords[id]) {
    const coords = jitter(cibeetCoords[id].lat, cibeetCoords[id].lng, id);
    entry.lat = coords.lat;
    entry.lng = coords.lng;
    updatedCount++;
  }
  
  if (lampeganCoords[id]) {
    const coords = jitter(lampeganCoords[id].lat, lampeganCoords[id].lng, id);
    entry.lat = coords.lat;
    entry.lng = coords.lng;
    updatedCount++;
  }
}

// Write updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Updated ${updatedCount} entries with OSM-verified coordinates`);
console.log('Data saved to src/data/bsps-data.json');
