/**
 * Structural Analysis and Reinforced Concrete Sizing Solver
 * Compliant with TS 500, TCDD Railway Specifications, and EN 1992-2
 *
 * YÖNTEM NOTU
 * -----------
 * Menfez, "tek geçişli yaklaşık çerçeve moment dağılımı" ile çözülür:
 * dağıtma katsayıları üyelerin atalet momentlerinden hesaplanır, ardından
 * mesnet ve açıklık momentleri FEM düzeltmesiyle yazılır. Bu yöntem
 * iteratif bir moment dağılımı (Hardy Cross / portföy yöntemi) DEĞİLDİR;
 * büyüklük mertebesi doğru, kesin değildir. Kesin sonuçlar için SAP2000
 * kabuk modeli esas alınmalıdır.
 *
 * Donatı seçimi hem eğilme (As,req) hem de çatlak genişliği (wk ≤ w_lim)
 * şartlarını birlikte sağlayacak en ekonomik çözümü arar.
 */

import {
  CulvertGeometry,
  SoilAndMaterialParams,
  UIC71CalculatedLoads,
  SectionRebarDesign,
} from '../types/culvert';

/** TCDD demiryolu şartnamesi çatlak genişliği üst sınırı (mm) */
export const CRACK_WIDTH_LIMIT = 0.2;

/** TS 500 minimum donatı oranı (plak) */
const RHO_MIN = 0.002;

/** Donatı çapı adayları (mm) — TS 500 üretim çapları */
const BAR_DIAMETERS = [12, 14, 16, 18, 20, 22, 25];

/** Donatı aralığı adayları (cm) — en seyrekten başlanarak sıklaştırılır */
const SPACING_CANDIDATES = [20, 15, 12.5, 10];

/** Çelik elastisite modülü (MPa) */
const ES = 200000;

/** Çekme dayanımı katsayısı (EN 1992-2) */
const KT = 0.4;

