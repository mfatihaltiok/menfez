# TCDD & UIC 71 Kutu Menfez Tasarım Uygulaması — Kod İnceleme ve Düzeltme Raporu

**Tarih:** 2026-10-15 · **Kapsam:** `src/` altındaki TypeScript/TSX dosyaları + yapılandırma
**Durum:** İnceleme tamamlandı, tespit edilen bulgular giderildi ve doğrulandı.

---

## 1. Genel Değerlendirme

Uygulama, TCDD/UIC 71 demiryolu standartlarına göre **tek gözlü betonarme kutu menfez**
tasarımı için parametrik bir masaüstü mühendislik aracıdır. Mimari olarak temiz bir
ayrım vardır:

| Katman | Dosya | Sorumluluk |
|---|---|---|
| Tip sözleşmesi | `types/culvert.ts` | 20+ arayüz, tüm veri akışı |
| Yük motoru | `utils/uic71Engine.ts` | UIC 71 dinamik katsayı, yük yayılımı, su basınçları |
| Yapısal çözücü | `utils/structuralSolver.ts` | Çerçeve momentleri, donatı seçimi, çatlak/kesme tahkiki |
| Metraj | `utils/quantitySurvey.ts` | Beton, kalıp, BBS, keşif |
| SAP2000 dışa aktarım | `utils/sap2000Exporter.ts` | .s2k script üretimi |
| Sunum | `components/*.tsx` (7 dosya) | SVG 2B, Three.js 3B, tablolar, rapor |

**Güçlü yanlar:** `useMemo` zinciri doğru kurulmuş, hesap motorları React'ten ayrıştırılmış,
`.s2k` üretimi özenli (doğru tablo seti, CRLF, `PROGRAM CONTROL` ilk satırda), iki taraflı
duvar bağlantı sırası bilinçli olarak ters çevrilmiş, Winkler yay için `tributaryArea`
hesabı doğru.

**Zayıf yanlar (düzeltildi):** Yük hesabında üç mühendislik sapması vardı; bunlardan biri
üst plak canlı yükünü **%47–70 eksik** uyguluyordu. Donatı seçimi, metraj listesi ve
görsel lejantları birbiriyle tutarsız üç farklı tanım üretiyordu. Hesap raporu her
kesitte koşulsuz "UYGUN" damgası basıyordu.

---

## 2. Düzeltilen Kritik Bulgular

### K-1 — Üst plak canlı yükü menfeze eksik aktarılıyordu
**Dosya:** `utils/uic71Engine.ts` · **Etki:** Yüksek

Yayılım basıncı `effectiveWidth` (6.60 m) ile hesaplanıyor, ama SAP2000'te menfezin gerçek
genişliği (3.90 m) üzerine eşit dağıtılıyordu. Toplam canlı kuvvet kayboluyordu.

| Durum | Doğru basınç | Eski kod | Sapma |
|---|---|---|---|
| Tek hat, dolgu 2.0 m | 45.75 kN/m² | 24.38 kN/m² | **−46.7 %** |
| Çift hat, dolgu 2.5 m | 79.54 kN/m² | 23.63 kN/m² | **−70.3 %** |

**Düzeltme:** Basınç artık menfez genişliği üzerinden hesaplanıyor:

```ts
const dispersalWidthOnCulvert = Math.min(effectiveWidth, bExt);
const qLiveAxle = totalLiveForce / (effectiveLength * dispersalWidthOnCulvert);
```

Yayılım menfezden dar ise tepe basıncı (konservatif), geniş ise ortalama basınç (tam kuvvet)
kullanılıyor. Katar yayılı yükü (80 kN/m) de boyuna yayılım üzerinden (`L_eff`) hesaplanıyor.

**Doğrulama:** Düzeltme sonrası tüm senaryolarda sapma **%0.0**.

---

### K-2 — UIC 71 dinamik katsayıda üs hatası vardı
**Dosya:** `utils/uic71Engine.ts` · **Etki:** Yüksek

