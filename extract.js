const fs = require('fs');

// index.html dosyasını oku
const html = fs.readFileSync('index.html', 'utf8');

// <body> içeriğini regex ile yakala
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

// <style> içeriğini regex ile yakala (tüm style bloklarını bul)
const styleMatches = [];
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
let styleMatch;
while ((styleMatch = styleRegex.exec(html)) !== null) {
  styleMatches.push(styleMatch[1].trim());
}

let success = true;

// body.html dosyasına body içeriğini yaz
if (bodyMatch && bodyMatch[1]) {
  fs.writeFileSync('body.html', bodyMatch[1].trim());
  console.log('Body içeriği body.html dosyasına yazıldı.');
} else {
  console.error('Body içeriği bulunamadı!');
  success = false;
}

// style.html dosyasına style içeriğini yaz
if (styleMatches.length > 0) {
  fs.writeFileSync('style.html', styleMatches.join('\n\n'));
  console.log('Style içeriği style.html dosyasına yazıldı.');
} else {
  console.error('Style içeriği bulunamadı!');
  success = false;
}

if (!success) {
  process.exit(1);
}