/** Çekme sertleştirme katsayısı (EN 1992-2) */
const ALPHA_E = 20;

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
    crackLimitedSections: number;
  };
} {
  // 1. Kesit Çerçeve Boyutları (üye uzunlukları eksenler arasıdır)
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

  // Yaklaşık mesnet momentleri (tek geçişli dağıtım)
  const mCornerTop = (1 - dfTopSlab * 0.45) * femTop - dfTopSlab * femWall * 0.5;
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

  const fcd = (fck / 1.5) * 1000; // kN/m² (tasarım basınç dayanımı)
  const fctd = (0.35 * Math.sqrt(fck) / 1.5) * 1000; // Çekme dayanımı (kN/m²)
  const fctdMPa = fctd / 1000;

  const fyk = soil.steelGrade === 'B500C' ? 500 : 420; // MPa
  const fyd = (fyk / 1.15) * 1000; // kN/m²

  const cover = soil.concreteCover / 1000; // m (örn 0.05 m)

  // Çatlak genişliği (EN 1992-2 / EN 1992-1-1 Annex L)
  function calcCrackWidth(mSLS: number, d: number, asProvM2: number): number {
    const b = 1.0;
    // Çelik gerilmesi (çekme donatısı) — lineer elastik, taşıma gücü sınırına kadar
    const sigmaS = Math.min((mSLS / (0.9 * d * asProvM2)) / 1000, 300); // MPa
    // Etkin çekme donatısı oranı
    const rhoEff = asProvM2 / (b * d);
    // Ortalama gerilme (çekme sertleştirme dikkate alınmış)
    const epsSm =
      Math.max((sigmaS - KT * fctdMPa) / ES, 0) * ((1 + ALPHA_E * rhoEff) / (1 + rhoEff));
    // Ortalama çatlak aralığı (EN 1992-1-1 Denk. 7.2)
    const srM = 1.3 * (cover * 1000 + 0.425 * d * 1000); // mm
    const wk = srM * epsSm; // mm
    return Math.min(Math.max(wk, 0.05), 0.35);
  }

  // Kesit Hesaplayıcı Fonksiyonu
  function designSection(
    sectionName: string,
    thickM: number,
    md: number,
    vd: number,
    nd: number,
    preferredDiaMm: number = 20
  ): SectionRebarDesign {
    const b = 1.0; // 1 metre genişlik
    const thicknessMm = thickM * 1000;
    const asMin = RHO_MIN * b * thickM * 10000; // cm²/m

    // Donatı çapı adayları: tercih edilen çaptan başlayarak yukarı doğru
    const diaCandidates = BAR_DIAMETERS.filter((d) => d >= preferredDiaMm);

    // --- Adım 1: Tercih edilen çap ve en sık aralıkla başlayarak gerekli alanı hesapla ---
    let dia = preferredDiaMm;
    let d = thickM - cover - dia / 2000;
    let k = md / (b * d * d * fcd);
    let omega = k < 0.37 ? 1 - Math.sqrt(Math.max(1 - 2 * k, 0.01)) : 0.45;
    let asReq = Math.max(omega * b * d * (fcd / fyd) * 10000, asMin);

    // --- Adım 2: Eğilme + çatlak şartlarını birlikte sağlayan (çap, aralık) ---
    // Öncelik kuralı:
    //   1) Tercih edilen çaptan başla (detaylandırmada çap tutarlılığı),
    //   2) Aynı çapta aralığı en seyrekten başlayarak sıklaştır,
    //   3) Çatlak sınırını sağlayan ilk (çap, aralık) çiftini kabul et.
    // Eğilme şartını hiçbir kombinasyon sağlamıyorsa en yoğun donatı seçilir.
    interface Candidate {
      dia: number;
      spacing: number;
      asProv: number;
    }

    let chosen: Candidate | null = null;
    let crackGoverned = false;
    let fallback: Candidate | null = null;
    let fallbackCrack = Number.POSITIVE_INFINITY;

    for (const cDia of diaCandidates) {
      const singleBarArea = (Math.PI * Math.pow(cDia / 10, 2)) / 4; // cm²
      for (const s of SPACING_CANDIDATES) {
        const asProv = (100 / s) * singleBarArea;
        if (asProv < asReq) continue; // eğilme şartını sağlamıyor

        const dCand = thickM - cover - cDia / 2000;
        const wk = calcCrackWidth(md / 1.4, dCand, asProv / 10000);

        if (wk < fallbackCrack) {
          fallbackCrack = wk;
          fallback = { dia: cDia, spacing: s, asProv };
        }
        if (wk <= CRACK_WIDTH_LIMIT) {
          chosen = { dia: cDia, spacing: s, asProv };
          break;
        }
      }
      if (chosen) break;
    }

    if (!chosen) {
      // Çatlak sınırı hiçbir kombinasyonda sağlanamadı → en iyi (en düşük çatlak)
      // adayı seçilir ve kesit "UYARI" olarak işaretlenir.
      chosen = fallback;
      crackGoverned = true;
    }

    if (!chosen) {
      // Hiçbir aday eğilme şartını sağlamıyor → en yoğun donatı
      const denseDia = diaCandidates[diaCandidates.length - 1];
      const singleBarArea = (Math.PI * Math.pow(denseDia / 10, 2)) / 4;
      chosen = { dia: denseDia, spacing: 10, asProv: (100 / 10) * singleBarArea };
      crackGoverned = true;
    }

    const chosenDia = chosen.dia;
    const chosenSpacingCm = chosen.spacing;
    const chosenAsProv = chosen.asProv;

    // Donatı eğilme şartından mı yoksa çatlak sınırından mı belirlendi?
    // Eğilme şartı için aynı çapta yeterli olan en seyrek aralık bulunur.
    const singleBarAreaChosen = (Math.PI * Math.pow(chosenDia / 10, 2)) / 4;
    const flexuralOnlySpacing = SPACING_CANDIDATES.find(
      (s) => (100 / s) * singleBarAreaChosen >= asReq
    );
    if (!crackGoverned && flexuralOnlySpacing !== undefined) {
      crackGoverned = chosenSpacingCm < flexuralOnlySpacing;
    }

    // Seçilen çapa göre faydalı yükseklik ve gerekli donatı alanını güncelle
    d = thickM - cover - chosenDia / 2000;
    const effectiveDepthMm = d * 1000;
    k = md / (b * d * d * fcd);
    omega = k < 0.37 ? 1 - Math.sqrt(Math.max(1 - 2 * k, 0.01)) : 0.45;
    asReq = Math.max(omega * b * d * (fcd / fyd) * 10000, asMin);

    // Kesme Güvenliği Kontrolü: Vc = 0.65 * fctd * b * d  (TS 500, etriyesiz)
    const vc = 0.65 * fctd * b * d; // kN/m
    const shearStatus: 'OK' | 'ETRIYE_GEREKLI' = vd <= vc ? 'OK' : 'ETRIYE_GEREKLI';

    // Çatlak genişliği (SLS altında) — nihai seçim için yeniden hesaplanır
    const crackWidth = Number(
      calcCrackWidth(md / 1.4, d, chosenAsProv / 10000).toFixed(2)
    );
    const crackStatus: 'OK' | 'UYARI' = crackWidth <= CRACK_WIDTH_LIMIT ? 'OK' : 'UYARI';

    const status: 'OK' | 'UYARI' | 'ETRIYE_GEREKLI' =
      shearStatus === 'ETRIYE_GEREKLI' ? 'ETRIYE_GEREKLI' : crackStatus === 'OK' ? 'OK' : 'UYARI';

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
      crackGoverned,
      status,
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
  let crackLimitedSections = 0;

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
    if (s.crackGoverned) {
      crackLimitedSections += 1;
    }
  }

  return {
    sections,
    summary: {
      maxMomentKnm: maxM,
      maxShearKn: maxV,
      governingSection: govSec,
      allPassed,
      crackLimitedSections,
    },
  };
}
