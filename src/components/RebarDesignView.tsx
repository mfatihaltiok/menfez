/**
 * Structural Sizing, Reinforcement Design and Code Checks View
 * Compliant with TS 500, TCDD Railway Culvert Specifications and EN 1992-2
 */

import React from 'react';
import { SectionRebarDesign, CulvertGeometry, SoilAndMaterialParams } from '../types/culvert';
import { ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';

interface RebarDesignViewProps {
  sections: SectionRebarDesign[];
  summary: {
    maxMomentKnm: number;
    maxShearKn: number;
    governingSection: string;
    allPassed: boolean;
    crackLimitedSections: number;
  };
  geometry: CulvertGeometry;
  soil: SoilAndMaterialParams;
}

export const RebarDesignView: React.FC<RebarDesignViewProps> = ({
  sections,
  summary,
  geometry,
  soil,
}) => {
  // Donatı seçimlerini kesitlerden oku (metraj ve çizimlerle aynı kaynak)
  const find = (prefix: string) => sections.find((s) => s.sectionName.startsWith(prefix));
  const topSpan = find('Üst Plak Açıklık');
  const topSupport = find('Üst Plak Mesnet');
  const botSpan = find('Alt Plak Açıklık');
  const botSupport = find('Alt Plak Mesnet');
  const wallInner = find('Yan Duvar Açıklık');
  const wallOuter = find('Yan Duvar Mesnet');
  const bar = (s?: { providedBarDia: number; providedSpacing: number }) =>
    s ? `Φ${s.providedBarDia}/${s.providedSpacing}` : '—';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto p-5 space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            En Yüksek Eğilme Momenti (M<sub>d,max</sub>)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {summary.maxMomentKnm.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">kNm/m</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">
            {summary.governingSection}
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            En Yüksek Kesme Kuvveti (V<sub>d,max</sub>)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {summary.maxShearKn.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">kN/m</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Mesnet kesitinde kesme kontrolü</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Maksimum Çatlak Sınırı (w<sub>k,max</sub>)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">≤ 0.20</span>
            <span className="text-xs font-mono text-slate-400">mm</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">TCDD demiryolu şartnamesi sınır şartı</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Genel Güvenlik Tahkiki
            </span>
            <span className={`text-base font-bold flex items-center gap-1.5 ${summary.allPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
              {summary.allPassed ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>ŞARTNAME UYGUN</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>KONTROL GEREKLİ</span>
                </>
              )}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              TS 500 & EN 1992-2 (Köprüler)
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <ShieldCheck className={`w-5 h-5 ${summary.allPassed ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
        </div>
      </div>

      {/* Main Structural Design Table */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="font-bold text-sm text-white block">
              Betonarme Kesit Boyutlandırma ve Donatı Hesap Cetveli
            </span>
            <span className="text-xs text-slate-400">
              f<sub>ck</sub> = {soil.concreteGrade} ({soil.concreteGrade === 'C30/37' ? '30 MPa' : '25-35 MPa'}), f<sub>yk</sub> = {soil.steelGrade} (420 MPa), Paspayı: {soil.concreteCover} mm
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 rounded text-slate-300">
              Birim Şerit: b = 1.0 m
            </span>
            <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 rounded text-slate-300">
              Açıklık: {geometry.clearSpan.toFixed(2)} m · Duvar:{' '}
              {geometry.sideWallThickness.toFixed(2)} m
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Kesit Bölgesi</th>
                <th className="py-2.5 px-3 font-semibold">Kalınlık h / d (mm)</th>
                <th className="py-2.5 px-3 font-semibold">Tasarım M<sub>d</sub> (kNm/m)</th>
                <th className="py-2.5 px-3 font-semibold">Gerekli A<sub>s,req</sub> (cm²/m)</th>
                <th className="py-2.5 px-3 font-semibold">Seçilen Donatı</th>
                <th className="py-2.5 px-3 font-semibold">Mevcut A<sub>s,prov</sub> (cm²/m)</th>
                <th className="py-2.5 px-3 font-semibold">Kapasite Oranı</th>
                <th className="py-2.5 px-3 font-semibold">Kesme Tahkiki</th>
                <th className="py-2.5 px-3 font-semibold">Çatlak w<sub>k</sub> (mm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sections.map((sec, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-medium text-white font-sans">{sec.sectionName}</td>
                  <td className="py-2.5 px-3">
                    {sec.thickness} / <span className="text-slate-400">{sec.effectiveDepth}</span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">{sec.designMoment.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-blue-400 font-semibold">{sec.requiredAs.toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-white font-bold">
                      Φ{sec.providedBarDia} / {sec.providedSpacing} cm
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">{sec.providedAs.toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sec.utilizationRatio > 0.9
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(sec.utilizationRatio * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-300">{sec.utilizationRatio.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {sec.shearStatus === 'OK' ? (
                      <span className="text-emerald-400 font-semibold">OK (Vd &lt; Vc)</span>
                    ) : (
                      <span className="text-amber-400 font-semibold">Çiroz Gerekli</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={sec.crackStatus === 'OK' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {sec.crackWidth.toFixed(2)} mm
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Yöntem ve kapsam notu */}
        <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Yöntem:</strong> Kesit tesirleri tek geçişli yaklaşık
          çerçeve moment dağılımı ile hesaplanmıştır (iteratif moment dağılımı değildir); kesin
          sonuçlar için SAP2000 kabuk modeli esas alınmalıdır. Donatı seçimi eğilme şartını ve
          çatlak genişliği sınırını (w<sub>k</sub> ≤ 0.20 mm) birlikte sağlayan en ekonomik
          çözümü arar; aynı çap ve aralıklar <strong className="text-slate-300">Malzeme Metrajı</strong>{' '}
          sekmesindeki donatı listesinde kullanılır.
          {summary.crackLimitedSections > 0 && (
            <>
              {' '}
              <span className="text-amber-400">
                (Bu tasarımda {summary.crackLimitedSections} kesitte donatı miktarı çatlak sınırı
                tarafından belirlenmiştir.)
              </span>
            </>
          )}
        </div>
      </div>

      {/* Structural Reinforcement Detailing Diagram */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-sm text-white block">
              Betonarme Donatı Yerleşim ve Paspayı Şeması
            </span>
            <span className="text-xs text-slate-400">
              TCDD standart köşe gönyeleri, enine ana çekme donatıları ve boyuna dağıtma çubukları
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Ana Çekme Donatısı ({bar(topSpan)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Mesnet &amp; Köşe Donatısı ({bar(topSupport)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Boyuna Dağıtma Donatısı (Φ14/20)
            </span>
          </div>
        </div>

        {/* SVG Rebar Detailing Section */}
        <div className="w-full flex items-center justify-center p-2 bg-slate-900 rounded border border-slate-800/80">
          <svg viewBox="0 0 700 240" className="w-full max-h-56">
            {/* Box frame outline */}
            <rect x="60" y="20" width="580" height="200" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="4" />
            <rect x="110" y="60" width="480" height="120" fill="#0b1120" stroke="#475569" strokeWidth="2" rx="2" />

            {/* Corner chamfers (Pahlar - Yalnızca üst tabliye kenar birleşiminde) */}
            <polygon points="110,90 140,60 110,60" fill="#1e293b" />
            <polygon points="590,90 560,60 590,60" fill="#1e293b" />

            {/* Top slab rebar bars */}
            {/* Bottom layer (red) */}
            <line x1="80" y1="50" x2="620" y2="50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            {/* Top layer (blue) */}
            <line x1="80" y1="30" x2="620" y2="30" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

            {/* Bottom slab rebar bars */}
            <line x1="80" y1="190" x2="620" y2="190" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="80" y1="210" x2="620" y2="210" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

            {/* Left and right wall vertical bars */}
            <line x1="75" y1="30" x2="75" y2="210" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1="95" y1="50" x2="95" y2="190" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

            <line x1="625" y1="30" x2="625" y2="210" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1="605" y1="50" x2="605" y2="190" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

            {/* Dots representing longitudinal distribution bars */}
            {Array.from({ length: 15 }).map((_, i) => {
              const xPos = 130 + i * 31;
              return (
                <g key={i}>
                  <circle cx={xPos} cy="30" r="3" fill="#f59e0b" />
                  <circle cx={xPos} cy="50" r="3" fill="#f59e0b" />
                  <circle cx={xPos} cy="190" r="3" fill="#f59e0b" />
                  <circle cx={xPos} cy="210" r="3" fill="#f59e0b" />
                </g>
              );
            })}

            {/* Corner diagonal rebar in haunches (Yalnızca 2 üst köşede) */}
            <line x1="90" y1="100" x2="150" y2="40" stroke="#10b981" strokeWidth="2.5" />
            <line x1="610" y1="100" x2="550" y2="40" stroke="#10b981" strokeWidth="2.5" />

            {/* Annotation callouts */}
            <text x="350" y="44" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" className="font-mono">
              Üst Plak: {bar(topSpan)} (Alt) + {bar(topSupport)} (Üst) · Dağıtma: Φ14/20
            </text>
            <text x="350" y="204" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" className="font-mono">
              Alt Plak: {bar(botSpan)} (Üst Çekme) + {bar(botSupport)} (Alt) · Dağıtma: Φ14/20
            </text>
            <text x="40" y="125" textAnchor="middle" fill="#93c5fd" fontSize="10" transform="rotate(-90 40,125)" className="font-mono">
              Sol Duvar: Dış {bar(wallOuter)} · İç {bar(wallInner)}
            </text>
            <text x="660" y="125" textAnchor="middle" fill="#93c5fd" fontSize="10" transform="rotate(90 660,125)" className="font-mono">
              Sağ Duvar: Dış {bar(wallOuter)} · İç {bar(wallInner)}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
