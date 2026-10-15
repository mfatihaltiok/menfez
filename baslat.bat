@echo off
setlocal
title TCDD - UIC 71 Kutu Menfez Tasarim Modulu

rem ===================================================================
rem  TCDD & UIC 71 Kutu Menfez Tasarim Modulu - BASLATICI
rem
rem  Bu dosya uygulamayi varsayilan web tarayicinizda acar.
rem  Node.js, Python veya baska bir yazilim kurulumu GEREKMEZ.
rem  Tum uygulama tek bir HTML dosyasi olarak release klasorunde durur.
rem ===================================================================

cd /d "%~dp0"

set "APP=%~dp0release\TCDD_Kutu_Menfez.html"

if not exist "%APP%" (
    echo.
    echo   [HATA] Uygulama dosyasi bulunamadi:
    echo          %APP%
    echo.
    echo   Bu klasorde "release" adli klasor ve icinde
    echo   TCDD_Kutu_Menfez.html dosyasi bulunmalidir.
    echo.
    echo   Dosya silinmiş veya taşınmış olabilir. Proje klasörünü
    echo   bütünüyle kopyaladığınızdan emin olun.
    echo.
    pause
    exit /b 1
)

start "" "%APP%"

echo.
echo   TCDD ^& UIC 71 Kutu Menfez Tasarim Modulu baslatildi.
echo   Uygulama varsayilan tarayicida aciliyor...
echo.
echo   Kapatmak icin: tarayici sekmesini kapatin.
echo.
timeout /t 3 >nul
exit /b 0
