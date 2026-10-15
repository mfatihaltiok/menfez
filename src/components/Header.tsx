/**
 * Header component conforming to the Top Bar Contract
 */

import React from 'react';
import { Download, Printer, SlidersHorizontal, FileSpreadsheet, RotateCcw } from 'lucide-react';

export type AppTab = '2d' | '3d' | 'sap2000' | 'rebar' | 'boq';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenReport: () => void;
  onDownloadS2K: () => void;
  onExportCSV: () => void;
  onSelectPreset: (presetKey: string) => void;
  onReset: () => void;
  onToggleInputPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenReport,
  onDownloadS2K,
  onExportCSV,
  onSelectPreset,
  onReset,
  onToggleInputPanel,
}) => {
  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 text-white shrink-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0 min-w-0">
        <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-black text-sm tracking-wider shadow-sm shrink-0">
          TCDD
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
            Kutu Menfez Tasarımı &amp; SAP2000 Modeli
          </span>
          <span className="hidden sm:block text-xs text-slate-400 font-mono truncate">
            UIC 71 Standartı · Kabuk (Shell) Sonlu Eleman
          </span>
        </div>
      </div>

      {/* Zone 2: Clean single-line navigation tabs */}
      <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-800/90 rounded-lg border border-slate-700/60 shrink-0">
        <button
          onClick={() => onTabChange('2d')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === '2d'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          2B Kesit &amp; Yükler
        </button>
        <button
          onClick={() => onTabChange('3d')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === '3d'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          3B Kabuk (Mesh)
        </button>
        <button
          onClick={() => onTabChange('sap2000')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'sap2000'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          SAP2000 .s2k &amp; Tablolar
        </button>
        <button
          onClick={() => onTabChange('rebar')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'rebar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Donatı &amp; Tahkik
        </button>
        <button
          onClick={() => onTabChange('boq')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'boq'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Malzeme Metrajı
        </button>
      </nav>

      {/* Zone 3: Primary Actions and Quick Utilities */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobil/tablet için giriş paneli çekmecesi */}
        <button
          onClick={onToggleInputPanel}
          title="Tasarım girdilerini aç/kapat"
          className="md:hidden p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <select
          onChange={(e) => {
            if (e.target.value) {
              onSelectPreset(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="hidden sm:block bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="" disabled>
            TCDD Tip Şablonları...
          </option>
          <option value="tip1">Tip-1: 2.0 × 2.0 m (Tek Hat, 1.2m Dolgu)</option>
          <option value="tip2">Tip-2: 3.0 × 3.0 m (Tek Hat, 2.0m Dolgu)</option>
          <option value="tip3">Tip-3: 4.0 × 3.0 m (Çift Hat, 2.5m Dolgu)</option>
          <option value="tip4">Tip-4: 5.0 × 4.0 m (Çift Hat, 4.5m Derin Dolgu)</option>
        </select>

        <button
          onClick={onDownloadS2K}
          title="SAP2000 .s2k script dosyasını indir"
          className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors items-center gap-1.5 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>.s2k İndir</span>
        </button>

        <button
          onClick={onExportCSV}
          title="Malzeme metrajini CSV olarak indir"
          className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors items-center gap-1.5 whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>CSV</span>
        </button>

        <button
          onClick={onReset}
          title="Varsayilan TCDD Tip-2 şablonuna dön"
          className="hidden sm:flex p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenReport}
          className="px-3 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hesap Raporu</span>
          <span className="sm:hidden">Rapor</span>
        </button>
      </div>
    </header>
  );
};
