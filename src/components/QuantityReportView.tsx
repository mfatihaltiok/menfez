/**
 * Material Quantity Survey (Malzeme Metrajı) & Cost Estimation View
 * Compliant with TCDD / KGM Specifications
 */

import React, { useState } from 'react';
import { QuantitySurveyReport, CulvertGeometry } from '../types/culvert';
import { FileSpreadsheet, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface QuantityReportViewProps {
  report: QuantitySurveyReport;
  geometry: CulvertGeometry;
  onExportCSV: () => void;
}

export const QuantityReportView: React.FC<QuantityReportViewProps> = ({
  report,
  geometry,
  onExportCSV,
}) => {
  const [activeTab, setActiveTab] = useState<'boq' | 'rebar' | 'breakdown'>('boq');
  const [copied, setCopied] = useState(false);

  const copyBOQToClipboard = async () => {
    const lines = ['Poz No\tİmalat Tanımı\tBirim\tMiktar\tBirim Fiyat\tToplam Tutar'];
    report.items.forEach((item) => {
      lines.push(`${item.posNo}\t${item.description}\t${item.unit}\t${item.quantity}\t${item.unitPrice}\t${item.totalCost}`);
    });
    const ok = await copyToClipboard(lines.join('\r\n'));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto p-5 space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Betonarme Betonu
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {report.concreteVolumeTotal.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">m³</span>
          </div>
          <span className="text-[11px] text-blue-400 font-mono mt-1 block">
            {report.concreteGrade}
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Toplam Donatı
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {report.rebarWeightTotalTon.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">Ton</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            {report.rebarWeightTotalKg.toLocaleString()} kg
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Donatı Yoğunluğu
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {report.rebarRatioKgPerM3.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">kg/m³</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">TCDD standart aralığı</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Kalıp Alanı
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {report.formworkAreaTotal.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">m²</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">İç + dış + aynalar</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Kazı / Dolgu
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {report.excavationVolumeM3.toFixed(0)}
            </span>
            <span className="text-xs font-mono text-slate-400">m³</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Geri dolgu: {report.backfillVolumeM3.toFixed(0)} m³
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Tahmini Maliyet
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-400">
              {(report.totalEstimatedCost / 1000).toFixed(0)}k
            </span>
            <span className="text-xs font-mono text-slate-400">{report.currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            {report.totalEstimatedCost.toLocaleString()} {report.currency}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      {/* Kesit özeti */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 px-4 py-3 text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-x-6 gap-y-1 shrink-0">
        <span>
          İç açıklık:{' '}
          <strong className="text-white">
            {geometry.clearSpan.toFixed(2)} × {geometry.clearHeight.toFixed(2)} m
          </strong>
        </span>
        <span>
          Menfez boyu: <strong className="text-white">{geometry.totalLength.toFixed(2)} m</strong>
        </span>
        <span>
          Plak/davar:{' '}
          <strong className="text-white">
            {geometry.topSlabThickness.toFixed(2)} / {geometry.bottomSlabThickness.toFixed(2)} /{' '}
            {geometry.sideWallThickness.toFixed(2)} m
          </strong>
        </span>
        <span>
          Dış ebat:{' '}
          <strong className="text-white">
            {(geometry.clearSpan + 2 * geometry.sideWallThickness).toFixed(2)} ×{' '}
            {(
              geometry.clearHeight +
              geometry.topSlabThickness +
              geometry.bottomSlabThickness
            ).toFixed(2)}{' '}
            m
          </strong>
        </span>
      </div>

      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex-1 flex flex-col">
        {/* Table Sub-Nav */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('boq')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === 'boq'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Poz Bazlı TCDD İmalat Metrajı
            </button>
            <button
              onClick={() => setActiveTab('rebar')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === 'rebar'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Poz Bazlı Donatı Listesi (BBS)
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === 'breakdown'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Çap Dağılım Çizelgesi
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyBOQToClipboard}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Panoya Kopyala</span>
                </>
              )}
            </button>

            <button
              onClick={onExportCSV}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel / CSV İndir</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Poz Bazlı Metraj Cetveli */}
        {activeTab === 'boq' && (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Poz No</th>
                  <th className="py-2.5 px-3">İmalat Kalemi Tanımı</th>
                  <th className="py-2.5 px-3">Birim</th>
                  <th className="py-2.5 px-3 text-right">Miktar</th>
                  <th className="py-2.5 px-3 text-right">Birim Fiyat ({report.currency})</th>
                  <th className="py-2.5 px-3 text-right">Toplam Tutar ({report.currency})</th>
                  <th className="py-2.5 px-3">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {report.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-bold text-blue-400">{item.posNo}</td>
                    <td className="py-2 px-3 text-white font-sans font-medium">{item.description}</td>
                    <td className="py-2 px-3 text-slate-400">{item.unit}</td>
                    <td className="py-2 px-3 text-right font-bold text-white">{item.quantity.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-amber-400">
                      {item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-sans">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider">
                    Toplam Yaklaşık İmalat Maliyeti:
                  </td>
                  <td className="py-3 px-3 text-right text-base text-amber-400">
                    {report.totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} {report.currency}
                  </td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 2: Çap Bazlı Donatı Metrajı (BBS) */}
        {activeTab === 'rebar' && (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Poz</th>
                  <th className="py-2.5 px-3">Eleman / Görev</th>
                  <th className="py-2.5 px-3">Çap (Φ, mm)</th>
                  <th className="py-2.5 px-3">Şekil Tanımı</th>
                  <th className="py-2.5 px-3 text-right">Adet</th>
                  <th className="py-2.5 px-3 text-right">Birim Boy (m)</th>
                  <th className="py-2.5 px-3 text-right">Toplam Boy (m)</th>
                  <th className="py-2.5 px-3 text-right">Birim Ağırlık (kg/m)</th>
                  <th className="py-2.5 px-3 text-right">Toplam Ağırlık (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {report.rebarSchedule.map((rb) => (
                  <tr key={rb.posNo} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-bold text-blue-400">{rb.posNo}</td>
                    <td className="py-2 px-3 text-white font-sans">{rb.element}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-bold border border-slate-800">
                        Φ{rb.barDiameter}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans">{rb.shapeCode}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{rb.barCount}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{rb.barLength.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{rb.totalLength.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{rb.unitWeight.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">
                      {rb.totalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={8} className="py-3 px-3 text-right uppercase tracking-wider">
                    Toplam Donatı Tonajı:
                  </td>
                  <td className="py-3 px-3 text-right text-base text-emerald-400">
                    {report.rebarWeightTotalTon.toFixed(2)} Ton ({report.rebarWeightTotalKg.toLocaleString()} kg)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 3: Çap Dağılım Çizelgesi */}
        {activeTab === 'breakdown' && (
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <span className="font-bold text-sm text-white block">
                  Donatı Çaplarına Göre Ağırlık ve Oransal Dağılım
                </span>
                <div className="space-y-2">
                  {report.diameterBreakdown.map((item) => (
                    <div key={item.diameter} className="bg-slate-900 p-3 rounded border border-slate-800 font-mono text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-sm">Φ{item.diameter} Nervürlü Donatı</span>
                        <span className="text-amber-400 font-bold">{item.weightTon.toFixed(2)} Ton ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>Ağırlık: {item.weightKg.toLocaleString()} kg</span>
                        <span>Toplamdaki Payı: %{item.percentage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs space-y-3">
                <span className="font-bold text-sm text-white block">
                  TCDD Şartnamesi Metraj & Donatı Kriterleri
                </span>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>Menfezlerde kullanılan donatı sınıfı B420C veya B500C kaynaklanabilir nervürlü çeliktir.</li>
                  <li>Demiryolu dinamik yükleri altındaki kutu menfezlerde donatı yoğunluğunun <strong className="text-white">110 - 150 kg/m³</strong> arasında kalması önerilir. Bu tasarımda gerçekleşen: <strong className="text-emerald-400">{report.rebarRatioKgPerM3} kg/m³</strong>.</li>
                  <li>Kalıp metrajında menfez iç tavanı, iç yan duvarlar, köşe ampatman yüzeyleri ve portal alın aynaları tam olarak dahil edilmiştir.</li>
                  <li>Temel çukuru kazısında iki yanda 60 cm çalışma payı ve zemin şartnamesine uygun şev payı hesaplanmıştır.</li>
                  <li>Temel tabanına dökülen 10 cm C16/20 grobeton hacmi poz listesinde ayrı kalem olarak verilmiştir.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
