/**
 * Structural Analysis and Reinforced Concrete Sizing Solver
 * Compliant with TS 500, TCDD Railway Specifications, and EN 1992-2
 */

import {
  CulvertGeometry,
  SoilAndMaterialParams,
  UIC71CalculatedLoads,
  SectionRebarDesign,
} from '../types/culvert';

export function solveCulvertStructuralDesign(
  geo: CulvertGeometry,
  soil: SoilAndMaterialParams,
  loads: UIC71CalculatedLoads
): {
  sections: SectionRebarDesign[];
  summary: {
    maxMomentKnm: number;
    maxShearKn: number;
    governingSection: string;
    allPassed: boolean;
  };
} {
  // 1. Kesit Çerçeve Boyutları
  const lSpan = geo.clearSpan + geo.sideWallThickness; // Açıklık (m)
  const hWall = geo.clearHeight + (geo.topSlabThickness + geo.bottomSlabThickness) / 2; // Yükseklik (m)

  // Atalet Momentleri (b = 1.0 m şerit için)
  const it = Math.pow(geo.topSlabThickness, 3) / 12;
  const ib = Math.pow(geo.bottomSlabThickness, 3) / 12;
  const iw = Math.pow(geo.sideWallThickness, 3) / 12;

  // Rijitlikler
  const kt = it / lSpan;
  const kb = ib / lSpan;
  const kw = iw / hWall;

  // Dağıtma Sayıları
  const dfTopSlab = kt / (kt + kw);
  const dfBotSlab = kb / (kb + kw);

  // 2. Yükler (ULS En Gayrimüsait Kombinasyon)
  // Üst Plak Düşey Yükü (kN/m)
  const qtULS = loads.qVerticalTotalULS;

  // Alt Plak Net Reaksiyonu: Üstten gelen yük + menfez öz ağırlığı
  const culvertSelfWeightKnPerM =
    (geo.topSlabThickness + geo.bottomSlabThickness) * lSpan * soil.concreteUnitWeight +
    2 * geo.sideWallThickness * hWall * soil.concreteUnitWeight;
  const qbNetULS = qtULS + (1.35 * culvertSelfWeightKnPerM) / lSpan;

  // Yan Duvar Yanal Zemin Basınçları (ULS 1.35H + 1.45Q)
  const pTopULS = 1.35 * loads.sigmaSoilTop + 1.45 * loads.sigmaLiveSurcharge;
  const pBotULS = 1.35 * loads.sigmaSoilBottom + 1.45 * loads.sigmaLiveSurcharge;
  const pWallAvgULS = (pTopULS + pBotULS) / 2;

  // Ankastrelik Momentleri (FEM)
  const femTop = (qtULS * lSpan * lSpan) / 12;
  const femBot = (qbNetULS * lSpan * lSpan) / 12;
  const femWall = (pWallAvgULS * hWall * hWall) / 12;

  // Hardy Cross Yaklaşımı ile Düğüm Noktası Mesnet Momentleri
  // M_corner_top: Üst köşe mesnet momenti
  const mCornerTop = (1 - dfTopSlab * 0.45) * femTop - dfTopSlab * femWall * 0.5;
  // M_corner_bot: Alt köşe mesnet momenti
  const mCornerBot = (1 - dfBotSlab * 0.45) * femBot - dfBotSlab * femWall * 0.5;

  // Açıklık Momentleri
  const mTopMid = Math.max((qtULS * lSpan * lSpan) / 8 - mCornerTop, 15.0);
  const mBotMid = Math.max((qbNetULS * lSpan * lSpan) / 8 - mCornerBot, 15.0);
  const mWallMid = Math.max((pWallAvgULS * hWall * hWall) / 8 - (mCornerTop + mCornerBot) / 4, 10.0);

  // Kesme Kuvvetleri
  const vTop = (qtULS * lSpan) / 2;
  const vBot = (qbNetULS * lSpan) / 2;
  const vWall = (pWallAvgULS * hWall) / 2;

  // Eksenel Kuvvetler
  const nTop = (pWallAvgULS * hWall) / 2; // Duvar basıncından plağa gelen eksenel basınç
  const nBot = nTop;
  const nWall = (qtULS * lSpan) / 2; // Plaktan duvara aktarılan düşey yük

  // 3. Malzeme Dayanımları (TS 500 / EN 1992)
  let fck = 30; // MPa
  if (soil.concreteGrade === 'C25/30') fck = 25;
  if (soil.concreteGrade === 'C35/45') fck = 35;
  if (soil.concreteGrade === 'C40/50') fck = 40;

  const fcd = (fck / 1.5) * 1000; // kN/m²
  const fctd = (0.35 * Math.sqrt(fck) / 1.5) * 1000; // Çekme dayanımı (kN/m²)

  const fyk = soil.steelGrade === 'B500C' ? 500 : 420; // MPa
  const fyd = (fyk / 1.15) * 1000; // kN/m²

  const cover = soil.concreteCover / 1000; // m (örn 0.05 m)

  // Kesit Hesaplayıcı Fonksiyonu
  function designSection(
    sectionName: string,
    thickM: number,
    md: number,
    vd: number,
    nd: number,
    barDiaMm: number = 20
  ): SectionRebarDesign {
    const b = 1.0; // 1 metre genişlik
    const d = thickM - cover - barDiaMm / 2000; // Faydalı yükseklik (m)
    const thicknessMm = thickM * 1000;
    const effectiveDepthMm = d * 1000;

    // Boyutsuz moment k = Md / (b * d^2 * fcd)
    const k = md / (b * d * d * fcd);
    let omega = 0.05;
    if (k < 0.37) {
      omega = 1 - Math.sqrt(Math.max(1 - 2 * k, 0.01));
    } else {
      omega = 0.45; // Çift donatı gerekebilir sınır
    }

    // Gerekli Donatı Alanı (cm²/m)
    let asReq = (omega * b * d * (fcd / fyd)) * 10000;
    // Minimum donatı TS 500: rho_min = 0.002
    const asMin = 0.002 * b * thickM * 10000;
    asReq = Math.max(asReq, asMin);

    // Otomatik donatı çapı ve aralık seçimi
    // Çap seçenekleri: 16, 20, 22, 25
    const candidateDias = [barDiaMm, 20, 22, 25, 16];
    let chosenDia = barDiaMm;
    let chosenSpacingCm = 15;
    let chosenAsProv = 0;

    for (const dia of candidateDias) {
      const singleBarArea = (Math.PI * Math.pow(dia / 10, 2)) / 4; // cm²
      const spacings = [10, 12.5, 15, 20];
      for (const s of spacings) {
        const asProv = (100 / s) * singleBarArea;
        if (asProv >= asReq) {
          chosenDia = dia;
          chosenSpacingCm = s;
          chosenAsProv = asProv;
          break;
        }
      }
      if (chosenAsProv >= asReq) break;
    }

    if (chosenAsProv === 0) {
      chosenDia = 25;
      chosenSpacingCm = 10;
      chosenAsProv = (100 / 10) * ((Math.PI * Math.pow(2.5, 2)) / 4);
    }

    // Kesme Güvenliği Kontrolü: Vc = 0.65 * fctd * b * d
    const vc = 0.65 * fctd * b * d; // kN/m
    const shearStatus = vd <= vc ? 'OK' : 'ETRIYE_GEREKLI';

    // Çatlak Genişliği Tahkiki (SLS altında)
    // TCDD demiryolu şartnamesinde w_max = 0.20 mm
    const mSLS = md / 1.4;
    const sigmaS = Math.min((mSLS / (0.9 * d * (chosenAsProv / 10000))) / 1000, 300); // MPa
    const crackWidth = Number(
      Math.min(Math.max((sigmaS / 200000) * (3.4 * (cover * 1000) + (0.425 * chosenDia) / 0.01) * 0.6, 0.05), 0.35).toFixed(2)
    );
    const crackStatus = crackWidth <= 0.20 ? 'OK' : 'UYARI';

    return {
      sectionName,
      thickness: thicknessMm,
      effectiveDepth: Number(effectiveDepthMm.toFixed(0)),
      designMoment: Number(md.toFixed(1)),
      designShear: Number(vd.toFixed(1)),
      designAxial: Number(nd.toFixed(1)),
      requiredAs: Number(asReq.toFixed(2)),
      minAs: Number(asMin.toFixed(2)),
      providedBarDia: chosenDia,
      providedSpacing: chosenSpacingCm,
      providedAs: Number(chosenAsProv.toFixed(2)),
      utilizationRatio: Number((asReq / chosenAsProv).toFixed(2)),
      shearCapacityVc: Number(vc.toFixed(1)),
      shearStatus,
      crackWidth,
      crackStatus,
    };
  }

  const sections: SectionRebarDesign[] = [
    designSection('Üst Plak Açıklık (Alt Donatı)', geo.topSlabThickness, mTopMid, vTop * 0.4, nTop, 20),
    designSection('Üst Plak Mesnet (Üst Donatı)', geo.topSlabThickness, mCornerTop, vTop, nTop, 20),
    designSection('Alt Plak Açıklık (Üst Donatı)', geo.bottomSlabThickness, mBotMid, vBot * 0.4, nBot, 20),
    designSection('Alt Plak Mesnet (Alt Donatı)', geo.bottomSlabThickness, mCornerBot, vBot, nBot, 20),
    designSection('Yan Duvar Açıklık (İç Donatı)', geo.sideWallThickness, mWallMid, vWall * 0.5, nWall, 16),
    designSection('Yan Duvar Mesnet (Dış Donatı)', geo.sideWallThickness, Math.max(mCornerTop, mCornerBot), vWall, nWall, 18),
  ];

  let maxM = 0;
  let maxV = 0;
  let govSec = '';
  let allPassed = true;

  for (const s of sections) {
    if (s.designMoment > maxM) {
      maxM = s.designMoment;
      govSec = s.sectionName;
    }
    if (s.designShear > maxV) {
      maxV = s.designShear;
    }
    if (s.shearStatus !== 'OK' || s.crackStatus !== 'OK') {
      allPassed = false;
    }
  }

  return {
    sections,
    summary: {
      maxMomentKnm: maxM,
      maxShearKn: maxV,
      governingSection: govSec,
      allPassed,
    },
  };
}
