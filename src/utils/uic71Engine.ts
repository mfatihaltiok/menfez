/**
 * Analytical Railway Load Engine per TCDD & UIC 71 / UIC 776-1 / EN 1991-2
 *
 * TASARIM İLKELERİ
 * ----------------
 * 1) Dinamik katsayı:  φ' = 1.44 / L_φ^0.2 + 0.82   (UIC 776-1 / EN 1991-2)
 *                      φ'' = 2.16 / L_φ^0.2 + 0.73
 *    L_φ = 1.3 × b (köprü açıklığı), 1.0 ≤ φ' ≤ 1.67 , 1.0 ≤ φ'' ≤ 2.0
 *
 * 2) Canlı yük kuvvet dengesi:
 *    Yük dolgu içinde önce enine (B_eff) ve boyuna (L_eff) yayılır, ardından
 *    menfezin üst plak genişliği (B_ext) boyunca toplanır. Bu nedenle üst plak
 *    basıncı YAYILMA GENİŞLİĞİNE DEĞİL, MENFEZ GENİŞLİĞİNE BÖLÜNMELİDİR.
 *      q_dingil = (ΣP_axle · Φ_red) / (L_eff · B_eff_dar)
 *    Buradaki B_eff_dar = min(B_eff, B_ext): yayılma menfezden dar ise tepe
 *    basıncı (konservatif), geniş ise ortalama basınç (tam kuvvet) kullanılır.
 *
 * 3) Yanal sürşarj basıncı:  Δσ = K0 · q_sürşarj
 *    q_sürşarj, trenin yayılı (katar) yük bileşenidir; noktasel dingil yükü
 *    yanal sürşarja dönüştürülmez.
 *
 * 4) Çift hat: her iki hattın yükü de, yayılma bölgeleri girişip girişmediğine
 *    bakılmaksızın tam olarak dikkate alınır.
 */

import { CulvertGeometry, RailwayLoadingParams, SoilAndMaterialParams, UIC71CalculatedLoads } from '../types/culvert';

/** Su birim ağırlığı (kN/m³) */
const GAMMA_W = 10.0;

/** UIC 71 tek dingil yükü (kN) — 4 × 250 kN = 1000 kN */
const UIC71_AXLE_LOAD = 250.0;

/** UIC 71 katar yayılı yükü (kN/m) */
const UIC71_UNIFORM_LOAD = 80.0;

