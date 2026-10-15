import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { promises as fs } from 'fs';
import { defineConfig, type Plugin } from 'vite';

const STANDALONE_HTML_NAME = 'TCDD_Kutu_Menfez.html';

/**
 * "Tek dosya" derleme eklentisi.
 *
 * Tüm JS ve CSS çıktısını index.html içine gömer; böylece uygulama tek bir
 * HTML dosyası olarak, Node.js / internet / kurulum gerektirmeden
 * "file://" üzerinden çalıştırılabilir.
 *
 * Not: Vite 8 / Rolldown, generateBundle içinde bundle nesnesini değiştirmeyi
 * desteklemez. Bu yüzden birleştirme writeBundle aşamasında, disk üzerinden
 * yapılır.
 */
function singleFilePlugin(): Plugin {
  return {
    name: 'tcdd-single-file',
    enforce: 'post',
    apply: 'build',
    async writeBundle(options, bundle) {
      const dir = options.dir;
      if (!dir) return;

      const fileNames = Object.keys(bundle);
      const htmlName = fileNames.find((n) => n.endsWith('.html'));
      const jsName = fileNames.find((n) => n.endsWith('.js'));
      const cssName = fileNames.find((n) => n.endsWith('.css'));
      if (!htmlName || !jsName) return;

      const html = await fs.readFile(path.join(dir, htmlName), 'utf-8');
      const js = await fs.readFile(path.join(dir, jsName), 'utf-8');
      const css = cssName ? await fs.readFile(path.join(dir, cssName), 'utf-8') : '';

      let out = html;

      // 1) Üretilen CSS dosyasını <style> olarak gömer.
      //    Yalnızca derleme çıktısındaki CSS varlığı hedeflenir; dış kaynaklı
      //    (ör. Google Fonts) stil bağlantıları korunur.
      if (css && cssName) {
        const escaped = cssName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cssLink = new RegExp(`<link[^>]*href="[^"]*${escaped}"[^>]*>`, 'i');
        out = out.replace(cssLink, () => `<style>\n${css}\n</style>`);
      }

      // 2) Üretilen JS dosyasını <script> olarak gömer.
      //    ÖNEMLİ: Klasik (inline) script'ler "defer" özniteliğini yok sayar ve
      //    head içinde bulundukları anda, DOM ayrıştırılmadan çalışırlar.
      //    Bu durumda document.getElementById('root') null döner ve React
      //    "Target container is not a DOM element" hatası verir.
      //    Bu yüzden script, <body> kapanışının hemen önüne taşınır.
      out = out.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/, () => '');
      if (!out.includes('</body>')) {
        throw new Error('singleFilePlugin: </body> bulunamadı');
      }
      out = out.replace('</body>', () => `  <script>\n${js}\n  </script>\n  </body>`);

      await fs.writeFile(path.join(dir, STANDALONE_HTML_NAME), out, 'utf-8');

      // Ara dosyaları temizle
      await fs.rm(path.join(dir, htmlName), { force: true });
      await fs.rm(path.join(dir, jsName), { force: true });
      if (cssName) await fs.rm(path.join(dir, cssName), { force: true });
    },
  };
}

export default defineConfig(() => {
  // BUILD_STANDALONE=1 → tek dosya (bağımlılıksız) derleme
  const standalone = process.env.BUILD_STANDALONE === '1';

  return {
    plugins: [react(), tailwindcss(), ...(standalone ? [singleFilePlugin()] : [])],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // Tek dosya derleme ayarları yalnızca BUILD_STANDALONE=1 iken geçerlidir
    ...(standalone
      ? {
          build: {
            outDir: 'release',
            emptyOutDir: true,
            // Tüm varlıklar gömülür
            assetsInlineLimit: 100 * 1024 * 1024,
            cssCodeSplit: false,
            modulePreload: false,
            chunkSizeWarningLimit: 4000,
            rollupOptions: {
              output: {
                // IIFE: klasik <script> olarak gömülür; "file://" üzerinde
                // module script kısıtlamalarına takılmaz.
                format: 'iife' as const,
                inlineDynamicImports: true,
                entryFileNames: 'app.js',
                assetFileNames: 'app.[ext]',
              },
            },
          },
        }
      : {}),
  };
});
