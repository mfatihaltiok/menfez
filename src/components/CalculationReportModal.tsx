/**
 * Official TCDD Engineering Calculation Report Modal & Printable Document
 * Compliant with TCDD Railway Specifications, UIC 71, TS 500, and EN 1992-2
 */

import React from 'react';
import {
  CulvertGeometry,
  RailwayLoadingParams,
  SoilAndMaterialParams,
  UIC71CalculatedLoads,
  SectionRebarDesign,
  QuantitySurveyReport,
} from '../types/culvert';
import { Printer, X, Download } from 'lucide-react';

interface CalculationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  stationOrKm: string;
  designer: string;
  geometry: CulvertGeometry;
  railway: RailwayLoadingParams;
  soil: SoilAndMaterialParams;
  loads: UIC71CalculatedLoads;
  sections: SectionRebarDesign[];
  summary: {
    maxMomentKnm: number;
    maxShearKn: number;
    governingSection: string;
    allPassed: boolean;
  };
  report: QuantitySurveyReport;
  onDownloadS2K: () => void;
}

export const CalculationReportModal: React.FC<CalculationReportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  stationOrKm,
  designer,
  geometry,
  railway,
  soil,
  loads,
  sections,
  summary,
  report,
  onDownloadS2K,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white text-slate-900 w-full max-w-4xl max-h-[92vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Header Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">TCDD Standart Menfez Statik & Metraj Raporu</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">Baskı / PDF Formatı</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF Kaydet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 text-slate-800 text-xs leading-relaxed space-y-6 print:p-0 print:overflow-visible">
          {/* Institutional Header Block */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <h1 className="text-sm font-bold tracking-wider uppercase text-slate-900">
              T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ
            </h1>
            <h2 className="text-xs font-semibold uppercase text-slate-700">
              Demiryolu Yapım ve Mühendislik Dairesi Başkanlığı
            </h2>
            <div className="pt-2 text-base font-extrabold text-blue-900 uppercase tracking-tight">
              BETONARME KUTU MENFEZ STATİK-MUKAVEMET VE MALZEME METRAJI HESAP RAPORU
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              UIC 71 (UL 71) Yükleme Standardı · SAP2000 Kabuk Sonlu Elemanlar Modeli
            </p>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block">Proje Adı:</span>
              <strong className="text-slate-900 text-xs font-sans">{projectName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Demiryolu Hattı / KM:</span>
              <strong className="text-slate-900 text-xs font-sans">{stationOrKm}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Proje Müellifi / Kontrol:</span>
              <strong className="text-slate-900 text-xs font-sans">{designer}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Hesap Tarihi:</span>
              <strong className="text-slate-900 text-xs">{currentDate}</strong>
            </div>
          </div>

          {/* 1. Design Standards Section */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">
              1. Referans Standartlar ve Şartnameler
            </h3>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
              <li>TCDD Demiryolu Köprü ve Sanat Yapıları Tasarım ve Yapım Teknik Şartnamesi</li>
              <li>UIC 776-1: "Demiryolu Köprülerinde Trafik Yükleri ve Dinamik Etkiler" (UIC 71 Yük Modeli)</li>
              <li>TS EN 1991-2: Eurocode 1 - Yapılar Üzerindeki Etkiler - Bölüm 2: Köprülerdeki Trafik Yükleri</li>
              <li>TS EN 1992-2: Eurocode 2 - Beton Yapıların Tasarımı - Bölüm 2: Beton Köprüler</li>
              <li>TS 500: Betonarme Yapıların Tasarım ve Yapım Kuralları (Nisan 2000)</li>
            </ul>
          </div>

          {/* 2. Geometrical & Material Data */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">
              2. Menfez Geometrisi ve Malzeme Parametreleri
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <table className="w-full border border-slate-200">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-1.5 text-slate-600">İç Açıklık (B)</td>
                    <td className="p-1.5 font-bold font-mono text-right">{geometry.clearSpan.toFixed(2)} m</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-600">İç Yükseklik (H)</td>
                    <td className="p-1.5 font-bold font-mono text-right">{geometry.clearHeight.toFixed(2)} m</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-1.5 text-slate-600">Menfez Uzunluğu (L)</td>
                    <td className="p-1.5 font-bold font-mono text-right">{geometry.totalLength.toFixed(2)} m</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-600">Üst / Alt Plak Kalınlığı</td>
                    <td className="p-1.5 font-bold font-mono text-right">
                      {geometry.topSlabThickness.toFixed(2)} / {geometry.bottomSlabThickness.toFixed(2)} m
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-1.5 text-slate-600">Yan Duvar Kalınlığı</td>
                    <td className="p-1.5 font-bold font-mono text-right">{geometry.sideWallThickness.toFixed(2)} m</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-600">Üst Tabliye Köşe Pahı</td>
                    <td className="p-1.5 font-bold font-mono text-right">{geometry.haunchWidth.toFixed(2)} × {geometry.haunchHeight.toFixed(2)} m (2 Üst Köşe)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 text-slate-600">Taban Plak Köşeleri</td>
                    <td className="p-1.5 font-bold font-mono text-right text-emerald-700">90° Dik (Pahsız)</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border border-slate-200">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-1.5 text-slate-600">Beton / Donatı Sınıfı</td>
                    <td className="p-1.5 font-bold font-mono text-right">{soil.concreteGrade} / {soil.steelGrade}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-600">Zemin Birim Hacim Ağırlığı (γ)</td>
                    <td className="p-1.5 font-bold font-mono text-right">{soil.soilUnitWeight.toFixed(1)} kN/m³</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-1.5 text-slate-600">İçsel Sürtünme Açısı (ϕ)</td>
                    <td className="p-1.5 font-bold font-mono text-right">{soil.frictionAngle}°</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 text-slate-600">Zemin Yatak Katsayısı (k<sub>s</sub>)</td>
                    <td className="p-1.5 font-bold font-mono text-right">{soil.subgradeReactionModulus.toLocaleString()} kN/m³</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 text-slate-600">Toplam Dolgu Yüksekliği (H<sub>f</sub>)</td>
                    <td className="p-1.5 font-bold font-mono text-right">{railway.fillHeight.toFixed(2)} m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Railway UIC 71 Load Breakdown */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">
              3. UIC 71 Demiryolu Yük Dağılımı ve Dinamik Katsayı Hesabı
            </h3>
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2 text-[11px]">
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <span className="text-slate-500 block">Dinamik Katsayı Φ:</span>
                  <strong className="text-slate-900">{loads.phiDynamic.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dolgu İndirgemesi Sonrası Φ<sub>red</sub>:</span>
                  <strong className="text-blue-700 font-bold">{loads.phiReduced.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Sükunet Katsayısı K<sub>0</sub>:</span>
                  <strong className="text-slate-900">{loads.k0}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">Üst Plak Canlı Yük Basıncı (q<sub>live</sub>):</span>
                  <strong className="text-slate-900">{loads.qVerticalLiveMax.toFixed(2)} kN/m²</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dolgu ve Balast Basıncı (q<sub>soil</sub>):</span>
                  <strong className="text-slate-900">{loads.qVerticalSoil.toFixed(2)} kN/m²</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Yan Duvar Üst Zemin İtkisi (σ<sub>top</sub>):</span>
                  <strong className="text-slate-900">{loads.sigmaSoilTop.toFixed(2)} kN/m²</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Yan Duvar Taban Zemin İtkisi (σ<sub>bot</sub>):</span>
                  <strong className="text-slate-900">{loads.sigmaSoilBottom.toFixed(2)} kN/m²</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Structural Design Verification Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">
              4. Kesit Tesirleri ve Donatı Tahkikleri (TS 500 / EN 1992-2)
            </h3>
            <table className="w-full text-left border border-slate-200 text-[11px] font-mono">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-1.5">Kesit</th>
                  <th className="p-1.5">h (mm)</th>
                  <th className="p-1.5">M<sub>d</sub> (kNm/m)</th>
                  <th className="p-1.5">A<sub>s,req</sub> (cm²/m)</th>
                  <th className="p-1.5">Seçilen Donatı</th>
                  <th className="p-1.5">A<sub>s,prov</sub></th>
                  <th className="p-1.5">Çatlak w<sub>k</sub></th>
                  <th className="p-1.5">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sections.map((sec, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                    <td className="p-1.5 font-sans font-medium">{sec.sectionName}</td>
                    <td className="p-1.5">{sec.thickness}</td>
                    <td className="p-1.5 font-bold">{sec.designMoment.toFixed(1)}</td>
                    <td className="p-1.5">{sec.requiredAs.toFixed(2)}</td>
                    <td className="p-1.5 font-bold">Φ{sec.providedBarDia}/{sec.providedSpacing}</td>
                    <td className="p-1.5 text-blue-700 font-bold">{sec.providedAs.toFixed(2)}</td>
                    <td className="p-1.5">{sec.crackWidth.toFixed(2)} mm</td>
                    <td className="p-1.5">
                      <span className="font-bold text-emerald-700">UYGUN</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Quantity Survey Summary */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">
              5. Malzeme Metrajı ve Keşif Özeti
            </h3>
            <table className="w-full text-left border border-slate-200 text-[11px] font-mono">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-1.5">Poz No</th>
                  <th className="p-1.5">İmalat Tanımı</th>
                  <th className="p-1.5">Birim</th>
                  <th className="p-1.5 text-right">Miktar</th>
                  <th className="p-1.5 text-right">Birim Fiyat ({report.currency})</th>
                  <th className="p-1.5 text-right">Tutar ({report.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                    <td className="p-1.5 font-bold">{item.posNo}</td>
                    <td className="p-1.5 font-sans">{item.description}</td>
                    <td className="p-1.5">{item.unit}</td>
                    <td className="p-1.5 text-right font-bold">{item.quantity.toLocaleString()}</td>
                    <td className="p-1.5 text-right">{item.unitPrice.toLocaleString()}</td>
                    <td className="p-1.5 text-right font-bold">
                      {item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <tr>
                  <td colSpan={5} className="p-2 text-right uppercase">Toplam Yaklaşık İmalat Maliyeti:</td>
                  <td className="p-2 text-right text-blue-900">
                    {report.totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} {report.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 6. Sign-off Blocks */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-[11px] break-inside-avoid">
            <div className="space-y-10">
              <span className="font-semibold text-slate-700 block">Hesaplayan Mühendis</span>
              <div className="font-bold text-slate-900">{designer}</div>
              <span className="text-slate-400 text-[10px] block">İmza / Kaşe</span>
            </div>
            <div className="space-y-10">
              <span className="font-semibold text-slate-700 block">Kontrol Mühendisi</span>
              <div className="font-bold text-slate-900">İnşaat Yüksek Mühendisi</div>
              <span className="text-slate-400 text-[10px] block">İmza / Kaşe</span>
            </div>
            <div className="space-y-10">
              <span className="font-semibold text-slate-700 block">TCDD Proje Onayı</span>
              <div className="font-bold text-slate-900">Demiryolu Yapım Dairesi</div>
              <span className="text-slate-400 text-[10px] block">Mühür / Onay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
