// Bundles the web game into the Android assets folder (and a web demo copy).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { logoSVG } from '../game/src/art/logo.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outs = [path.join(root, 'android/app/src/main/assets/www'), path.join(root, 'web')];
const dev = process.argv.includes('--dev');

for (const out of outs) fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
await build({
  entryPoints: [path.join(root, 'game/src/main.js')], bundle: true, minify: !dev, sourcemap: dev ? 'inline' : false,
  target: ['chrome80'], outfile: path.join(outs[0], 'app.js'), legalComments: 'none',
});
await build({ entryPoints: [path.join(root, 'game/src/style.css')], bundle: true, minify: !dev, outfile: path.join(outs[0], 'app.css'), external: ['fonts/*'], target: ['chrome80'] });
const html = fs.readFileSync(path.join(root, 'game/index.html'), 'utf8').replace('%LOGO%', logoSVG());
fs.writeFileSync(path.join(outs[0], 'index.html'), html);
const fonts = {
  'fredoka-500.woff2': '@fontsource/fredoka/files/fredoka-latin-500-normal.woff2',
  'fredoka-600.woff2': '@fontsource/fredoka/files/fredoka-latin-600-normal.woff2',
  'fredoka-700.woff2': '@fontsource/fredoka/files/fredoka-latin-700-normal.woff2',
  'nunito-600.woff2': '@fontsource/nunito/files/nunito-latin-600-normal.woff2',
  'nunito-800.woff2': '@fontsource/nunito/files/nunito-latin-800-normal.woff2',
};
for (const [dst, src] of Object.entries(fonts)) fs.copyFileSync(path.join(root, 'node_modules', src), path.join(outs[0], 'fonts', dst));
// mirror to web/
for (const f of ['index.html', 'app.js', 'app.css']) fs.copyFileSync(path.join(outs[0], f), path.join(outs[1], f));
for (const f of Object.keys(fonts)) fs.copyFileSync(path.join(outs[0], 'fonts', f), path.join(outs[1], 'fonts', f));
console.log('built', (fs.statSync(path.join(outs[0], 'app.js')).size / 1024).toFixed(0) + ' KB js');
