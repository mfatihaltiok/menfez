/**
 * Tek dosya (standalone) derleme betiği.
 *
 * Tüm JS/CSS çıktısını TEK bir HTML dosyasına gömer. Böylece uygulama
 * Node.js, internet veya herhangi bir kurulum gerektirmeden, tarayıcıda
 * "file://" üzerinden çalıştırılabilir.
 *
 * Çıktı: release/TCDD_Kutu_Menfez.html
 *
 * Kullanım:  npm run build:standalone
 */
import { build } from 'vite';

process.env.BUILD_STANDALONE = '1';

await build({ mode: 'production' });

console.log('\n✔ Tek dosya derlemesi tamamlandı: release/TCDD_Kutu_Menfez.html');
console.log('  Uygulamayı açmak için proje kökündeki "baslat.bat" dosyasını çalıştırın.\n');
