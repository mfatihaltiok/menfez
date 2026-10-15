/**
 * Technical Input Sidebar Panel with parameter categorization tabs
 */

import React, { useState } from 'react';
import {
  CulvertGeometry,
  RailwayLoadingParams,
  SoilAndMaterialParams,
  UnitCostParams,
  ConcreteGrade,
  SteelGrade,
} from '../types/culvert';
import { Box, Train, Mountain, Grid, DollarSign } from 'lucide-react';

interface InputPanelProps {
  projectName: string;
  stationOrKm: string;
  designer: string;
  geometry: CulvertGeometry;
  railway: RailwayLoadingParams;
  soil: SoilAndMaterialParams;
  unitCosts: UnitCostParams;
  meshSize: number;
  onUpdateProject: (data: { projectName?: string; stationOrKm?: string; designer?: string }) => void;
  onUpdateGeometry: (geo: Partial<CulvertGeometry>) => void;
  onUpdateRailway: (rail: Partial<RailwayLoadingParams>) => void;
  onUpdateSoil: (soil: Partial<SoilAndMaterialParams>) => void;
  onUpdateCosts: (costs: Partial<UnitCostParams>) => void;
  onUpdateMeshSize: (size: number) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  projectName,
  stationOrKm,
  designer,
  geometry,
  railway,
  soil,
  unitCosts,
  meshSize,
  onUpdateProject,
  onUpdateGeometry,
  onUpdateRailway,
  onUpdateSoil,
  onUpdateCosts,
  onUpdateMeshSize,
}) => {
  const [activeTab, setActiveTab] = useState<'geo' | 'rail' | 'soil' | 'mesh' | 'cost'>('geo');

  /**
   * Sayı girişi yardımcısı.
   * "parseFloat(x) || varsayilan" deseni 0 değerini ve "0.5" gibi kısmi
   * girişleri bozuyordu (0 yazıldığında alan anında varsayılana dönüyordu).
   */
  const num = (raw: string, fallback: number): number => {
    if (raw.trim() === '') return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return (
    <aside className="w-full h-full bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* Tab Header Controls */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 p-1 gap-1 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('geo')}
          title="Geometri ve Kesit Ölçüleri"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-all whitespace-nowrap ${
            activeTab === 'geo'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Geometri</span>
        </button>

        <button
          onClick={() => setActiveTab('rail')}
          title="UIC 71 Demiryolu Yükleri ve Dolgu"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-all whitespace-nowrap ${
            activeTab === 'rail'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Train className="w-3.5 h-3.5" />
          <span>UIC 71</span>
        </button>

        <button
          onClick={() => setActiveTab('soil')}
          title="Zemin Özellikleri ve Malzeme"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-all whitespace-nowrap ${
            activeTab === 'soil'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>Zemin</span>
        </button>

        <button
          onClick={() => setActiveTab('mesh')}
          title="SAP2000 Sonlu Eleman Mesh Ayarları"
          className={`flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-semibold rounded transition-all whitespace-nowrap ${
            activeTab === 'mesh'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Mesh</span>
        </button>

        <button
          onClick={() => setActiveTab('cost')}
          title="Birim Fiyatlar ve Maliyet Analizi"
          className={`flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-semibold rounded transition-all whitespace-nowrap ${
            activeTab === 'cost'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Fiyat</span>
        </button>
      </div>

      {/* Project Meta Bar */}
      <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200 grid grid-cols-2 gap-2 text-xs shrink-0">
        <div>
          <label className="text-[10px] uppercase font-semibold text-slate-500 block">Proje Adı</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onUpdateProject({ projectName: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-semibold text-slate-500 block">Kilometre / Hat</label>
          <input
            type="text"
            value={stationOrKm}
            onChange={(e) => onUpdateProject({ stationOrKm: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] uppercase font-semibold text-slate-500 block">Proje Müellifi / Kontrol</label>
          <input
            type="text"
            placeholder="Ad Soyad — unvan"
            value={designer}
            onChange={(e) => onUpdateProject({ designer: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tab Contents - Scrollable Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'geo' && (
          <div className="space-y-3.5 text-xs">
            <div className="pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Menfez Ana Boyutları</span>
              <p className="text-[11px] text-slate-500">TCDD standart tek gözlü betonarme kutu kesit</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  İç Açıklık (B) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="12.0"
                  value={geometry.clearSpan}
                  onChange={(e) => onUpdateGeometry({ clearSpan: num(e.target.value, 1.0) })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  İç Yükseklik (H) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="8.0"
                  value={geometry.clearHeight}
                  onChange={(e) => onUpdateGeometry({ clearHeight: num(e.target.value, 1.0) })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Menfez Toplam Boyu (L) <span className="text-slate-400 font-mono">[m]</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="4.0"
                max="80.0"
                value={geometry.totalLength}
                onChange={(e) => onUpdateGeometry({ totalLength: num(e.target.value, 5.0) })}
                className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Plak ve Duvar Kalınlıkları</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                  Üst Plak (t<sub>t</sub>) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.25"
                  max="1.50"
                  value={geometry.topSlabThickness}
                  onChange={(e) =>
                    onUpdateGeometry({ topSlabThickness: num(e.target.value, 0.4) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                  Alt Plak (t<sub>b</sub>) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.25"
                  max="1.50"
                  value={geometry.bottomSlabThickness}
                  onChange={(e) =>
                    onUpdateGeometry({ bottomSlabThickness: num(e.target.value, 0.45) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                  Yan Duvar (t<sub>w</sub>) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.25"
                  max="1.50"
                  value={geometry.sideWallThickness}
                  onChange={(e) =>
                    onUpdateGeometry({ sideWallThickness: num(e.target.value, 0.4) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Üst Tabliye Köşe Ampatmanı (Pah)</span>
              <p className="text-[10px] text-blue-600 font-medium">Yalnızca üst tabliye-kenar birleşiminde (Tabanda pah yok)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Üst Yatay Pah (c<sub>h</sub>) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.0"
                  max="1.0"
                  value={geometry.haunchWidth}
                  onChange={(e) =>
                    onUpdateGeometry({ haunchWidth: num(e.target.value, 0.0) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Düşey Pah (c<sub>v</sub>) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.0"
                  max="1.0"
                  value={geometry.haunchHeight}
                  onChange={(e) =>
                    onUpdateGeometry({ haunchHeight: num(e.target.value, 0.0) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rail' && (
          <div className="space-y-3.5 text-xs">
            <div className="pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Demiryolu ve UIC 71 Yükleri</span>
              <p className="text-[11px] text-slate-500">TCDD ve UIC 776-1 / EN 1991-2 demiryolu standartları</p>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Hat Düzeni</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateRailway({ trackType: 'single' })}
                  className={`py-1.5 px-3 rounded border text-xs font-medium text-center transition-all ${
                    railway.trackType === 'single'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Tek Hat (Single)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateRailway({ trackType: 'double' })}
                  className={`py-1.5 px-3 rounded border text-xs font-medium text-center transition-all ${
                    railway.trackType === 'double'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Çift Hat (Double)
                </button>
              </div>
            </div>

            {railway.trackType === 'double' && (
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Çift Hat Eksen Mesafesi <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="3.5"
                  max="6.0"
                  value={railway.trackSpacing}
                  onChange={(e) =>
                    onUpdateRailway({ trackSpacing: num(e.target.value, 4.2) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Dolgu Yüksekliği (H<sub>f</sub>) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20.0"
                  value={railway.fillHeight}
                  onChange={(e) =>
                    onUpdateRailway({ fillHeight: num(e.target.value, 1.0) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Balast üstü - döşeme üstü</span>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Balast Kalınlığı (h<sub>b</sub>) <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.3"
                  max="1.0"
                  value={railway.ballastThickness}
                  onChange={(e) =>
                    onUpdateRailway({ ballastThickness: num(e.target.value, 0.5) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">TCDD min. 0.50m</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Hat Hızı (V) <span className="text-slate-400 font-mono">[km/h]</span>
                </label>
                <input
                  type="number"
                  step="10"
                  min="60"
                  max="350"
                  value={railway.trainSpeed}
                  onChange={(e) =>
                    onUpdateRailway({ trainSpeed: num(e.target.value, 160) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  UIC Sınıf Katsayısı (α)
                </label>
                <select
                  value={railway.alphaFactor}
                  onChange={(e) =>
                    onUpdateRailway({ alphaFactor: num(e.target.value, 1.0) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="1.00">1.00 (Standart UIC 71)</option>
                  <option value="1.21">1.21 (Ağır Yük / Maden)</option>
                  <option value="1.33">1.33 (Maksimum Yük Katarı)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Yük Yayılma Eğimi (Dispersal)
              </label>
              <select
                value={railway.dispersionSlope}
                onChange={(e) =>
                  onUpdateRailway({ dispersionSlope: num(e.target.value, 1.0) })
                }
                className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="1.0">1:1 (45° - TCDD Standart Açılma)</option>
                <option value="0.5">2:1 / 4:1 (Daha Konsantre Yayılma)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'soil' && (
          <div className="space-y-3.5 text-xs">
            <div className="pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Zemin ve Malzeme Nitelikleri</span>
              <p className="text-[11px] text-slate-500">Geoteknik parametreler ve betonarme sınıfları</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Zemin γ <span className="text-slate-400 font-mono">[kN/m³]</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="16.0"
                  max="24.0"
                  value={soil.soilUnitWeight}
                  onChange={(e) =>
                    onUpdateSoil({ soilUnitWeight: num(e.target.value, 20.0) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  İçsel Sürtünme (ϕ) <span className="text-slate-400 font-mono">[°]</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="45"
                  value={soil.frictionAngle}
                  onChange={(e) =>
                    onUpdateSoil({ frictionAngle: num(e.target.value, 30) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Zemin Yatak Katsayısı (k<sub>s</sub>) <span className="text-slate-400 font-mono">[kN/m³]</span>
              </label>
              <input
                type="number"
                step="5000"
                min="10000"
                max="200000"
                value={soil.subgradeReactionModulus}
                onChange={(e) =>
                  onUpdateSoil({ subgradeReactionModulus: num(e.target.value, 40000) })
                }
                className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Winkler taban yayları için kullanılır</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Yeraltı Su Seviyesi <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.0"
                  max="10.0"
                  value={soil.waterTableHeight}
                  onChange={(e) =>
                    onUpdateSoil({ waterTableHeight: num(e.target.value, 0.0) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Tabandan itibaren</span>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Paspayı <span className="text-slate-400 font-mono">[mm]</span>
                </label>
                <input
                  type="number"
                  step="5"
                  min="30"
                  max="80"
                  value={soil.concreteCover}
                  onChange={(e) =>
                    onUpdateSoil({ concreteCover: num(e.target.value, 50) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Menfez İçi Su Yüksekliği <span className="text-slate-400 font-mono">[m]</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="10.0"
                  value={soil.internalWaterDepth}
                  onChange={(e) =>
                    onUpdateSoil({ internalWaterDepth: num(e.target.value, 0.0) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Tabandan itibaren (kaldırma hesabı)</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block leading-relaxed">
                  Dış su basıncı yeraltı su seviyesinden, iç su basıncı bu değerden
                  hesaplanır. Tabandaki net kaldırma basıncı ikisinin farkıdır ve
                  hem duvar hem taban yüklerine uygulanır.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Beton Sınıfı</label>
                <select
                  value={soil.concreteGrade}
                  onChange={(e) =>
                    onUpdateSoil({ concreteGrade: e.target.value as ConcreteGrade })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="C25/30">C25/30</option>
                  <option value="C30/37">C30/37 (TCDD Standart)</option>
                  <option value="C35/45">C35/45</option>
                  <option value="C40/50">C40/50</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Donatı Sınıfı</label>
                <select
                  value={soil.steelGrade}
                  onChange={(e) =>
                    onUpdateSoil({ steelGrade: e.target.value as SteelGrade })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="B420C">B420C (TS 708)</option>
                  <option value="B500C">B500C (Eurocode)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mesh' && (
          <div className="space-y-3.5 text-xs">
            <div className="pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">SAP2000 Sonlu Eleman Mesh</span>
              <p className="text-[11px] text-slate-500">
                Kabuk (Shell) eleman boyutlandırma ve düğüm yoğunluğu
              </p>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Hedef Eleman Boyutu <span className="text-slate-400 font-mono">[m]</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0.25, 0.5, 1.0].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onUpdateMeshSize(size)}
                    className={`py-2 px-2 text-xs font-mono font-medium rounded border text-center transition-all ${
                      meshSize === size
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-xs'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {size.toFixed(2)} m
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                0.50m genellikle menfez analizleri için hem hesap hızı hem de hassasiyet açısından optimumdur.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-3 text-xs">
            <div className="pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Birim Fiyatlar (Yaklaşık Maliyet)</span>
              <p className="text-[11px] text-slate-500">TCDD / ÇŞB güncel birim imalat fiyatları</p>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Betonarme Betonu <span className="text-slate-400 font-mono">[TL/m³]</span>
              </label>
              <input
                type="number"
                step="100"
                value={unitCosts.concretePrice}
                onChange={(e) =>
                  onUpdateCosts({ concretePrice: num(e.target.value, 2800) })
                }
                className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Beton Çeliği / Donatı <span className="text-slate-400 font-mono">[TL/Ton]</span>
              </label>
              <input
                type="number"
                step="1000"
                value={unitCosts.rebarPrice}
                onChange={(e) =>
                  onUpdateCosts({ rebarPrice: num(e.target.value, 32000) })
                }
                className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Kalıp İmalatı <span className="text-slate-400 font-mono">[TL/m²]</span>
              </label>
              <input
                type="number"
                step="50"
                value={unitCosts.formworkPrice}
                onChange={(e) =>
                  onUpdateCosts({ formworkPrice: num(e.target.value, 650) })
                }
                className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                  Kazı <span className="text-slate-400 font-mono">[TL/m³]</span>
                </label>
                <input
                  type="number"
                  step="20"
                  value={unitCosts.excavationPrice}
                  onChange={(e) =>
                    onUpdateCosts({ excavationPrice: num(e.target.value, 180) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                  Geri Dolgu <span className="text-slate-400 font-mono">[TL/m³]</span>
                </label>
                <input
                  type="number"
                  step="20"
                  value={unitCosts.backfillPrice}
                  onChange={(e) =>
                    onUpdateCosts({ backfillPrice: num(e.target.value, 240) })
                  }
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Su Yalıtımı ve Drenaj <span className="text-slate-400 font-mono">[TL/m²]</span>
              </label>
              <input
                type="number"
                step="50"
                value={unitCosts.waterproofingPrice}
                onChange={(e) =>
                  onUpdateCosts({ waterproofingPrice: num(e.target.value, 450) })
                }
                className="w-full border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