Kod `Math.sqrt(lPhi - 0.2)` kullanıyordu; doğrusu `Math.pow(lPhi, 0.2)`.

| | Eski kod | Doğru (L^0.2) |
|---|---|---|
| φ₂ | 1.516 | **1.670** (tavan değeri) |
| φ₃ | 1.773 | **2.000** (tavan değeri) |

Sapma %9–12. **Düzeltildi.**

---

### K-3 — Çift hat, girişim yokken ikinci hattın yükü atlanıyordu
**Dosya:** `utils/uic71Engine.ts` · **Etki:** Yüksek

`numTracks = double && isOverlapping ? 2 : 1` ifadesi, yayılma bölgeleri girişmediğinde
çift hattın ikinci 1000 kN'ını tamamen düşürüyordu. UI'dan erişilebilir bir durumdu
(`fillHeight = 0.5 m` veya `trackSpacing = 6.0 m`).

**Düzeltme:** `numTracks` artık girişim durumundan bağımsızdır:
`const numTracks = rail.trackType === 'double' ? 2 : 1;`

---

### K-4 — Hesap raporu koşulsuz "UYGUN" damgası basıyordu
**Dosya:** `components/CalculationReportModal.tsx` · **Etki:** Yüksek

`shearStatus` / `crackStatus` hesaplanıyordu ama rapor tablosu statik `<span>UYGUN</span>`
yazıyordu — resmî çıktıda gerçeğin aksini gösteren bir tablo.

**Düzeltme:** Durum artık `sec.status` alanına bağlı: `UYGUN` / `ÇATLAK KONTROLÜ` /
`ETRİYE GEREKLİ`. Rapor ayrıca "Hesap Yöntemi ve Kapsam Sınırları" bölümü içerir.

---

### K-5 — Donatı seçimi her zaman en sık aralığı seçiyordu
**Dosya:** `utils/structuralSolver.ts` · **Etki:** Yüksek

`spacings = [10, 12.5, 15, 20]` → daima 10 cm seçiliyordu. Gereken 9.00 cm²/m için
Φ20/10 (31.42 cm²/m) veriliyordu, oysa ekonomik doğru seçim Φ16/20 (10.05) idi.
"Kapasite oranı" 0.29–0.45 çıkıyor, yani kullanıcı bunu güvenlik payı sanıyor, oysa
**fazla donatı** idi.

**Düzeltme:** Seçim algoritması yeniden yazıldı:
1. Tercih edilen çaptan başla (detaylandırmada çap tutarlılığı),
2. Aynı çapta aralığı en seyrekten (20 cm) başlayarak sıklaştır,
3. **Çatlak genişliği sınırını** da sağlayan ilk (çap, aralık) çiftini kabul et.

Böylece donatı miktarı artık hem eğilme hem çatlak şartlarını birlikte sağlar.

---

### K-6 — Çatlak genişliği formülü hatalıydı
**Dosya:** `utils/structuralSolver.ts` · **Etki:** Yüksek

`(0.425 * chosenDia) / 0.01` ifadesi `0.425·d` (faydalı yükseklik) yerine donatı çapını
kullanıyordu; Φ20 için 850 mm (doğrusu ≈ 165 mm) — çatlak genişliği ~5× fazla tahmin
ediliyordu. Ayrıca çekme sertleştirme ihmal ediliyordu.

**Düzeltme:** EN 1992-2 / EN 1992-1-1 Annex L formülüne geçirildi:

```ts
const epsSm = Math.max((sigmaS - KT * fctdMPa) / ES, 0) * ((1 + ALPHA_E * rhoEff) / (1 + rhoEff));
const srM = 1.3 * (cover * 1000 + 0.425 * d * 1000);
const wk = srM * epsSm;
```

---

## 3. Düzeltilen Diğer Bulgular

