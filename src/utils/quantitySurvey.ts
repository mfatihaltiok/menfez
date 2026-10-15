/**
 * Bill of Quantities (BOQ / Malzeme Metrajı) Calculator for TCDD Box Culverts
 * Calculates Concrete, Formwork, Detailed Rebar Schedule (Bar Bending), Earthwork, and Waterproofing
 */

import {
  CulvertGeometry,
  RailwayLoadingParams,
  UnitCostParams,
  QuantitySurveyReport,
  RebarScheduleItem,
  MaterialQuantityItem,
} from '../types/culvert';

export function calculateQuantitySurvey(
  geo: CulvertGeometry,
  rail: RailwayLoadingParams,
  costs: UnitCostParams,
  concreteGrade: string
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
  // İç kalıp
  const aInnerTop = geo.clearSpan * L;
  const aInnerWalls = 2 * geo.clearHeight * L;
  const haunchHypotenuse = Math.sqrt(Math.pow(geo.haunchWidth, 2) + Math.pow(geo.haunchHeight, 2));
  const aInnerHaunches = 2 * haunchHypotenuse * L; // Yalnızca 2 üst pah
  const aInnerFormwork = aInnerTop + aInnerWalls + aInnerHaunches;

  // Dış kalıp
  const aOuterWalls = 2 * hExt * L;

  // Alın / Başlık kalıpları (Giriş ve çıkış portalleri)
  const aPortals = 2 * (bExt * hExt - geo.clearSpan * geo.clearHeight);

  const aFormworkTotal = Number((aInnerFormwork + aOuterWalls + aPortals).toFixed(2));

  // 3. Detaylı Donatı Metrajı ve Bar Bending Schedule
  // Birim ağırlık formülü: w = d^2 * 0.006165 kg/m
  function getUnitWeight(dMm: number): number {
    return Number(((Math.PI * Math.pow(dMm / 1000, 2) * 7850) / 4).toFixed(3));
  }

  const rebarSchedule: RebarScheduleItem[] = [];
  let posCounter = 1;

  // Poz 1: Üst Plak Enine Çekme Donatısı (Alt Sıra) - Phi 20 / 15 cm
  const spacing1 = 0.15;
  const count1 = Math.ceil(L / spacing1) + 1;
  const len1 = bExt + 2 * 0.4; // Gönyeli boy
  const wUnit1 = getUnitWeight(20);
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Üst Plak Alt Donatı (Enine Çekme)',
    barDiameter: 20,
    shapeCode: 'U-Gönyeli Çubuk',
    barCount: count1,
    barLength: Number(len1.toFixed(2)),
    totalLength: Number((count1 * len1).toFixed(1)),
    unitWeight: wUnit1,
    totalWeightKg: Number((count1 * len1 * wUnit1).toFixed(1)),
  });

  // Poz 2: Üst Plak Mesnet Pilyesi/Üst Donatı - Phi 20 / 15 cm
  const count2 = Math.ceil(L / spacing1) + 1;
  const len2 = bExt + 2 * 0.5;
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Üst Plak Mesnet Donatısı (Negatif Moment)',
    barDiameter: 20,
    shapeCode: 'U-Gönyeli Çubuk',
    barCount: count2,
    barLength: Number(len2.toFixed(2)),
    totalLength: Number((count2 * len2).toFixed(1)),
    unitWeight: wUnit1,
    totalWeightKg: Number((count2 * len2 * wUnit1).toFixed(1)),
  });

  // Poz 3: Alt Plak Enine Çekme Donatısı (Üst Sıra) - Phi 20 / 15 cm
  const count3 = Math.ceil(L / spacing1) + 1;
  const len3 = bExt + 2 * 0.4;
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Alt Plak Üst Donatı (Açıklık Çekme)',
    barDiameter: 20,
    shapeCode: 'U-Gönyeli Çubuk',
    barCount: count3,
    barLength: Number(len3.toFixed(2)),
    totalLength: Number((count3 * len3).toFixed(1)),
    unitWeight: wUnit1,
    totalWeightKg: Number((count3 * len3 * wUnit1).toFixed(1)),
  });

  // Poz 4: Alt Plak Alt Donatı (Mesnet & Zemin Basıncı) - Phi 20 / 15 cm
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Alt Plak Alt Donatı (Mesnet & Aşınma)',
    barDiameter: 20,
    shapeCode: 'U-Gönyeli Çubuk',
    barCount: count3,
    barLength: Number(len3.toFixed(2)),
    totalLength: Number((count3 * len3).toFixed(1)),
    unitWeight: wUnit1,
    totalWeightKg: Number((count3 * len3 * wUnit1).toFixed(1)),
  });

  // Poz 5: Yan Duvar Dış Donatı (Düşey) - Phi 18 / 15 cm (2 Duvar)
  const count5 = (Math.ceil(L / spacing1) + 1) * 2;
  const len5 = hExt + 2 * 0.45;
  const wUnit18 = getUnitWeight(18);
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Yan Duvar Dış Düşey Donatısı (Zemin İtkisi)',
    barDiameter: 18,
    shapeCode: 'L-Gönyeli Düşey Çubuk',
    barCount: count5,
    barLength: Number(len5.toFixed(2)),
    totalLength: Number((count5 * len5).toFixed(1)),
    unitWeight: wUnit18,
    totalWeightKg: Number((count5 * len5 * wUnit18).toFixed(1)),
  });

  // Poz 6: Yan Duvar İç Donatı (Düşey) - Phi 16 / 15 cm (2 Duvar)
  const count6 = (Math.ceil(L / spacing1) + 1) * 2;
  const len6 = hExt + 2 * 0.35;
  const wUnit16 = getUnitWeight(16);
  rebarSchedule.push({
    posNo: posCounter++,
    element: 'Yan Duvar İç Düşey Donatısı',
    barDiameter: 16,
    shapeCode: 'L-Gönyeli Düşey Çubuk',
    barCount: count6,
    barLength: Number(len6.toFixed(2)),
    totalLength: Number((count6 * len6).toFixed(1)),
    unitWeight: wUnit16,
    totalWeightKg: Number((count6 * len6 * wUnit16).toFixed(1)),
  });

  // Poz 7: Boyuna Dağıtma Donatıları (Tüm Plak ve Duvarlarda) - Phi 14 / 20 cm
  // Çevre boyunca dağıtma donatısı adedi
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

  // Poz 9: Duvar ve Plak Çirozları (S-Kancalar) - Phi 12 / 40x40 cm
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
  const bExcavation = bExt + 2 * 0.6; // 60 cm çalışma payı
  const hExcavation = rail.fillHeight + hExt + 0.1; // 10 cm grobeton dahil
  const vExcavation = Number((bExcavation * hExcavation * L).toFixed(2));
  const vLeanConcrete = Number((bExcavation * 0.1 * L).toFixed(2));
  const vBackfill = Number(Math.max(vExcavation - (vConcreteTotal + vLeanConcrete), 0).toFixed(2));

  // 5. Su Yalıtımı ve Koruma
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
      notes: `Donatı Yoğunluğu: ${rebarRatioKgPerM3} kg/m³`,
    },
    {
      posNo: 'TCDD.21.011',
      description: 'Düz Yüzeyli Betonarme Ahşap/Plywood Kalıp Yapılması',
      unit: 'm²',
      quantity: aFormworkTotal,
      unitPrice: costs.formworkPrice,
      totalCost: Number((aFormworkTotal * costs.formworkPrice).toFixed(2)),
      notes: 'İç, dış ve portal aynaları',
    },
    {
      posNo: 'TCDD.14.005',
      description: 'Temel Çukuru Kazısı Yapılması ve Nakli',
      unit: 'm³',
      quantity: vExcavation,
      unitPrice: costs.excavationPrice,
      totalCost: Number((vExcavation * costs.excavationPrice).toFixed(2)),
      notes: 'Çalışma payı ve şevlendirme dahil',
    },
    {
      posNo: 'TCDD.14.080',
      description: 'Granülometrik Kum-Çakıl ile Tabakalar Halinde Geri Dolgu',
      unit: 'm³',
      quantity: vBackfill,
      unitPrice: costs.backfillPrice,
      totalCost: Number((vBackfill * costs.backfillPrice).toFixed(2)),
      notes: 'Kompaktlama ve sıkıştırma testleri dahil',
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
      notes: 'Üst plak ve yan duvar dış yüzeyleri',
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
