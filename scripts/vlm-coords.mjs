import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function analyzePhoto(zai, photoPath, name, desa) {
  const imageBuffer = fs.readFileSync(photoPath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = photoPath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const prompt = `Ini adalah foto dokumentasi rumah penerima bantuan BSPS milik ${name} di ${desa}, Kecamatan Ibun, Kabupaten Bandung, Jawa Barat, Indonesia. 
Analisis foto ini dan berikan:
1. Deskripsi kondisi rumah
2. Apakah ada papan nama/tanda lokasi yang terlihat?
3. Ciri-ciri lingkungan sekitar
4. Jika ada teks atau tulisan yang terlihat, tuliskan semuanya

Jawab dalam bahasa Indonesia secara ringkas.`;

  try {
    const response = await zai.chat.completions.createVision({
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
        ]
      }],
      thinking: { type: 'disabled' }
    });
    return response.choices[0]?.message?.content || 'No response';
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

async function main() {
  const zai = await ZAI.create();
  
  // Cibeet folders
  const cibeetDir = './public/dokumentasi/cibeet';
  const folders = fs.readdirSync(cibeetDir).filter(f => fs.statSync(path.join(cibeetDir, f)).isDirectory());
  
  const results = [];
  
  for (const folder of folders) {
    const folderPath = path.join(cibeetDir, folder);
    const files = fs.readdirSync(folderPath);
    const photo = files.find(f => f.startsWith('depan') && f.match(/\.(jpg|jpeg)$/i)) || files.find(f => f.match(/\.(jpg|jpeg)$/i));
    
    if (photo) {
      const photoPath = path.join(folderPath, photo);
      console.log(`Analyzing: ${folder}/${photo}`);
      const result = await analyzePhoto(zai, photoPath, folder, 'Desa Cibeet');
      console.log(`Result: ${result.substring(0, 200)}...`);
      results.push({ folder, photo, result });
      await delay(5000); // 5 second delay between calls
    }
  }
  
  fs.writeFileSync('./vlm-cibeet-results.json', JSON.stringify(results, null, 2));
  console.log('Done! Results saved to vlm-cibeet-results.json');
}

main();
