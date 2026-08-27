// Build a single-file playable HTML from src/ (for mobile playtesting).
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src');
const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');

const inlineCss = (m, file) =>
  '<style>\n' + fs.readFileSync(path.join(src, file), 'utf8') + '\n</style>';
const inlineJs = (m, file) =>
  '<script>\n' + fs.readFileSync(path.join(src, file), 'utf8') + '\n</script>';

const out = html
  .replace(/<link rel="stylesheet" href="([^"]+)">/g, inlineCss)
  .replace(/<script src="([^"]+)"><\/script>/g, inlineJs);

const dest = process.argv[2] || path.join(__dirname, '..', 'playtest.html');
fs.writeFileSync(dest, out);
console.log('wrote', dest, out.length, 'bytes');
