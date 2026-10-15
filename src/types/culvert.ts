/**
 * Type definitions for TCDD & UIC 71 Box Culvert Design and SAP2000 Model Generator
 */

export type TrackType = 'single' | 'double';
export type ConcreteGrade = 'C25/30' | 'C30/37' | 'C35/45' | 'C40/50';
export type SteelGrade = 'B420C' | 'B500C';
export type TrackStandard = 'UIC71' | 'SW0' | 'SW2';

export interface CulvertGeometry {
  clearSpan: number; // Bi: İç açıklık (m)
  clearHeight: number; // Hi: İç yükseklik (m)
  totalLength: number; // L: Menfez toplam uzunluğu (m)
  topSlabThickness: number; // tt: Üst plak kalınlığı (m)
  bottomSlabThickness: number; // tb: Alt plak kalınlığı (m)
  sideWallThickness: number; // tw: Yan duvar kalınlığı (m)
  haunchWidth: number; // ch: Ampatman/Pah yatay genişliği (m)
  haunchHeight: number; // cv: Ampatman/Pah düşey yüksekliği (m)
}

export interface RailwayLoadingParams {
  trackType: TrackType; // Tek veya Çift Hat
  trackSpacing: number; // Çift hat eksen mesafesi (m)
  fillHeight: number; // Hf: Balast üstünden menfez üst plağına kadar toplam dolgu yüksekliği (m)
  ballastThickness: number; // hb: Balast tabakası kalınlığı (m, min 0.50m TCDD)
  trainSpeed: number; // V: Hat hızı (km/h)
  alphaFactor: number; // alpha: UIC sınıflandırma katsayısı (default 1.00)
  trackStandard: TrackStandard;
  dispersionSlope: number; // Dolguda yük yayılma eğimi (1 = 1:1 / 45°, 0.5 = 2:1 / 1:2)
  sleeperLength: number; // Travers boyu (m, standart 2.60m)
  longitudinalAxleSpacing: number; // Dingil aralığı (standart 1.60m)
}

export interface SoilAndMaterialParams {
  soilUnitWeight: number; // gamma_soil (kN/m³)
  ballastUnitWeight: number; // gamma_ballast (kN/m³)
  concreteUnitWeight: number; // gamma_c (kN/m³, default 25)
  frictionAngle: number; // phi: İçsel sürtünme açısı (derece)
  subgradeReactionModulus: number; // ks: Zemin yatak katsayısı (kN/m³)
  waterTableHeight: number; // Yeraltı su seviyesi (menfez tabanından, m)
  internalWaterDepth: number; // Menfez içi su yüksekliği (m)
  concreteGrade: ConcreteGrade;
  steelGrade: SteelGrade;
  concreteCover: number; // Paspayı c (mm, zemin temasında min 50mm)
}

export interface UnitCostParams {
  concretePrice: number; // TL/m³
  rebarPrice: number; // TL/ton
  formworkPrice: number; // TL/m²
  excavationPrice: number; // TL/m³
  backfillPrice: number; // TL/m³
  waterproofingPrice: number; // TL/m²
  currency: 'TRY' | 'USD' | 'EUR';
}

export interface CulvertProjectInput {
  projectName: string;
  stationOrKm: string;
  designer: string;
  geometry: CulvertGeometry;
  railway: RailwayLoadingParams;
  soil: SoilAndMaterialParams;
  unitCosts: UnitCostParams;
  meshSize: number; // SAP2000 sonlu eleman mesh boyutu (m, örn 0.50m)
}

export interface UIC71CalculatedLoads {
  // Dinamik katsayı
  phi2: number;
  phi3: number;
  phiDynamic: number;
  phiReduced: number; // Dolgu derinliği indirgemesi sonrası
  // Yük dağılımı
  effectiveWidth: number; // Enine yayılma genişliği B_eff (m)
  effectiveLength: number; // Boyuna yayılma uzunluğu L_eff (m)
  isOverlapping: boolean; // Çift hat veya dingiller arası girişim var mı
  // Üst plak üzerindeki düşey basınçlar (kN/m²)
  qVerticalLiveMax: number; // UIC 71 dingillerinden gelen dinamik düşey basınç
  qVerticalLiveSurcharge: number; // Katar yayılı yükünden gelen düşey basınç
  qVerticalSoil: number; // Dolgu ve balasttan gelen düşey toprak basıncı
  qVerticalDeadSlab: number; // Üst plak öz ağırlığı
  qVerticalTotalULS: number; // Tasarım toplam düşey yükü
  // Yan duvarlar üzerindeki yanal basınçlar (kN/m²)
  k0: number; // Sükunetteki zemin basınç katsayısı (1 - sin phi)
  sigmaSoilTop: number; // Menfez tavan kotunda yanal toprak basıncı
  sigmaSoilBottom: number; // Menfez taban kotunda yanal toprak basıncı
  sigmaLiveSurcharge: number; // Demiryolu sürşarjından gelen yanal basınç
  // Taban gerilmesi ve su basınçları
  sigmaHydroBottom: number;
  estimatedSoilBearingPressure: number; // Taban ortalama zemin emniyet gerilmesi kontrolü
}

