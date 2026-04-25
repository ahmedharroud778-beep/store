// This script downloads all unique image URLs from products.ts into public/assets
// and prints out the mapping for updating your code to use local paths.

const fs = require('fs');
const path = require('path');
const https = require('https');

const urls = [
  'https://images.unsplash.com/photo-1637690048998-1e41c61c254d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1638717366457-dbcaf6b1afbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1638717368287-5f1f65e8bfdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1635693047196-cc0976305ae9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1764179690401-b7032ffaf7b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1764179690227-af049306cd20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1760551937537-a29dbbfab30b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1755151606192-1c4b4bb88390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1629380321696-99d97eaa492a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1629380321590-3b3f75d66dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1760764541302-e3955fbc6b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1771523353042-981551738dd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1763824372117-1ff339b522e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1763824371988-8c8eb3d13eff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
];

const outDir = path.join(__dirname, '../public/assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function urlToFilename(url) {
  // Use a short hash or the last part of the URL for uniqueness
  const base = url.split('/').pop().split('?')[0];
  const hash = Buffer.from(url).toString('base64').slice(0, 8);
  return `${hash}_${base || 'img'}.jpg`;
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(`Failed to get '${url}' (${response.statusCode})`);
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err.message);
    });
  });
}

(async () => {
  const mapping = {};
  for (const url of urls) {
    const filename = urlToFilename(url);
    const dest = path.join(outDir, filename);
    mapping[url] = `/assets/${filename}`;
    if (!fs.existsSync(dest)) {
      console.log(`Downloading ${url} -> ${dest}`);
      try {
        await download(url, dest);
      } catch (e) {
        console.error(`Error downloading ${url}:`, e);
      }
    } else {
      console.log(`Already exists: ${dest}`);
    }
  }
  console.log('\n--- URL to Local Path Mapping ---');
  for (const [url, local] of Object.entries(mapping)) {
    console.log(`${url} => ${local}`);
  }
})();
