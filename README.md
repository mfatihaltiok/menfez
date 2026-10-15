# TCDD & UIC 71 Tek Gözlü Kutu Menfez Tasarımı ve SAP2000 Modelleyici

TCDD Demiryolu Köprü ve Sanat Yapıları Şartnamesi, UIC 71 / UIC 776-1 / EN 1991-2 ve
TS 500 / EN 1992-2 esaslarına göre **tek gözlü betonarme kutu menfez** ön boyutlandırma
aracı. Uygulama tamamen tarayıcıda çalışır; kurulum gerektirmez.

## Hızlı Başlangıç (Windows)

1. Proje klasörünü bilgisayarınıza kopyalayın.
2. **`baslat.bat`** dosyasına çift tıklayın.
3. Uygulama varsayılan tarayıcınızda açılır.

> Node.js, Python, internet bağlantısı veya herhangi bir yazılım kurulumu **gerekmez**.
> Tüm uygulama (JavaScript, CSS, Three.js) tek bir HTML dosyası olarak gömülüdür:
> `release/TCDD_Kutu_Menfez.html`

Linux / macOS için: `./baslat.sh`

## Uygulama Sekmeleri

| Sekme | İçerik |
|---|---|
| **2B Kesit & Yükler** | SVG kesit çizimi, UIC 71 yük yayılma şeması, yanal zemin basıncı diyagramı, donatı yerleşimi |
| **3B Kabuk (Mesh)** | Three.js ile SAP2000 kabuk sonlu eleman ağı; düğüm, yay ve yük gösterimi (WebGL gerekir) |
| **SAP2000 .s2k** | İçe aktarılabilir `.s2k` script'i, düğüm/kabuk/yük/yay/kombinasyon tabloları ve aktarım rehberi |
| **Donatı & Tahkik** | Kesit bazlı eğilme/kesme/çatlak tahkikleri, kapasite oranları ve donatı yerleşim şeması |
| **Malzeme Metrajı** | Poz bazlı TCDD keşif tablosu, bar bending listesi, çap dağılımı, CSV dışa aktarım |

Üstteki **Hesap Raporu** düğmesi yazdırılabilir/PDF'e kaydedilebilir resmî format rapor üretir.

## Hesap Yöntemi Özeti

### Yükler — `src/utils/uic71Engine.ts`

- Dinamik katsayı (UIC 776-1 / EN 1991-2):
  `φ' = 1.44 / L_φ^0.2 + 0.82` (1.00 ≤ φ' ≤ 1.67),
  `φ'' = 2.16 / L_φ^0.2 + 0.73` (1.00 ≤ φ'' ≤ 2.00), `L_φ = 1.3·b`
- Dolgu derinliği indirgemesi: `φ_red = φ − (h − 1.00)/10`, alt sınır 1.00
- **Canlı yük kuvvet dengesi:** UIC 71 yükü (4 × 250 kN/hat) dolgu içinde enine (`B_eff`) ve
  boyuna (`L_eff`) yayılır, ardından **menfez üst plak genişliği** boyunca toplanır:
  `q = ΣP·φ_red / (L_eff · B_culvert)`. Böylece menfeze aktarılan toplam kuvvet korunur.
- Yanal sürşarj: `Δσ = K₀ · q_sürşarj`, `K₀ = 1 − sin φ`
- Hidrostatik: dış (zemin) su basıncı, iç su basıncı ve tabandaki net kaldırma basıncı
- Çift hatta **her iki hattın** yükü de, yayılma bölgeleri girişip girişmediğine bakılmaksızın alınır

### Yapı — `src/utils/structuralSolver.ts`

- Tek geçişli yaklaşık çerçeve moment dağılımı (akslar arası üye uzunluklarıyla)
- Malzeme: TS 500 / EN 1992 (`f_cd = f_ck/1.5`, `f_ctd = 0.35√f_ck/1.5`, `f_yd = f_yk/1.15`)
- Donatı seçimi **eğilme** (`A_s,req`) ve **çatlak genişliği** (`w_k ≤ 0.20 mm`,
  EN 1992-2 Annex L) şartlarını birlikte sağlayan en ekonomik (çap, aralık) çözümünü arar
- Kesme: `V_c = 0.65 · f_ctd · b · d` (TS 500, etriyesiz)

### SAP2000 modeli — `src/utils/sap2000Exporter.ts`

Kabuk (shell) eleman modeli: dört levha (üst plak, alt plak, iki yan duvar), tabanda
Winkler zemin yayları, zemin/tren/hidrostatik yükleri ve 6 adet ULS/SLS kombinasyonu.
Üretilen `.s2k` dosyası `File → Import → SAP2000 .s2k Text File` ile doğrudan içe aktarılır.

> **Model kapsamı:** Kabuk elemanlar plakların orta yüzeylerinde konumlandırılır
> (Joint Offset atanmamıştır) ve köşe ampatmanı (pah) FE modele alınmaz. Gerçek geometri
> için SAP2000'te düğümlere Joint Offset atanmalıdır.

### Metraj — `src/utils/quantitySurvey.ts`

Beton, kalıp, kazı, geri dolgu, grobeton, su yalıtımı ve donatı metrajı. Donatı çap ve
aralıkları **yapısal çözücüden** alınır; böylece tahkik ekranı ile metraj birbirini
doğrular.

## Geliştirici Kurulumu

```bash
npm install          # bağımlılıklar
npm run dev          # geliştirme sunucusu (http://localhost:3000)
npm run build        # üretim derlemesi -> dist/
npm run build:standalone   # TEK DOSYA derleme -> release/TCDD_Kutu_Menfez.html
npm run lint         # TypeScript denetimi (strict mod)
```

`npm run build:standalone` komutu `vite.config.ts` içindeki `singleFilePlugin`
eklentisini devreye alır; JS ve CSS çıktısını `index.html` içine gömer ve tek dosyalık
çalıştırılabilir sürümü üretir.

## Proje Yapısı

```
src/
├─ types/culvert.ts          Tüm tip sözleşmeleri
├─ utils/
│  ├─ uic71Engine.ts         UIC 71 yük hesabı
│  ├─ structuralSolver.ts    Çerçeve momentleri + donatı tahkiki
│  ├─ quantitySurvey.ts      Malzeme metrajı ve keşif
│  ├─ sap2000Exporter.ts     Mesh üretimi ve .s2k yazımı
│  └─ clipboard.ts           Pano kopyalama (file:// uyumlu)
└─ components/               7 görsel bileşen
```

## Kapsam ve Uyarılar

Bu araç **ön boyutlandırma** amaçlıdır. Kesin tasarım kararları için:

- SAP2000 kabuk modeli sonuçları esas alınmalıdır (analitik momentler yaklaşıktır).
- Zemin–yapı etkileşimi Winkler yaylarıyla temsil edilmiştir; kapsamlı jeoteknik
  çalışma gerekir.
- İmza altına basılan resmî proje dosyası değildir.
