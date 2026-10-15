/**
 * Pano (clipboard) kopyalama yardımcısı.
 *
 * navigator.clipboard API'si yalnızca güvenli bağlamlarda (https, localhost)
 * çalışır. Uygulamanın "file://" üzerinden tek dosya olarak çalıştırıldığı
 * durumlarda API mevcut olmayabilir; bu nedenle execCommand tabanlı bir
 * yedek yol uygulanır.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1) Modern API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // güvenli olmayan bağlamda hata fırlatabilir → yedeğe düş
    }
  }

  // 2) Yedek yol: görünmez textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Türkçe/yerel ayara uygun sayı biçimlendirme (ondalık ayırıcı virgül).
 */
export function formatNumber(
  value: number,
  fractionDigits: number = 0,
  locale: string = 'tr-TR'
): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
