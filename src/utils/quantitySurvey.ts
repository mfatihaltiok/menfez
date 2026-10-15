/**
 * Bill of Quantities (BOQ / Malzeme Metrajı) Calculator for TCDD Box Culverts
 * Calculates Concrete, Formwork, Detailed Rebar Schedule (Bar Bending), Earthwork, and Waterproofing
 *
 * Donatı metrajı, yapısal çözücünün (structuralSolver) seçtiği çap ve aralıklardan
 * alınır; böylece "Donatı & Tahkik" sekmesi ile metraj birbirini doğrular.
 */

import {
  CulvertGeometry,
  RailwayLoadingParams,
  UnitCostParams,
  QuantitySurveyReport,
  RebarScheduleItem,
  MaterialQuantityItem,
  SectionRebarDesign,
} from '../types/culvert';

/** Kazı çalışma payı (her yandan) */
const WORKING_SPACE = 0.6; // m

/** Grobeton kalınlığı */
const LEAN_CONCRETE_THICKNESS = 0.1; // m

export function calculateQuantitySurvey(
  geo: CulvertGeometry,
  rail: RailwayLoadingParams,
  costs: UnitCostParams,
  concreteGrade: string,
  sections: SectionRebarDesign[] = []
): QuantitySurveyReport {
  const bExt = geo.clearSpan + 2 * geo.sideWallThickness;
  const hExt = geo.clearHeight + geo.topSlabThickness + geo.bottomSlabThickness;
  const L = geo.totalLength;

  // 1. Beton Hacimleri (m³)
  const vTop = bExt * geo.topSlabThickness * L;
  const vBot = bExt * geo.bottomSlabThickness * L;
  const vWalls = 2 * geo.sideWallThickness * geo.clearHeight * L;
  const singleHaunchArea = 0.5 * geo.haunchWidth * geo.haunchHeight;
  const vHaunch = 2 * singleHaunchArea * L; // Yalnızca üst tabliye kenar birleşiminde 2 adet pah (tabanda pah yok)
  const vConcreteTotal = Number((vTop + vBot + vWalls + vHaunch).toFixed(2));

  // 2. Kalıp Yüzey Alanları (m²)
  // İç kalıp: üst plak alt yüzeyi (tavan) + yan duvar iç yüzeyleri + pah yüzeyleri
  const aInnerTop = geo.clearSpan * L;
  const aInnerWalls = 2 * geo.clearHeight * L;
  const haunchHypotenuse = Math.sqrt(Math.pow(geo.haunchWidth, 2) + Math.pow(geo.haunchHeight, 2));
  const aInnerHaunches = 2 * haunchHypotenuse * L; // Yalnızca 2 üst pah
  const aInnerFormwork = aInnerTop + aInnerWalls + aInnerHaunches;

  // Dış yüzeyler (üst plak üstü, duvar dışları, taban plak altı) toprakla/yalıtım ile
  // temas ettiğinden kalıp yapılmaz. Yalnızca alın (portal) aynaları kalıplanır.
  const aPortals = 2 * (bExt * hExt - geo.clearSpan * geo.clearHeight);

  const aFormworkTotal = Number((aInnerFormwork + aPortals).toFixed(2));

  // 3. Detaylı Donatı Metrajı ve Bar Bending Schedule
  // Birim ağırlık: w = π · d² · 7850 / 4  (kg/m)
  function getUnitWeight(dMm: number): number {
    return Number(((Math.PI * Math.pow(dMm / 1000, 2) * 7850) / 4).toFixed(3));
  }

  const rebarSchedule: RebarScheduleItem[] = [];
  let posCounter = 1;

  /** Yapısal çözücüden seçilen çap/aralığı (yoksa varsayılan) */
  function pick(sectionPart: string, fallbackDia: number, fallbackSpacingCm: number) {
    const found = sections.find((s) => s.sectionName.startsWith(sectionPart));
    if (found) {
      return { dia: found.providedBarDia, spacing: found.providedSpacing / 100 };
    }
    return { dia: fallbackDia, spacing: fallbackSpacingCm / 100 };
  }

  /** Bir ana donatı pozunu (enine çekme/mesnet) metraja ekler */
  function pushMainBar(
    element: string,
    shapeCode: string,
    dia: number,
    spacingM: number,
    lengthM: number,
    multiplier: number = 1
  ) {
    const count = (Math.ceil(L / spacingM) + 1) * multiplier;
    const wUnit = getUnitWeight(dia);
    rebarSchedule.push({
      posNo: posCounter++,
      element,
      barDiameter: dia,
      shapeCode,
      barCount: count,
      barLength: Number(lengthM.toFixed(2)),
      totalLength: Number((count * lengthM).toFixed(1)),
      unitWeight: wUnit,
      totalWeightKg: Number((count * lengthM * wUnit).toFixed(1)),
    });
  }

  // Poz 1: Üst Plak Enine Çekme Donatısı (Alt Sıra) — yapısal çözücü seçimi
  const topSpan = pick('Üst Plak Açıklık', 20, 15);
  pushMainBar(
    'Üst Plak Alt Donatı (Enine Çekme)',
    'U-Gönyeli Çubuk',
    topSpan.dia,
    topSpan.spacing,
    bExt + 2 * 0.4 // 40 cm gönye payı
  );

  // Poz 2: Üst Plak Mesnet Donatısı (Üst Sıra) — yapısal çözücü seçimi
  const topSupport = pick('Üst Plak Mesnet', 20, 15);
  pushMainBar(
    'Üst Plak Mesnet Donatısı (Negatif Moment)',
    'U-Gönyeli Çubuk',
    topSupport.dia,
    topSupport.spacing,
    bExt + 2 * 0.5 // 50 cm gönye payı
  );

  // Poz 3: Alt Plak Enine Çekme Donatısı (Üst Sıra) — yapısal çözücü seçimi
  const botSpan = pick('Alt Plak Açıklık', 20, 15);
  pushMainBar(
    'Alt Plak Üst Donatı (Açıklık Çekme)',
    'U-Gönyeli Çubuk',
    botSpan.dia,
    botSpan.spacing,
    bExt + 2 * 0.4
  );

  // Poz 4: Alt Plak Alt Donatı (Mesnet & Aşınma) — yapısal çözücü seçimi
  const botSupport = pick('Alt Plak Mesnet', 20, 15);
  pushMainBar(
    'Alt Plak Alt Donatı (Mesnet & Aşınma)',
    'U-Gönyeli Çubuk',
    botSupport.dia,
    botSupport.spacing,
    bExt + 2 * 0.4
  );

  // Poz 5: Yan Duvar Dış Donatısı (Düşey) — yapısal çözücü seçimi
  const wallOuter = pick('Yan Duvar Mesnet', 18, 15);
  pushMainBar(
    'Yan Duvar Dış Düşey Donatısı (Zemin İtkisi)',
    'L-Gönyeli Düşey Çubuk',
    wallOuter.dia,
    wallOuter.spacing,
    hExt + 2 * 0.45,
    2 // 2 duvar
  );

  // Poz 6: Yan Duvar İç Donatısı (Düşey) — yapısal çözücü seçimi
  const wallInner = pick('Yan Duvar Açıklık', 16, 15);
  pushMainBar(
    'Yan Duvar İç Düşey Donatısı',
    'L-Gönyeli Düşey Çubuk',
    wallInner.dia,
    wallInner.spacing,
    hExt + 2 * 0.35,
    2
  );

  // Poz 7: Boyuna Dağıtma Donatıları (Tüm Plak ve Duvarlarda) - Phi 14 / 20 cm
  const perimeter = 2 * (bExt + hExt);
  const count7 = Math.ceil(perimeter / 0.2) * 2; // Çift sıra
  const len7 = L + 0.6; // Bindirme payı
  const wUnit14 = getUnitWeight(14);
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Boyuna Dağıtma ve Rötre Donatısı',
    barDiameter: 14,
    shapeCode: 'Düz Boyuna Çubuk',
    barCount: count7,
    barLength: Number(len7.toFixed(2)),
    totalLength: Number((count7 * len7).toFixed(1)),
    unitWeight: wUnit14,
    totalWeightKg: Number((count7 * len7 * wUnit14).toFixed(1)),
  });

  // Poz 8: Üst Köşe Pah Takviye Donatısı - Phi 16 / 20 cm (Yalnızca Üst Tabliye 2 Pah)
  const count8 = (Math.ceil(L / 0.2) + 1) * 2;
  const len8 = 1.2;
  const wUnit16 = getUnitWeight(16);
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Üst Köşe Pah Takviye Donatısı (45° Diyagonal - 2 Üst Köşe)',
    barDiameter: 16,
    shapeCode: 'Çapraz Çubuk',
    barCount: count8,
    barLength: len8,
    totalLength: Number((count8 * len8).toFixed(1)),
    unitWeight: wUnit16,
    totalWeightKg: Number((count8 * len8 * wUnit16).toFixed(1)),
  });

  // Poz 9: Duvar ve Plak Çirozları (S-Kancalar) - Phi 12 / ~40x40 cm
  const areaSlabsAndWalls = 2 * bExt * L + 2 * hExt * L;
  const count9 = Math.ceil(areaSlabsAndWalls * 6); // 6 adet/m²
  const len9 = 0.65;
  const wUnit12 = getUnitWeight(12);
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Bağlantı Çirozları (S-Kanca)',
    barDiameter: 12,
    shapeCode: 'Çiroz Kanca',
    barCount: count9,
    barLength: len9,
    totalLength: Number((count9 * len9).toFixed(1)),
    unitWeight: wUnit12,
    totalWeightKg: Number((count9 * len9 * wUnit12).toFixed(1)),
  });

  // Toplam Donatı ve Çap Dökümü
  let rebarWeightTotalKg = 0;
  const diaMap = new Map<number, number>();

  for (const item of rebarSchedule) {
    rebarWeightTotalKg += item.totalWeightKg;
    const cur = diaMap.get(item.barDiameter) || 0;
    diaMap.set(item.barDiameter, cur + item.totalWeightKg);
  }

  const rebarWeightTotalTon = Number((rebarWeightTotalKg / 1000).toFixed(2));
  const rebarRatioKgPerM3 = Number((rebarWeightTotalKg / vConcreteTotal).toFixed(1));

  const diameterBreakdown = Array.from(diaMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dia, weight]) => ({
      diameter: dia,
      weightKg: Number(weight.toFixed(1)),
      weightTon: Number((weight / 1000).toFixed(2)),
      percentage: Number(((weight / rebarWeightTotalKg) * 100).toFixed(1)),
    }));

  // 4. Toprak İşleri (Kazı, Dolgu, Grobeton)
  // Temel çukuru: menfez dış ölçüleri + her yandan 0.60 m çalışma payı.
  // Derinlik: üst plak üst kotundan (balast üstü) taban grobetonu altına kadar.
  // Kazı dik kenarlı (kazı kazığı/iksali); kazılan malzeme geri dolgu için stoklanır.
  const bExcavation = bExt + 2 * WORKING_SPACE;
  const hExcavation = rail.fillHeight + hExt + LEAN_CONCRETE_THICKNESS;
  const vExcavation = Number((bExcavation * hExcavation * L).toFixed(2));
  const vLeanConcrete = Number((bExcavation * LEAN_CONCRETE_THICKNESS * L).toFixed(2));
  // Geri dolgu: kazılan hacimden beton ve grobeton hacmi düşülür (menfez çevresindeki boşluk)
  const vBackfill = Number(Math.max(vExcavation - (vConcreteTotal + vLeanConcrete), 0).toFixed(2));

  // 5. Su Yalıtımı ve Koruma
  // Üst plak üst yüzeyi + yan duvar dış yüzeyleri (dolgu altında kalan kısım dahil)
  const aWaterproofing = Number((bExt * L + 2 * hExt * L).toFixed(2));
  const aDrainageBoard = aWaterproofing;

  // 6. Poz Bazlı TCDD Maliyet Tablosu
  const items: MaterialQuantityItem[] = [
    {
      posNo: 'TCDD.15.120',
      description: `Betonarme Betonu (${concreteGrade}) Temin ve Dökümü`,
      unit: 'm³',
      quantity: vConcreteTotal,
      unitPrice: costs.concretePrice,
      totalCost: Number((vConcreteTotal * costs.concretePrice).toFixed(2)),
      notes: 'Plaklar, perdeler ve ampatmanlar',
    },
    {
      posNo: 'TCDD.23.010',
      description: 'Nervürlü Beton Çeliği (B420C/B500C) Temin ve İşçiliği',
      unit: 'Ton',
      quantity: rebarWeightTotalTon,
      unitPrice: costs.rebarPrice,
      totalCost: Number((rebarWeightTotalTon * costs.rebarPrice).toFixed(2)),
      notes: `Donatı yoğunluğu: ${rebarRatioKgPerM3} kg/m³ — çap/aralıklar tahkik sekmesiyle aynıdır`,
    },
    {
      posNo: 'TCDD.21.011',
      description: 'Düz Yüzeyli Betonarme Ahşap/Plywood Kalıp Yapılması',
      unit: 'm²',
      quantity: aFormworkTotal,
      unitPrice: costs.formworkPrice,
      totalCost: Number((aFormworkTotal * costs.formworkPrice).toFixed(2)),
      notes: 'Menfez iç tavanı, iç yan duvarlar, pah yüzeyleri ve portal aynaları (dış yüzeyler kalıpsız)',
    },
    {
      posNo: 'TCDD.14.005',
      description: 'Temel Çukuru Kazısı Yapılması ve Nakli',
      unit: 'm³',
      quantity: vExcavation,
      unitPrice: costs.excavationPrice,
      totalCost: Number((vExcavation * costs.excavationPrice).toFixed(2)),
      notes: `Her yandan ${WORKING_SPACE.toFixed(2)} m çalışma payı, dik kazı; kazılan malzeme stoklanır`,
    },
    {
      posNo: 'TCDD.14.080',
      description: 'Granülometrik Kum-Çakıl ile Tabakalar Halinde Geri Dolgu',
      unit: 'm³',
      quantity: vBackfill,
      unitPrice: costs.backfillPrice,
      totalCost: Number((vBackfill * costs.backfillPrice).toFixed(2)),
      notes: 'Menfez çevresindeki boşluk; tabakalar halinde sıkıştırma testleri dahil',
    },
    {
      posNo: 'TCDD.15.100',
      description: 'Temel Altı C16/20 Grobeton Dökülmesi (10 cm)',
      unit: 'm³',
      quantity: vLeanConcrete,
      unitPrice: costs.concretePrice * 0.75,
      totalCost: Number((vLeanConcrete * (costs.concretePrice * 0.75)).toFixed(2)),
      notes: 'Tesviye ve donatı alt koruma tabakası',
    },
    {
      posNo: 'TCDD.19.040',
      description: 'Çift Kat Bitümlü Membran Su Yalıtımı ve Drenaj Örtüsü',
      unit: 'm²',
      quantity: aWaterproofing,
      unitPrice: costs.waterproofingPrice,
      totalCost: Number((aWaterproofing * costs.waterproofingPrice).toFixed(2)),
      notes: 'Üst plak üst yüzeyi ve yan duvar dış yüzeyleri',
    },
  ];

  const totalEstimatedCost = Number(
    items.reduce((acc, cur) => acc + cur.totalCost, 0).toFixed(2)
  );

  return {
    concreteVolumeTotal: vConcreteTotal,
    concreteGrade,
    formworkAreaTotal: aFormworkTotal,
    rebarWeightTotalKg,
    rebarWeightTotalTon,
    rebarRatioKgPerM3,
    excavationVolumeM3: vExcavation,
    backfillVolumeM3: vBackfill,
    leanConcreteVolumeM3: vLeanConcrete,
    waterproofingAreaM2: aWaterproofing,
    drainageBoardAreaM2: aDrainageBoard,
    items,
    rebarSchedule,
    diameterBreakdown,
    totalEstimatedCost,
    currency: costs.currency,
  };
}