export interface SAPJoint {
  id: number;
  x: number; // Enine koordinat (m)
  y: number; // Boyuna koordinat (m)
  z: number; // Düşey koordinat (m)
  isBottom: boolean;
  tributaryArea: number; // Yay hesabı için alan (m²)
}

export interface SAPShellElement {
  id: number;
  section: string;
  jointIds: [number, number, number, number];
  part: 'top' | 'bottom' | 'left' | 'right';
  centerZ: number;
  area: number;
}

export interface SAPJointSpring {
  jointId: number;
  kZ: number; // Düşey yay rijitliği (kN/m)
}

export interface SAPAreaLoad {
  shellId: number;
  loadPattern: string;
  direction: 'Gravity' | 'Local-3' | 'Global-Z' | 'Global-X' | 'X' | 'Z';
  value: number; // kN/m²
}

export interface SAPLoadCombination {
  name: string;
  type: 'Linear Add' | 'Envelope';
  factors: Record<string, number>;
  description: string;
}

export interface SAP2000ModelData {
  joints: SAPJoint[];
  shells: SAPShellElement[];
  springs: SAPJointSpring[];
  loads: SAPAreaLoad[];
  combinations: SAPLoadCombination[];
  loadPatterns: string[];
  totalNodes: number;
  totalShells: number;
  totalSprings: number;
  s2kScript: string;
}

export interface SectionRebarDesign {
  sectionName: string; // 'Üst Plak Açıklık' | 'Üst Plak Mesnet' vb.
  thickness: number; // mm
  effectiveDepth: number; // d (mm)
  designMoment: number; // Md (kNm/m)
  designShear: number; // Vd (kN/m)
  designAxial: number; // Nd (kN/m)
  requiredAs: number; // As,req (cm²/m)
  minAs: number; // As,min (cm²/m)
  providedBarDia: number; // mm (örn 16, 20)
  providedSpacing: number; // cm (örn 15, 20)
  providedAs: number; // cm²/m
  utilizationRatio: number; // As,req / As,prov
  shearCapacityVc: number; // Vc (kN/m)
  shearStatus: 'OK' | 'ETRIYE_GEREKLI';
  crackWidth: number; // wk (mm)
  crackStatus: 'OK' | 'UYARI';
}

export interface RebarScheduleItem {
  posNo: number;
  element: string;
  barDiameter: number; // mm
  shapeCode: string; // Şekil / Poz tanımı
  barCount: number; // Adet
  barLength: number; // Birim boy (m)
  totalLength: number; // Toplam boy (m)
  unitWeight: number; // kg/m
  totalWeightKg: number; // Toplam kg
}

export interface MaterialQuantityItem {
  posNo: string; // TCDD / KGM Poz No
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  notes?: string;
}

export interface QuantitySurveyReport {
  concreteVolumeTotal: number; // m³
  concreteGrade: string;
  formworkAreaTotal: number; // m²
  rebarWeightTotalKg: number; // kg
  rebarWeightTotalTon: number; // ton
  rebarRatioKgPerM3: number; // kg/m³
  excavationVolumeM3: number; // m³
  backfillVolumeM3: number; // m³
  leanConcreteVolumeM3: number; // m³ (Grobeton)
  waterproofingAreaM2: number; // m²
  drainageBoardAreaM2: number; // m²
  items: MaterialQuantityItem[];
  rebarSchedule: RebarScheduleItem[];
  diameterBreakdown: {
    diameter: number;
    weightKg: number;
    weightTon: number;
    percentage: number;
  }[];
  totalEstimatedCost: number;
  currency: string;
}