| # | Bulgu | Düzeltme |
|---|---|---|
| A-1 | Metraj kalıp alanı, toprakla gömülü dış duvar yüzeylerini de sayıyordu (Tip-2'de alanın %42.6'sı) | Dış yüzeyler kalıptan çıkarıldı; notlar düzeltildi |
| A-2 | Kazı/geri dolgu notları gerçeği yansıtmıyordu ("şevlendirme dahil" deniyordu, şev yoktu) | Notlar gerçeği yansıtacak şekilde yazıldı (dik kazı + 0.60 m çalışma payı) |
| A-3 | Üç farklı, birbiriyle tutarsız donatı tanımı (çözücü Φ20/10 · metraj Φ20/15 · lejant Φ20/15) | Metraj artık yapısal çözücüden çap/aralık okuyor; 2B/3B lejantları da hesaplanan değerleri kullanıyor |
| A-4 | `internalWaterDepth` hiç kullanılmıyordu | İç su basıncı ve tabandaki net kaldırma hesaba katıldı; duvar ve taban yüklerine uygulandı |
| A-5 | `trackStandard` alanı hiç kullanılmıyordu, UI'da da yoktu | Kullanılmayan alan tipten kaldırıldı |
| A-6 | `longitudinalAxleSpacing` kullanılmıyordu, `axleCoreLength` sabit kodlanmıştı | Çekirdek uzunluk artık `3 × aks aralığı` |
| A-7 | `generateSAP2000Model` içindeki `rail` parametresi hiç kullanılmıyordu | Parametre kaldırıldı |
| A-8 | `estimatedSoilBearingPressure` hesaplanıyor ama hiç gösterilmiyordu | 2B görünüm alt şeridi ve rapor 3. bölümüne eklendi |
| A-9 | `Section2DViewer`'daki `groundY` hesaplanıyor ama kullanılmıyordu | Dolgu üst kotu çizgisi ve etiketi olarak kullanıldı |
| A-10 | 13 kullanılmayan import (Eye, Layers, PieChart, ChevronRight, Info, Download…) | Tamamı temizlendi; `noUnusedLocals` ile de artık yakalanıyor |
| A-11 | `parseFloat(x) \|\| varsayılan` deseni 0.5 değerinin yazılmasını engelliyordu | 22 alan `Number.isFinite` tabanlı `num()` yardımcısına geçirildi |
| A-12 | `lg` altındaki ekranlarda sekmelere hiç erişilemiyordu | Alt sekme çubuğu + giriş paneli çekmecesi eklendi; masaüstü düzeni değişmedi |
| A-13 | 3B lejantta "Sağ tık: Kaydır" yazıyordu ama pan özelliği yoktu | Sağ tuşla pan (hedef nokta kaydırma) uygulandı |
| A-14 | 0.25 m mesh'te 3584 ayrı mesh nesnesi → ~7000 draw call | Geometriler malzemeye göre `mergeGeometries` ile birleştirildi (3 draw call) |
| A-15 | O(n²) düğüm araması (`joints.find` iç içe döngüde) | `Map` tabanlı aramaya geçirildi |
| A-16 | `meshTargetSize = 0` sonsuz döngüye yol açardı (UI'dan ulaşılamıyordu) | Alt sınır koruması eklendi (0.01 m) |
| A-17 | Raporda sadece "UYGUN" değil, gerçek durumlar gösterilmeliydi | `sec.status` alanı eklendi ve rapora bağlandı |
| A-18 | CSV ondalık ayırıcısı nokta idi (Türkçe Excel'de 2800.50 → 280050 olur) | Ondalık virgüle çevrildi, alanlar kaçışlı alıntılandı, CRLF kullanıldı |
| A-19 | `navigator.clipboard` `file://` altında çalışmayabilir | `execCommand` yedekli `copyToClipboard` yardımcısı eklendi |
| A-20 | 3B görünümde WebGL yoksa boş ekran | Açıklayıcı hata mesajı eklendi |
| A-21 | `tsconfig.json`'da `strict` kapalıydı | `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` açıldı; 14 gerçek sorun bulundu ve giderildi |
| A-22 | `.gitignore` yoktu | Eklendi (`node_modules`, `dist`, `.env` vb.) |
| A-23 | Kullanılmayan bağımlılıklar (@google/genai, express, dotenv, motion) | `package.json`'dan kaldırıldı |
| A-24 | `vite.config.ts` `__dirname` kullanıyordu (Vite 8 uyarısı) | `import.meta.dirname` ile değiştirildi |

---

## 4. Doğrulama Yöntemi

| Yöntem | Sonuç |
|---|---|
| `npx tsc --noEmit` (strict mod) | ✅ Hatasız |
| `npm run build` | ✅ Başarılı |
| `npm run build:standalone` | ✅ `release/TCDD_Kutu_Menfez.html` (949 kB, tek dosya) |
| **jsdom smoke test** (tek dosya HTML'i `file://` ile yüklendi) | ✅ 0 hata, 5 sekme + rapor modalı render edildi |
| Sayısal motor doğrulaması (`tsx` ile doğrudan çalıştırma) | ✅ Canlı yük sapması %0.0; φ₂ = 1.670; çift hat iki hattı da içeriyor |
| Node `--check` (gömülü JS söz dizimi) | ✅ Geçerli |

Smoke test sırasında **gerçek bir hata** yakalandı: gömülü klasik `<script>` bloğu
`<head>` içinde kaldığı için DOM ayrıştırılmadan çalışıyor ve React
*"Target container is not a DOM element"* hatası veriyordu. Script `<body>` kapanışının
önüne taşınarak düzeltildi.

---

## 5. Kalan Bilinen Kısıtlar

Uygulama düzeltmelerden sonra **yüksek doğruluklu bir ön boyutlandırma aracıdır**, ancak
aşağıdaki kısıtlar bilinçlidir ve raporda da belirtilmektedir:

1. **Analitik momentler yaklaşıktır.** Tek geçişli çerçeve dağıtımıdır; iteratif
   moment dağılımı (Hardy Cross/portföy) değildir. Kesin sonuç SAP2000 modelinden
   alınmalıdır. Rehberdeki "birebir karşılaştırın" ifadesi düzeltildi.
2. **FE modeli plakları orta yüzeylerinde temsil eder.** Joint Offset atanmadığı için
   duvar yüksekliği `Hi + (tt+tb)/2` olur. Bu, çerçeve analizi için doğru olsa da gerçek
   geometri değildir.
3. **Köşe ampatmanı (pah) FE modele alınmaz.** Yalnızca metrajda ve kesit çiziminde
   dikkate alınır.
4. **Zemin etkisi Winkler yaylarıyla temsil edilir** (k_s); zemin–yapı etkileşimi
   yaklaşıktır.
5. **Su yükleri** hidrostatik kabul edilir; akış kuvveti ve sızıntı dikkate alınmaz.
6. **Metraj birim fiyatlara dayalı yaklaşık bir keşiftir**; şartname kapsamındaki tüm
   kalemleri içermez.
7. **3B görünüm WebGL gerektirir**; desteklenmeyen tarayıcılarda diğer sekmeler çalışmaya
   devam eder.

> Bu araç resmî proje dosyası değildir. İmza altına basılacak çıktı için yetkili bir
> mühendislik firmasının kontrolü gerekir.

---

## 6. Yeni Eklenen Dosyalar

| Dosya | Açıklama |
|---|---|
| `baslat.bat` | Windows başlatıcı — uygulamayı tarayıcıda açar (Node.js gerekmez) |
| `baslat.sh` | Linux/macOS başlatıcı |
| `release/TCDD_Kutu_Menfez.html` | Bağımlılıksız tek dosya uygulama (949 kB) |
| `scripts/build-standalone.mjs` | Çapraz platform tek dosya derleme betiği |
| `src/utils/clipboard.ts` | `file://` uyumlu pano kopyalama yardımcısı |
| `.gitignore` | Derleme artefaktları ve bağımlılıklar için |
