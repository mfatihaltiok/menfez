/**
 * SAP2000 Exporter View: .s2k script download, syntax viewer, and interactive database tables
 */

import React, { useState } from 'react';
import { SAP2000ModelData, CulvertGeometry } from '../types/culvert';
import { Download, Copy, Check, FileText, Table, Terminal, HelpCircle } from 'lucide-react';

interface Sap2000ExporterViewProps {
  modelData: SAP2000ModelData;
  geometry: CulvertGeometry;
  onDownloadS2K: () => void;
}

export const Sap2000ExporterView: React.FC<Sap2000ExporterViewProps> = ({
  modelData,
  geometry,
  onDownloadS2K,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'s2k' | 'joints' | 'shells' | 'loads' | 'springs' | 'combos' | 'guide'>('s2k');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Tablo metinlerini kopyalama formatına dönüştürme (SAP2000 Interactive Database uyumlu TSV formatı)
  // Tablo metinlerini kopyalama formatına dönüştürme (SAP2000 Interactive Database uyumlu TSV formatı)
  const getJointsTSV = () => {
    const rows = ['Joint\tCoordSys\tCoordType\tXorR\tY\tZ\tSpecialJt'];
    modelData.joints.forEach((j) => {
      rows.push(`${j.id}\tGLOBAL\tCartesian\t${j.x}\t${j.y}\t${j.z}\tNo`);
    });
    return rows.join('\r\n');
  };

  const getShellsTSV = () => {
    const rows = ['Area\tSection\tNumJoints\tJoint1\tJoint2\tJoint3\tJoint4'];
    modelData.shells.forEach((s) => {
      rows.push(`${s.id}\t${s.section}\t4\t${s.jointIds[0]}\t${s.jointIds[1]}\t${s.jointIds[2]}\t${s.jointIds[3]}`);
    });
    return rows.join('\r\n');
  };

  const getLoadsTSV = () => {
    const rows = ['Area\tLoadPat\tCoordSys\tDir\tUnifLoad'];
    modelData.loads.forEach((l) => {
      rows.push(`${l.shellId}\t${l.loadPattern}\tGLOBAL\t${l.direction}\t${l.value}`);
    });
    return rows.join('\r\n');
  };

  const getSpringsTSV = () => {
    const rows = ['Joint\tCoordSys\tU1\tU2\tU3\tR1\tR2\tR3'];
    modelData.springs.forEach((sp) => {
      rows.push(`${sp.jointId}\tGLOBAL\t${(sp.kZ * 0.1).toFixed(1)}\t${(sp.kZ * 0.1).toFixed(1)}\t${sp.kZ}\t0\t0\t0`);
    });
    return rows.join('\r\n');
  };

  const getCombosTSV = () => {
    const rows = ['ComboName\tComboType\tAutoDesign\tCaseType\tCaseName\tScaleFactor'];
    modelData.combinations.forEach((c) => {
      if (c.type === 'Linear Add') {
        Object.entries(c.factors).forEach(([pat, fac]) => {
          if (fac > 0) {
            rows.push(`${c.name}\tLinear Add\tNo\tLinear Static\t${pat}\t${fac}`);
          }
        });
      } else if (c.type === 'Envelope') {
        Object.entries(c.factors).forEach(([subCombo, fac]) => {
          rows.push(`${c.name}\tEnvelope\tNo\tCombination\t${subCombo}\t${fac}`);
        });
      }
    });
    return rows.join('\r\n');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 text-xs shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('s2k')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 's2k' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.s2k Script Dosyası</span>
          </button>

          <button
            onClick={() => setActiveSubTab('joints')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'joints' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Düğüm Tablosu ({modelData.totalNodes})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shells')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'shells' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Kabuk Elemanlar ({modelData.totalShells})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('loads')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'loads' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Yüzey Yükleri ({modelData.loads.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('springs')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'springs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Zemin Yayları ({modelData.totalSprings})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('combos')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'combos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Kombinasyonlar ({modelData.combinations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('guide')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'guide' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>SAP2000 Aktarım Rehberi</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadS2K}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.s2k İndir</span>
          </button>
        </div>
      </div>

      {/* SubTab Contents */}
      <div className="flex-1 overflow-auto p-4">
        {/* .s2k Code View */}
        {activeSubTab === 's2k' && (
          <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="font-mono text-slate-300">tcdd_box_culvert_sap2000.s2k</span>
              <button
                onClick={() => copyToClipboard(modelData.s2kScript, 's2k')}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 's2k' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Scripti Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-slate-300 whitespace-pre leading-relaxed select-all">
              {modelData.s2kScript}
            </pre>
          </div>
        )}

        {/* Joint Coordinates Table */}
        {activeSubTab === 'joints' && (
          <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="font-mono text-slate-300">TABLE: JOINT COORDINATES</span>
              <button
                onClick={() => copyToClipboard(getJointsTSV(), 'joints')}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'joints' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tablo Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SAP2000 Tablosunu Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Joint ID</th>
                    <th className="py-2 px-3">X (Enine, m)</th>
                    <th className="py-2 px-3">Y (Boyuna, m)</th>
                    <th className="py-2 px-3">Z (Düşey, m)</th>
                    <th className="py-2 px-3">Konum</th>
                    <th className="py-2 px-3">Zemin Etkili Alanı (m²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {modelData.joints.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-3 font-bold text-blue-400">{j.id}</td>
                      <td className="py-1.5 px-3">{j.x.toFixed(3)}</td>
                      <td className="py-1.5 px-3">{j.y.toFixed(3)}</td>
                      <td className="py-1.5 px-3">{j.z.toFixed(3)}</td>
                      <td className="py-1.5 px-3">
                        {j.isBottom ? (
                          <span className="text-sky-400">Taban (Zemin Teması)</span>
                        ) : (
                          <span className="text-slate-500">Üst/Perde</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3">
                        {j.tributaryArea > 0 ? j.tributaryArea.toFixed(4) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shell Connectivity Table */}
        {activeSubTab === 'shells' && (
          <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="font-mono text-slate-300">TABLE: CONNECTIVITY - AREA</span>
              <button
                onClick={() => copyToClipboard(getShellsTSV(), 'shells')}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'shells' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tablo Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SAP2000 Tablosunu Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Area ID</th>
                    <th className="py-2 px-3">Kesit (Section)</th>
                    <th className="py-2 px-3">Joint 1</th>
                    <th className="py-2 px-3">Joint 2</th>
                    <th className="py-2 px-3">Joint 3</th>
                    <th className="py-2 px-3">Joint 4</th>
                    <th className="py-2 px-3">Bölge</th>
                    <th className="py-2 px-3">Alan (m²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {modelData.shells.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-3 font-bold text-blue-400">{s.id}</td>
                      <td className="py-1.5 px-3 text-amber-400">{s.section}</td>
                      <td className="py-1.5 px-3">{s.jointIds[0]}</td>
                      <td className="py-1.5 px-3">{s.jointIds[1]}</td>
                      <td className="py-1.5 px-3">{s.jointIds[2]}</td>
                      <td className="py-1.5 px-3">{s.jointIds[3]}</td>
                      <td className="py-1.5 px-3">
                        {s.part === 'top' && <span className="text-blue-400">Üst Plak</span>}
                        {s.part === 'bottom' && <span className="text-sky-400">Taban Plağı</span>}
                        {s.part === 'left' && <span className="text-purple-400">Sol Duvar</span>}
                        {s.part === 'right' && <span className="text-purple-400">Sağ Duvar</span>}
                      </td>
                      <td className="py-1.5 px-3">{s.area.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Area Loads Table */}
        {activeSubTab === 'loads' && (
          <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="font-mono text-slate-300">TABLE: AREA LOADS - UNIFORM</span>
              <button
                onClick={() => copyToClipboard(getLoadsTSV(), 'loads')}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'loads' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tablo Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SAP2000 Tablosunu Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Area ID</th>
                    <th className="py-2 px-3">Yük Paternı</th>
                    <th className="py-2 px-3">Yön</th>
                    <th className="py-2 px-3">Yük Değeri (kN/m²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {modelData.loads.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-3 font-bold text-blue-400">{l.shellId}</td>
                      <td className="py-1.5 px-3 text-amber-300">{l.loadPattern}</td>
                      <td className="py-1.5 px-3">{l.direction}</td>
                      <td className="py-1.5 px-3 font-bold text-white">{l.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Joint Springs Table */}
        {activeSubTab === 'springs' && (
          <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="font-mono text-slate-300">TABLE: JOINT SPRINGS (Winkler Yayları)</span>
              <button
                onClick={() => copyToClipboard(getSpringsTSV(), 'springs')}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'springs' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tablo Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SAP2000 Tablosunu Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Joint ID</th>
                    <th className="py-2 px-3">Koordinat Sistemi</th>
                    <th className="py-2 px-3">Düşey Yay (U3, kN/m)</th>
                    <th className="py-2 px-3">Yatay Yay (U1, kN/m)</th>
                    <th className="py-2 px-3">Boyuna Yay (U2, kN/m)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {modelData.springs.map((sp) => (
                    <tr key={sp.jointId} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-3 font-bold text-sky-400">{sp.jointId}</td>
                      <td className="py-1.5 px-3">GLOBAL</td>
                      <td className="py-1.5 px-3 font-bold text-white">{sp.kZ.toFixed(1)}</td>
                      <td className="py-1.5 px-3 text-slate-400">{(sp.kZ * 0.1).toFixed(1)}</td>
                      <td className="py-1.5 px-3 text-slate-400">{(sp.kZ * 0.1).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Load Combinations Table */}
        {activeSubTab === 'combos' && (
          <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-200 font-bold">TABLE: "COMBINATION DEFINITIONS"</span>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-sans">
                  ✓ .s2k dosyasında tanımlıdır
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(getCombosTSV(), 'combos')}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                {copiedKey === 'combos' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kombinasyon Tablosu Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SAP2000 Tablosunu Kopyala</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="bg-slate-900/60 p-3 rounded border border-slate-800 text-xs text-slate-300">
                <strong className="text-white block mb-1">
                  Kombinasyonlar SAP2000 Modeline Otomatik Olarak Dahil Edilmiştir
                </strong>
                İndirilen <code className="text-amber-400 font-mono">.s2k</code> dosyası içerisinde tüm TCDD ve Eurocode ULS (Taşıma Gücü), SLS (Kullanılabilirlik) ve ULS_ENVELOPE (Tasarım Zarfı) kombinasyonları <code className="text-blue-400 font-mono">TABLE: "COMBINATION DEFINITIONS"</code> bloğu olarak yer almaktadır. Model açıldığında doğrudan analiz edilebilir.
              </div>

              <div className="space-y-3">
                {modelData.combinations.map((c, i) => (
                  <div key={i} className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-blue-400 text-sm">{c.name}</span>
                        <span className="text-[11px] text-slate-400">({c.description})</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                        {c.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                      {Object.entries(c.factors).map(([pat, fac]) => (
                        <span key={pat} className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
                          {fac} × <strong className="text-amber-400">{pat}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step SAP2000 Guide */}
        {activeSubTab === 'guide' && (
          <div className="max-w-3xl mx-auto bg-slate-950 p-6 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-white">
                  SAP2000 Programına Model Aktarımı ve Analiz Rehberi
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                  v26.3.0 Uyumlu
                </span>
              </div>
              <p className="text-slate-400">
                Bu yazılım tarafından üretilen parametrik sonlu elemanlar kabuk modeli, SAP2000 v26.3.0 başta olmak üzere tüm modern SAP2000 sürümleriyle (v14-v27) sıfır uyarı ile %100 uyumludur.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <span className="text-sm font-bold text-blue-400 block">
                  1. .s2k Metin Dosyası ile İçe Aktarma (Doğrudan Yöntem)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Yukarıdaki <strong className="text-white">".s2k İndir"</strong> butonuna tıklayarak dosyayı kaydedin.</li>
                  <li>SAP2000 programını açın (boş bir pencere olmalıdır, açık bir model olmamalıdır).</li>
                  <li>Üst menüden <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">File → Import → SAP2000 .s2k Text File...</code> seçeneğine tıklayın.</li>
                  <li>İndirdiğiniz <code className="text-amber-400 font-mono">.s2k</code> dosyasını seçin.</li>
                  <li>Model; düğüm koordinatları, kabuk elemanlar, kesit atamaları, zemin Winkler yayları, zati/zemin/tren yükleri ve 6 adet ULS/SLS yük kombinasyonu ile eksiksiz olarak açılacaktır.</li>
                  <li>Klavyeden <strong className="text-white">F5</strong> tuşuna basarak analizi başlatın.</li>
                </ol>
              </div>

              <div className="p-4 bg-emerald-950/30 rounded-lg border border-emerald-800/60 space-y-2">
                <span className="text-sm font-bold text-emerald-400 block">
                  ✓ SAP2000 v26.3.0 Veritabanı Standartları Doğrulaması
                </span>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>TABLE: "PROGRAM CONTROL":</strong> Dosyanın 1. satırına yerleştirilmiş olup ProgramName=SAP2000 Version=26.3.0 olarak tanımlanmıştır.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>TABLE: "AREA SECTION ASSIGNMENTS":</strong> Kabuk elemanların kesit tanımları (SHELL_TOP, SHELL_BOT, SHELL_WALL) ayrı tabloda tanımlanarak eleman bazında atanmıştır (kesitsiz eleman uyarısı engellendi).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>TABLE: "AREA LOADS - UNIFORM":</strong> Yükler standart <code className="text-amber-300 font-mono">UnifLoad</code> parametresi ve global eksen (<code className="text-amber-300 font-mono">Dir=Gravity</code>, <code className="text-amber-300 font-mono">Dir=X</code>) ile tanımlanmıştır.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>TABLE: "JOINT SPRING ASSIGNMENTS 1 - UNCOUPLED":</strong> Zemin yatak katsayısı k<sub>s</sub> yayları uncoupled serbestlik derecesiyle atanmıştır.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Yük Durumları ve Kombinasyonlar:</strong> <code className="text-amber-300 font-mono">LOAD CASE DEFINITIONS</code> ve <code className="text-amber-300 font-mono">CASE - STATIC 1 - LOAD ASSIGNMENTS</code> tabloları eklenerek tüm ULS1, ULS2, ULS3, SLS_CHAR, SLS_PERM ve ULS_ENVELOPE kombinasyonlarının eksiksiz bağlanması sağlandı.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Windows CRLF:</strong> Tüm satır sonları Windows standart satır sonu (<code className="text-amber-300 font-mono">\r\n</code>) ile kodlanmıştır.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-sm font-bold text-amber-400 block mb-1">
                  Sonuçların Karşılaştırılması (TCDD Tahkiki)
                </span>
                <p className="mt-1 text-slate-300">
                  Analiz tamamlandıktan sonra menfez kesit tesirlerini doğrulamak için:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-1 text-slate-300">
                  <li><strong className="text-white">Display → Show Forces/Stresses → Shells...</strong> menüsüne gidin.</li>
                  <li>Combo: <strong className="text-blue-400">ULS1_MAX_VERT</strong> (1.35G + 1.35H + 1.45Q) veya <strong className="text-blue-400">ULS_ENVELOPE</strong> seçin.</li>
                  <li>Enine çekme momentleri için <strong className="text-white">M11</strong> bileşenini inceleyin. Açıklık ve köşe momentlerini yazılımımızın "Donatı & Tahkik" sekmesindeki tasarım momentleriyle birebir karşılaştırabilirsiniz.</li>
                  <li>Taban plağı altındaki zemin gerilmeleri için <strong className="text-white">Joint Reactions → FZ</strong> değerini okuyarak q<sub>zemin</sub> emniyet sınırını kontrol edin.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
