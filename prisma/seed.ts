import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bspsData = [
  // === DATA AWAL (9 entri - non layak huni) ===
  {
    nama: "AAM", nik: "3204350610650002", kk: "3204352312050145",
    alamat: "KP.LENGO RT 2 RW 11", kecamatan: "Paseh", desa: "Loa", rt: "2", rw: "11",
    lat: -7.066851, lng: 107.78175572, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/aam"
  },
  {
    nama: "ADANG", nik: "3204352905890001", kk: "3204351612210006",
    alamat: "KP. CIDADAP RT 5 RW 5", kecamatan: "Paseh", desa: "Loa", rt: "5", rw: "5",
    lat: -7.07272036, lng: 107.78008687, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/adang"
  },
  {
    nama: "ADE", nik: "3204351205630001", kk: "3204351903050814",
    alamat: "KP.MALANG RT 5 RW 6", kecamatan: "Paseh", desa: "Loa", rt: "5", rw: "6",
    lat: -7.08145216, lng: 107.79557977, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/ade"
  },
  {
    nama: "ANAH", nik: "3204354304480004", kk: "3204352201200003",
    alamat: "KP.NENGKONG RT 2 RW 4", kecamatan: "Paseh", desa: "Loa", rt: "2", rw: "4",
    lat: -7.08973777, lng: 107.78743568, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/anah"
  },
  {
    nama: "ENGKUS", nik: "3204350408910001", kk: "320435087190015",
    alamat: "KP. TIISDINGIN RT 2 RW 6", kecamatan: "Paseh", desa: "Loa", rt: "2", rw: "6",
    lat: -7.07871371, lng: 107.79092113, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/engkus"
  },
  {
    nama: "ENDANG SARGA", nik: "3204350911550003", kk: "3204352903110009",
    alamat: "KP.TIISDINGIN RT 2 RW 6", kecamatan: "Paseh", desa: "Loa", rt: "2", rw: "6",
    lat: -7.07856038, lng: 107.79085138, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/endang sarga"
  },
  {
    nama: "SARIFUDIN", nik: "3204352307940008", kk: "3204352609140021",
    alamat: "KP.LOA RT 3 RW 10", kecamatan: "Paseh", desa: "Loa", rt: "3", rw: "10",
    lat: -7.07484315, lng: 107.78680648, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/saripudin"
  },
  {
    nama: "WAHYU WIBISANA", nik: "3204353112600001", kk: "3204350701060146",
    alamat: "LIMUS MANGGUNG RT 3 RW 8", kecamatan: "Paseh", desa: "Loa", rt: "3", rw: "8",
    lat: -7.09607219, lng: 107.79013286, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/wahyu wibisana"
  },
  {
    nama: "WARSA", nik: "3204351002711001", kk: "3204351609140013",
    alamat: "KP. BUKATANAH RT 2 RW 3", kecamatan: "Paseh", desa: "Loa", rt: "2", rw: "3",
    lat: -7.0857243, lng: 107.79673617, kategori: "data_awal", keterangan: null,
    folderPath: "/dokumentasi/warsa"
  },

  // === LAYAK HUNI (11 entri) ===
  {
    nama: "PARI", nik: "3204364406880002", kk: "3204361108120039",
    alamat: "KP. CICINAR RT 1 RW 12", kecamatan: "Paseh", desa: "Loa", rt: "1", rw: "12",
    lat: -7.08472292, lng: 107.79085082, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/lalan - layak huni - dibangun pribadi"
  },
  {
    nama: "ENDANG", nik: "3204352504720003", kk: "3204352508050102",
    alamat: "KP. LOA RT 3 RW 10", kecamatan: "Paseh", desa: "Loa", rt: "3", rw: "10",
    lat: -7.07448163, lng: 107.78844668, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/endang - layak huni - dibangun pribadi"
  },
  {
    nama: "U.ODIN", nik: "3204351108770005", kk: "3204351009120001",
    alamat: "KP.MEKAR SARI RT 3 RW 9", kecamatan: "Paseh", desa: "Loa", rt: "3", rw: "9",
    lat: -7.07406425, lng: 107.79138696, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/u odin - layak huni - dibangun pribadi"
  },
  {
    nama: "TOTO TARMALA", nik: "3204350101920001", kk: "3204351803050561",
    alamat: "KP LOA RT 4 RW 2", kecamatan: "Paseh", desa: "Loa", rt: "4", rw: "2",
    lat: -7.0740836, lng: 107.788137422, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/toto tarmala - layak huni -dibangun pribadi"
  },
  {
    nama: "UJANG TIMAN", nik: "3204351508760018", kk: "3204351211130013",
    alamat: "KP LOA RT 4 RW 2", kecamatan: "Paseh", desa: "Loa", rt: "4", rw: "2",
    lat: -7.07393784, lng: 107.78834522, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/ujang timan - layak huni - dibangun pribadi"
  },
  {
    nama: "EMEH", nik: "3204354107590197", kk: "3204352210070031",
    alamat: "MALINGPING RT 4 RW 8", kecamatan: "Paseh", desa: "Loa", rt: "4", rw: "8",
    lat: -7.096682, lng: 107.789848, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/emeh - layak huni - dibangun pribadi"
  },
  {
    nama: "TATAN RUSTANDI", nik: "3203151003900004", kk: "3204350304200001",
    alamat: "KP LOA RT 4 RW 2", kecamatan: "Paseh", desa: "Loa", rt: "4", rw: "2",
    lat: -7.07424439, lng: 107.78845114, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/tatan rustandi - layak huni - dibangun pribadi"
  },
  {
    nama: "HADI", nik: "3204352502820008", kk: "3204351004070008",
    alamat: "CIDADAP RT 5 RW 5", kecamatan: "Paseh", desa: "Loa", rt: "5", rw: "5",
    lat: -7.08478348, lng: 107.79096854, kategori: "layak_huni", keterangan: "dibantu desa",
    folderPath: "/dokumentasi/hadi - layak huni - dibantu desa"
  },
  {
    nama: "ILPAN SETIA MULYA", nik: "3204332811900005", kk: "3204352506130041",
    alamat: "KP. TIISDINGIN RT 1 RW 6", kecamatan: "Paseh", desa: "Loa", rt: "1", rw: "6",
    lat: -7.077608, lng: 107.791801, kategori: "layak_huni", keterangan: "dibangun pribadi",
    folderPath: "/dokumentasi/ilpan setia mulya - layak huni - dibangun pribadi"
  },
  {
    nama: "SAEPULOH", nik: "3204351406940003", kk: "3204352909220007",
    alamat: "KP. LOA RT 3 RW 10", kecamatan: "Paseh", desa: "Loa", rt: "3", rw: "10",
    lat: -7.07462609, lng: 107.78839402, kategori: "layak_huni", keterangan: "tidak ditempati",
    folderPath: "/dokumentasi/saepuloh - layak huni - tidak ditempati"
  },
  {
    nama: "EHA", nik: "3204355002550004", kk: "3204353009220015",
    alamat: "KP. LOA RT 3 RW 10", kecamatan: "Paseh", desa: "Loa", rt: "3", rw: "10",
    lat: -7.07517481, lng: 107.78658577, kategori: "layak_huni", keterangan: "dibantu desa",
    folderPath: "/dokumentasi/eha - layak huni - dibantu desa"
  },

  // === DATA SUSULAN (6 entri) ===
  {
    nama: "AHMAD", nik: "3204351702540001", kk: "3204352508500248",
    alamat: "KP CILOPANG 001/003", kecamatan: "Paseh", desa: "Loa", rt: "01", rw: "03",
    lat: -7.08283488, lng: 107.79459227, kategori: "data_susulan", keterangan: null,
    folderPath: "/dokumentasi/ahmad - susulan pic"
  },
  {
    nama: "ASEPA AN SAEPUDIN", nik: "3204350901750002", kk: "3204351208160008",
    alamat: "KP LOA RT 01/01", kecamatan: "Paseh", desa: "Loa", rt: "01", rw: "01",
    lat: -7.06993095, lng: 107.78665329, kategori: "data_susulan", keterangan: null,
    folderPath: "/dokumentasi/asep aan - susulan pic"
  },
  {
    nama: "DANA", nik: "3204352610750003", kk: "3204351903051537",
    alamat: "KP SUKA GEUNAH RT 01/05", kecamatan: "Paseh", desa: "Loa", rt: "01", rw: "05",
    lat: -7.07811971, lng: 107.78832886, kategori: "data_susulan", keterangan: null,
    folderPath: "/dokumentasi/dana - susulan pic"
  },
  {
    nama: "ECIN", nik: "3204356010480002", kk: "3204352312050057",
    alamat: "KP BARUNAI RT 00/04", kecamatan: "Paseh", desa: "Loa", rt: "00", rw: "04",
    lat: -7.09196646, lng: 107.78616176, kategori: "data_susulan", keterangan: null,
    folderPath: "/dokumentasi/ecin - susulan pic"
  },
  {
    nama: "NURHAYATI", nik: "3204354805770008", kk: "3204351903050323",
    alamat: "KP CILOPANG RT 02 RW 07", kecamatan: "Paseh", desa: "Loa", rt: "02", rw: "07",
    lat: -7.0848874, lng: 107.79678709, kategori: "data_susulan", keterangan: null,
    folderPath: "/dokumentasi/nurhayati - susulan pic"
  },
  {
    nama: "TARLAN", nik: "3204351808630003", kk: "3204352405110065",
    alamat: "KP CILOPANG RT 04/07", kecamatan: "Paseh", desa: "Loa", rt: "04", rw: "07",
    lat: -7.08333318, lng: 107.79359855, kategori: "data_susulan", keterangan: null,
    folderPath: "/dokumentasi/Tarlan - susulan pic"
  },

  // === DATA CADANGAN (11 entri) ===
  {
    nama: "AAN ANITA", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.07224619, lng: 107.78124596, kategori: "data_cadangan", keterangan: "Kadus kelima",
    folderPath: "/dokumentasi/cadangan/aan anita - CP - Kadus kelima"
  },
  {
    nama: "CARMA DEDI", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.08219048, lng: 107.78767877, kategori: "data_cadangan", keterangan: "Kadus kedua",
    folderPath: "/dokumentasi/cadangan/carma dedi - CP - kadus kedua"
  },
  {
    nama: "DEDI MULAYANA", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.09504428, lng: 107.79416797, kategori: "data_cadangan", keterangan: "Kadus pertama",
    folderPath: "/dokumentasi/cadangan/dedi mulayana - CP - kadus pertama"
  },
  {
    nama: "DENI", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.06779708, lng: 107.78490439, kategori: "data_cadangan", keterangan: "Kadus keempat",
    folderPath: "/dokumentasi/cadangan/deni - CP - kadus keempat"
  },
  {
    nama: "EKUR", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.07493235, lng: 107.78669428, kategori: "data_cadangan", keterangan: "Kadus kelima",
    folderPath: "/dokumentasi/cadangan/ekur - CP - kadus kelima"
  },
  {
    nama: "HERLINA", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.07335865, lng: 107.78746782, kategori: "data_cadangan", keterangan: "Kadus ketiga",
    folderPath: "/dokumentasi/cadangan/herlina - CP - kadus ketiga"
  },
  {
    nama: "ICAH", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.07946427, lng: 107.78655359, kategori: "data_cadangan", keterangan: "Kadus kedua",
    folderPath: "/dokumentasi/cadangan/icah - CP - kadus kedua"
  },
  {
    nama: "LIPA", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.08362656, lng: 107.79262527, kategori: "data_cadangan", keterangan: "Kadus kedua",
    folderPath: "/dokumentasi/cadangan/lipa - CP - kadus kedua"
  },
  {
    nama: "NANDANG", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.08714702, lng: 107.79010184, kategori: "data_cadangan", keterangan: "Kadus kedua",
    folderPath: "/dokumentasi/cadangan/nandang - CP kadus kedua"
  },
  {
    nama: "UJANG JUJUN", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.07355993, lng: 107.78683808, kategori: "data_cadangan", keterangan: "Kadus ketiga",
    folderPath: "/dokumentasi/cadangan/ujang jujun - CP -kadus ketiga"
  },
  {
    nama: "UJANG KIKIN", nik: "-", kk: "-",
    alamat: null, kecamatan: "Paseh", desa: "Loa", rt: null, rw: null,
    lat: -7.07427454, lng: 107.79129909, kategori: "data_cadangan", keterangan: "Kadus ketiga",
    folderPath: "/dokumentasi/cadangan/ujang kikin - CP - kadus ketiga"
  }
];

async function main() {
  console.log("Seeding BSPS data...");
  await prisma.bspsData.deleteMany();
  for (const data of bspsData) {
    await prisma.bspsData.create({ data });
  }
  const count = await prisma.bspsData.count();
  console.log(`Seeded ${count} BSPS data entries`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