function round(value: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(value * f) / f;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateUIC71Loads(
  geo: CulvertGeometry,
  rail: RailwayLoadingParams,
  soil: SoilAndMaterialParams
): UIC71CalculatedLoads {
  // 1. Dış boyutlar
  const bExt = geo.clearSpan + 2 * geo.sideWallThickness; // Menfez dış genişliği (m)
  const bCenter = geo.clearSpan + geo.sideWallThickness; // Duvar orta ekseni arası açıklık (m)
  const hExt = geo.clearHeight + geo.topSlabThickness + geo.bottomSlabThickness; // Menfez dış yüksekliği (m)

  // 2. Dinamik Büyütme Katsayısı (UIC 776-1 / EN 1991-2)
  // Kapalı çerçeve menfezlerde belirleyici açıklık: L_phi = 1.3 * b_center
  const lPhi = Math.max(1.3 * bCenter, 1.0);

  // φ2: İyi bakımlı hat katsayısı, φ3: Standart hat katsayısı
  // NOT: Üs 0.2'dir (L_phi^0.2); karekök kullanılmamalıdır.
  const denominator = Math.pow(lPhi, 0.2);
  const phi2 = clamp(1.44 / denominator + 0.82, 1.0, 1.67);
  const phi3 = clamp(2.16 / denominator + 0.73, 1.0, 2.0);

  // Hat hızına göre seçim: 160 km/h ve üzeri → iyi bakımlı hat (φ2),
  // altı → φ2 ile φ3 arası ortalama (UIC 776-1 hız sınıflarına yaklaşık)
  const phiDynamic = rail.trainSpeed >= 160 ? phi2 : round((phi2 + phi3) / 2, 3);

  // Dolgu derinliğine bağlı sönümleme indirgemesi (UIC 776-1 Madde 4.2)
  // phi_red = phi - (h - 1.00) / 10 , alt sınır 1.00
  let phiReduced = phiDynamic;
  if (rail.fillHeight >= 1.0) {
    phiReduced = Math.max(phiDynamic - (rail.fillHeight - 1.0) / 10.0, 1.0);
  }
  phiReduced = round(phiReduced, 3);

  // 3. Yük Dağılımı ve Yayılma (Ballast & Soil Dispersal)
  const m = rail.dispersionSlope || 1.0; // 1.0 = 45 derece (1:1), 0.5 = 1:2
  const singleTrackWidth = rail.sleeperLength + 2 * rail.fillHeight * m;

  let effectiveWidth = singleTrackWidth;
  let isOverlapping = false;

  if (rail.trackType === 'double') {
    // Çift hat eksen mesafesi (örn. 4.20m)
    if (singleTrackWidth > rail.trackSpacing) {
      isOverlapping = true;
      // Girişimli dağılım: İki hattın yayılma bölgeleri birleşir
      effectiveWidth = rail.trackSpacing + rail.sleeperLength + 2 * rail.fillHeight * m;
    } else {
      // Girişimsiz: iki hat ayrı ayrı yayılır; her iki hattın yükü de
      // toplamda dikkate alınır (aşağıdaki numTracks).
      effectiveWidth = singleTrackWidth;
    }
  }

  // Boyuna yayılma: 4 dingil, aks aralığı longitudinalAxleSpacing
  // Çekirdek uzunluk (dış dingiller arası) = 3 × aks aralığı (varsayılan 3 × 1.60 = 4.80 m)
  const axleCoreLength = 3 * (rail.longitudinalAxleSpacing || 1.6);
  const effectiveLength = axleCoreLength + 2 * rail.fillHeight * m;

  // 4. Canlı Yük Kuvvet Dengesi
  // Her iki hat da her zaman dikkate alınır (girişim olmasa bile).
  const numTracks = rail.trackType === 'double' ? 2 : 1;

  // Dinamik katsayılı toplam canlı kuvvet (kN)
  const totalAxleLoad = 4 * UIC71_AXLE_LOAD * rail.alphaFactor * numTracks;
  const totalLiveForce = totalAxleLoad * phiReduced;

  // Menfez boyunca düşen canlı çizgi yük (kN/m)
  const lineLiveLoad = totalLiveForce / effectiveLength;

  // Üst plak basıncı: yayılımın menfez genişliğine sıkışması dikkate alınır.
  const dispersalWidthOnCulvert = Math.min(effectiveWidth, bExt);
  const qLiveAxle = totalLiveForce / (effectiveLength * dispersalWidthOnCulvert);

  // Katar yayılı yükü (80 kN/m × α × Φ) — boyuna yayılım üzerinden üst plana aktarılır
  const qLiveUniform =
    (UIC71_UNIFORM_LOAD * rail.alphaFactor * numTracks * phiReduced) / effectiveLength;

  // En elverişsiz düşey canlı yük basıncı (TCDD standardı)
  const qVerticalLiveMax = round(Math.max(qLiveAxle, qLiveUniform), 2);
  const qVerticalLiveSurcharge = round(qLiveUniform, 2);

  // Zemin ve Balast Örtüsü Düşey Basıncı (kN/m²)
  // fillHeight: üst plak üst kotu ile balast üst kotu arası toplam örtü
  let qVerticalSoil = 0;
  if (rail.fillHeight <= rail.ballastThickness) {
    qVerticalSoil = soil.ballastUnitWeight * rail.fillHeight;
  } else {
    qVerticalSoil =
      soil.ballastUnitWeight * rail.ballastThickness +
      soil.soilUnitWeight * (rail.fillHeight - rail.ballastThickness);
  }
  qVerticalSoil = round(qVerticalSoil, 2);

  // Üst plak öz ağırlığı (kN/m²)
  const qVerticalDeadSlab = round(soil.concreteUnitWeight * geo.topSlabThickness, 2);

  // ULS Tasarım Toplam Düşey Yükü: 1.35 * (G_slab + G_soil) + 1.45 * Q_live
  const qVerticalTotalULS = round(
    1.35 * (qVerticalDeadSlab + qVerticalSoil) + 1.45 * qVerticalLiveMax,
    2
  );

  // 5. Yan Duvarlar Üzerindeki Yanal Zemin Basınçları (kN/m²)
  // Sükunetteki zemin basınç katsayısı: K0 = 1 - sin(phi)
  const phiRad = (soil.frictionAngle * Math.PI) / 180;
  const k0 = round(1 - Math.sin(phiRad), 3);

  // Üst kot yanal zemin basıncı: sigma = K0 * q_soil_top
  const sigmaSoilTop = round(k0 * qVerticalSoil, 2);

  // Taban kot yanal zemin basıncı: sigma = K0 * (q_soil_top + gamma_soil * hExt)
  const sigmaSoilBottom = round(k0 * (qVerticalSoil + soil.soilUnitWeight * hExt), 2);

  // Demiryolu canlı yük sürşarjının duvara yanal itkisi:
  // Δσ = K0 × q_sürşarj  (yayılı katar yükü; noktasel dingil yükü dahil edilmez)
  const sigmaLiveSurcharge = round(k0 * qVerticalLiveSurcharge, 2);

  // 6. Hidrostatik Su Basınçları
  // Dış (zemin) su: tabanda waterTable, üst plak altında max(waterTable - hExt, 0)
  const waterHead = Math.max(soil.waterTableHeight, 0);
  const sigmaHydroBottom = round(GAMMA_W * waterHead, 2);
  const sigmaHydroTop = round(GAMMA_W * Math.max(waterHead - hExt, 0), 2);

  // İç su basıncı (menfez içinde biriken su)
  const internalDepth = Math.max(soil.internalWaterDepth, 0);
  const sigmaHydroInternalBottom = round(GAMMA_W * internalDepth, 2);
  const sigmaHydroInternalTop = round(GAMMA_W * Math.max(internalDepth - geo.clearHeight, 0), 2);

  // Taban kaldırması (iç su - dış su)
  const netUpliftPressure = round(
    Math.max(sigmaHydroInternalBottom - sigmaHydroBottom, 0),
    2
  );

  // 7. Ortalama Zemin Taşıma Gerilmesi (SLS)
  const concreteArea =
    geo.topSlabThickness * bExt +
    geo.bottomSlabThickness * bExt +
    2 * geo.sideWallThickness * geo.clearHeight +
    2 * 0.5 * geo.haunchWidth * geo.haunchHeight; // Yalnızca üst tabliye kenar birleşiminde 2 adet pah
  const deadWeightPerMeter = concreteArea * soil.concreteUnitWeight;
  const soilWeightPerMeter = qVerticalSoil * bExt;
  const liveLoadPerMeter = qVerticalLiveMax * bExt;
  const upliftPerMeter = netUpliftPressure * bExt;
  const totalVerticalLoadSLS =
    deadWeightPerMeter + soilWeightPerMeter + liveLoadPerMeter - upliftPerMeter;
  const estimatedSoilBearingPressure = round(totalVerticalLoadSLS / bExt, 2);

  return {
    phi2: round(phi2, 3),
    phi3: round(phi3, 3),
    phiDynamic: round(phiDynamic, 3),
    phiReduced,
    effectiveWidth: round(effectiveWidth, 2),
    effectiveLength: round(effectiveLength, 2),
    isOverlapping,
    numTracks,
    totalLiveForceKN: round(totalLiveForce, 1),
    lineLiveLoadKNpm: round(lineLiveLoad, 2),
    qVerticalLiveMax,
    qVerticalLiveSurcharge,
    qVerticalSoil,
    qVerticalDeadSlab,
    qVerticalTotalULS,
    k0,
    sigmaSoilTop,
    sigmaSoilBottom,
    sigmaLiveSurcharge,
    sigmaHydroBottom,
    sigmaHydroTop,
    sigmaHydroInternalBottom,
    sigmaHydroInternalTop,
    netUpliftPressure,
    estimatedSoilBearingPressure,
    totalVerticalLoadPerMeter: round(totalVerticalLoadSLS, 2),
  };
}
