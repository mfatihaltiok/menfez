/**
 * Analytical Railway Load Engine per TCDD & UIC 71 / UIC 776-1 / EN 1991-2
 */

import { CulvertGeometry, RailwayLoadingParams, SoilAndMaterialParams, UIC71CalculatedLoads } from '../types/culvert';

export function calculateUIC71Loads(
  geo: CulvertGeometry,
  rail: RailwayLoadingParams,
  soil: SoilAndMaterialParams
): UIC71CalculatedLoads {
  // 1. Dış boyutlar
  const bCenter = geo.clearSpan + geo.sideWallThickness;
  const hExt = geo.clearHeight + geo.topSlabThickness + geo.bottomSlabThickness;

  // 2. Dinamik Büyütme Katsayısı (UIC 776-1 / EN 1991-2)
  // Kapalı çerçeve menfezlerde belirleyici açıklık: L_phi = 1.3 * bCenter
  const lPhi = Math.max(1.3 * bCenter, 1.0);
  
  // phi2: İyi bakımlı hat katsayısı, phi3: Standart hat katsayısı
  const denominator = Math.sqrt(Math.max(lPhi - 0.2, 0.1));
  const phi2 = Math.min(Math.max(1.44 / denominator + 0.82, 1.0), 1.67);
  const phi3 = Math.min(Math.max(2.16 / denominator + 0.73, 1.0), 2.0);

  // Hat hızına göre interpolasyon (TCDD 160 km/h üzeri için phi2, altı için phi2-phi3 arası)
  const phiDynamic = rail.trainSpeed >= 160 ? phi2 : Number(((phi2 + phi3) / 2).toFixed(3));

  // Dolgu derinliğine bağlı sönümleme indirgemesi (TCDD / UIC 776-1 Madde 4.2)
  // Dolgu yüksekliği h >= 1.00m ise katsayı azaltılır: phi_red = phi - (h - 1.00) / 10 >= 1.00
  let phiReduced = phiDynamic;
  if (rail.fillHeight >= 1.0) {
    phiReduced = Math.max(phiDynamic - (rail.fillHeight - 1.0) / 10.0, 1.0);
  }
  phiReduced = Number(phiReduced.toFixed(3));

  // 3. Yük Dağılımı ve Yayılma (Ballast & Soil Dispersal)
  // Travers boyu 2.60m, balast ve dolguda yatay yayılma eğimi (örneğin 1:1 veya 1:2)
  const m = rail.dispersionSlope || 1.0; // 1.0 = 45 derece, 0.5 = 1:2
  const singleTrackWidth = rail.sleeperLength + 2 * rail.fillHeight * m;

  let effectiveWidth = singleTrackWidth;
  let isOverlapping = false;

  if (rail.trackType === 'double') {
    // Çift hat eksen mesafesi (örn. 4.20m)
    if (singleTrackWidth > rail.trackSpacing) {
      isOverlapping = true;
      // Girişimli dağılım: İki hat birleşir
      effectiveWidth = rail.trackSpacing + rail.sleeperLength + 2 * rail.fillHeight * m;
    } else {
      effectiveWidth = singleTrackWidth; // Ayrı ayrı dağılır
    }
  }

  // Boyuna yayılma: 4 dingil (4 x 250 kN = 1000 kN), aks mesafeleri 0.8 + 1.6 + 0.8 = 3.2m
  // Dingillerin boyuna etkilediği çekirdek uzunluk: 4.8m
  const axleCoreLength = 4.8;
  const effectiveLength = axleCoreLength + 2 * rail.fillHeight * m;

  // 4. Üst Plak Üzerindeki Düşey Basınçlar (kN/m²)
  // Toplam dingil yükü: 4 x 250 kN = 1000 kN per track
  const numTracks = rail.trackType === 'double' && isOverlapping ? 2 : 1;
  const totalAxleLoad = 1000 * rail.alphaFactor * numTracks;

  // Dinamik etkili dingil basıncı
  const areaDispersion = Math.max(effectiveWidth * effectiveLength, 5.0);
  const qLiveAxle = (totalAxleLoad * phiReduced) / areaDispersion;

  // Katar yayılı yükü (80 kN/m * alpha)
  const qLiveUniform = (80 * rail.alphaFactor * phiReduced) / Math.max(effectiveWidth, 3.0);

  // En elverişsiz düşey canlı yük basıncı (TCDD standardı)
  const qVerticalLiveMax = Number(Math.max(qLiveAxle, qLiveUniform).toFixed(2));
  const qVerticalLiveSurcharge = Number(qLiveUniform.toFixed(2));

  // Zemin ve Balast Örtüsü Düşey Basıncı (kN/m²)
  let qVerticalSoil = 0;
  if (rail.fillHeight <= rail.ballastThickness) {
    qVerticalSoil = soil.ballastUnitWeight * rail.fillHeight;
  } else {
    qVerticalSoil =
      soil.ballastUnitWeight * rail.ballastThickness +
      soil.soilUnitWeight * (rail.fillHeight - rail.ballastThickness);
  }
  qVerticalSoil = Number(qVerticalSoil.toFixed(2));

  // Üst plak öz ağırlığı (kN/m²)
  const qVerticalDeadSlab = Number((soil.concreteUnitWeight * geo.topSlabThickness).toFixed(2));

  // ULS Tasarım Toplam Düşey Yükü: 1.35 * (G_slab + G_soil) + 1.45 * Q_live
  const qVerticalTotalULS = Number(
    (1.35 * (qVerticalDeadSlab + qVerticalSoil) + 1.45 * qVerticalLiveMax).toFixed(2)
  );

  // 5. Yan Duvarlar Üzerindeki Yanal Zemin Basınçları (kN/m²)
  // Sükunetteki zemin basınç katsayısı: K0 = 1 - sin(phi)
  const phiRad = (soil.frictionAngle * Math.PI) / 180;
  const k0 = Number((1 - Math.sin(phiRad)).toFixed(3));

  // Üst kot yanal zemin basıncı: sigma = K0 * q_soil_top
  const sigmaSoilTop = Number((k0 * qVerticalSoil).toFixed(2));

  // Taban kot yanal zemin basıncı: sigma = K0 * (q_soil_top + gamma_soil * hExt)
  const sigmaSoilBottom = Number((k0 * (qVerticalSoil + soil.soilUnitWeight * hExt)).toFixed(2));

  // Demiryolu Canlı Yük Sürşarjının Duvara Yanal İtkisi:
  // TCDD demiryolu şartnamesine göre eşdeğer sürşarj yanal basıncı
  const sigmaLiveSurcharge = Number((k0 * qVerticalLiveMax * 0.75).toFixed(2));

  // 6. Hidrostatik Su Basıncı (tabanda)
  const waterHead = Math.max(soil.waterTableHeight, 0);
  const sigmaHydroBottom = Number((10.0 * waterHead).toFixed(2));

  // 7. Ortalama Zemin Taşıma Gerilmesi (Taban altında tahmini)
  // Toplam menfez ağırlığı + dolgu + UIC 71 / Taban alanı
  const totalBExt = geo.clearSpan + 2 * geo.sideWallThickness;
  const concreteArea =
    geo.topSlabThickness * totalBExt +
    geo.bottomSlabThickness * totalBExt +
    2 * geo.sideWallThickness * geo.clearHeight +
    2 * 0.5 * geo.haunchWidth * geo.haunchHeight; // Yalnızca üst tabliye kenar birleşiminde 2 adet pah
  const deadWeightPerMeter = concreteArea * soil.concreteUnitWeight;
  const soilWeightPerMeter = qVerticalSoil * totalBExt;
  const liveLoadPerMeter = qVerticalLiveMax * Math.min(effectiveWidth, totalBExt);
  const totalVerticalLoadSLS = deadWeightPerMeter + soilWeightPerMeter + liveLoadPerMeter;
  const estimatedSoilBearingPressure = Number((totalVerticalLoadSLS / totalBExt).toFixed(2));

  return {
    phi2,
    phi3,
    phiDynamic,
    phiReduced,
    effectiveWidth: Number(effectiveWidth.toFixed(2)),
    effectiveLength: Number(effectiveLength.toFixed(2)),
    isOverlapping,
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
    estimatedSoilBearingPressure,
  };
}
