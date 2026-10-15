#!/bin/sh
# TCDD & UIC 71 Kutu Menfez Tasarim Modulu - BASLATICI (Linux / macOS)
# Node.js veya baska bir kurulum gerektirmez.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$DIR/release/TCDD_Kutu_Menfez.html"

if [ ! -f "$APP" ]; then
    echo "[HATA] Uygulama dosyasi bulunamadi: $APP" >&2
    echo "        'release' klasoru ve TCDD_Kutu_Menfez.html dosyasi gerekli." >&2
    exit 1
fi

echo "TCDD & UIC 71 Kutu Menfez Tasarim Modulu baslatiliyor..."
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$APP" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
    open "$APP"
else
    echo "Uygulama yolu: $APP"
fi
