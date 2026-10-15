/**
 * Tek dosya (standalone) HTML çıktısının smoke testi.
 *
 * jsdom ile `release/TCDD_Kutu_Menfez.html` yüklenir; uygulamanın `file://`
 * altında DOM'a render olduğu, hata üretmediği ve tüm sekmelerin çalıştığı
 * doğrulanır.
 *
 * Kullanım:  npm run test:smoke
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appPath = path.join(root, 'release', 'TCDD_Kutu_Menfez.html');

if (!existsSync(appPath)) {
  console.error(`[HATA] Bulunamadı: ${appPath}`);
  console.error('       Önce `npm run build:standalone` çalıştırın.');
  process.exit(1);
}

const html = readFileSync(appPath, 'utf-8');
const errors = [];
const envWarnings = [];

/**
 * jsdom ortamının desteklemediği / tarayıcıya özgü durumlar.
 * Bunlar uygulama hatası değildir; ayrı tutulur.
 */
const ENV_PATTERNS = [
  /Not implemented: HTMLCanvasElement\.prototype\.getContext/,
  /THREE\.WebGLRenderer:.*Error creating WebGL context/i,
];

function record(msg) {
  if (ENV_PATTERNS.some((re) => re.test(msg))) envWarnings.push(msg);
  else errors.push(msg);
}

const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (e) => record('jsdomError: ' + (e.message || String(e))));
virtualConsole.on('error', (...args) => record('console.error: ' + args.join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: `file://${appPath.replace(/\\/g, '/')}`,
  virtualConsole,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(3000);

const doc = dom.window.document;
const app = doc.getElementById('root');

console.log('=== SMOKE TEST: release/TCDD_Kutu_Menfez.html (file://) ===');
console.log('root icerik uzunlugu :', app ? app.innerHTML.length : 'YOK');
console.log('svg (2B kesit)       :', doc.querySelectorAll('svg').length);
console.log('tab butonlari       :', doc.querySelectorAll('header nav button').length);
console.log('hata sayisi          :', errors.length);

// --- Sekmeleri gez ve her birinin render olduğunu doğrula ---
// Masaüstünde sekmeler header içindeki nav'da, mobilde ise sayfa altındaki
// nav çubuğunda bulunur; bu yüzden her iki yer de taranır.
const labels = [
  ['2B Kesit', '2B Kesit'],
  ['3B Mesh', '3B'],
  ['SAP2000', 'SAP2000'],
  ['Donatı', 'Donatı'],
  ['Metraj', 'Metraj'],
];
const failedTabs = [];

for (const [label, match] of labels) {
  const buttons = Array.from(doc.querySelectorAll('nav button'));
  const btn = buttons.find((b) => b.textContent?.includes(match));
  if (!btn) {
    console.log(`  [${label}] butonu bulunamadi`);
    failedTabs.push(label);
    continue;
  }
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait(400);
  const len = app ? app.innerHTML.length : 0;
  console.log(`  [${label}] render uzunlugu = ${len}`);
  if (len < 1000) failedTabs.push(label);

  // 3B sekmesi: WebGL yoksa uygulamanın bilgilendirme katmanını göstermesi beklenir
  if (label === '3B Mesh') {
    await wait(800);
    const hasFallback = (app?.textContent || '').includes('3B Görünüm Kullanılamıyor');
    const hasCanvas = doc.querySelectorAll('canvas').length > 0;
    console.log(`  [3B Mesh] canvas = ${hasCanvas}, WebGL yedek katmanı = ${hasFallback}`);
    if (!hasFallback && !hasCanvas) failedTabs.push('3B Mesh (WebGL yedek katmanı yok)');
  }
}

// --- Hesap raporunu ac ---
let modalOk = false;
const printBtn = Array.from(doc.querySelectorAll('header button')).find((b) =>
  b.textContent?.includes('Hesap Raporu')
);
if (printBtn) {
  printBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait(600);
  const modal = doc.querySelector('.fixed.inset-0');
  modalOk = !!modal;
  const uygun = modal ? (modal.textContent?.match(/UYGUN/g) || []).length : 0;
  console.log(`  [Hesap Raporu] modal acik = ${modalOk}, "UYGUN" sayisi = ${uygun}`);
}

console.log('\n=== SONUÇ ===');
const ok = errors.length === 0 && !!app && app.innerHTML.length > 1000 && failedTabs.length === 0 && modalOk;
console.log('  kontrol:', JSON.stringify({ errors: errors.length, rootVar: !!app, rootLen: app?.innerHTML.length, failedTabs, modalOk }));
if (envWarnings.length) {
  console.log(`  ortam uyarisi (uygulama hatasi degil): ${envWarnings.length}`);
}
if (errors.length) {
  console.log('  --- HATALAR ---');
  errors.slice(0, 10).forEach((e) => console.log('   *', e.slice(0, 500)));
}
if (ok) {
  console.log('BASARILI: Uygulama dosya:// uzerinden hatasiz render oldu.');
} else {
  if (failedTabs.length) console.log('  Sorunlu sekmeler:', failedTabs.join(', '));
  if (!modalOk) console.log('  Hesap raporu modalı açılamadı.');
  console.log('DIKKAT: Yukaridaki hatalara bakin.');
  process.exitCode = 1;
}

dom.window.close();
