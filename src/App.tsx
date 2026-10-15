/**
 * Main Application Component: TCDD & UIC 71 Box Culvert Design and SAP2000 Model Generator
 */

import { useState, useMemo } from 'react';
import {
  CulvertGeometry,
  RailwayLoadingParams,
  SoilAndMaterialParams,
  UnitCostParams,
} from './types/culvert';
import { calculateUIC71Loads } from './utils/uic71Engine';
import { generateSAP2000Model } from './utils/sap2000Exporter';
import { solveCulvertStructuralDesign } from './utils/structuralSolver';
import { calculateQuantitySurvey } from './utils/quantitySurvey';

import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { Section2DViewer } from './components/Section2DViewer';
import { Mesh3DViewer } from './components/Mesh3DViewer';
import { Sap2000ExporterView } from './components/Sap2000ExporterView';
import { RebarDesignView } from './components/RebarDesignView';
import { QuantityReportView } from './components/QuantityReportView';
import { CalculationReportModal } from './components/CalculationReportModal';

export default function App() {
  // Proje Meta Bilgileri
  const [projectName, setProjectName] = useState('TCDD Demiryolu Kutu Menfez Tasarım Projesi');
  const [stationOrKm, setStationOrKm] = useState('KM: 000+000');
  const [designer, setDesigner] = useState('');

  // Menfez Geometrisi
  const [geometry, setGeometry] = useState<CulvertGeometry>({
    clearSpan: 3.0,
    clearHeight: 3.0,
    totalLength: 16.0,
    topSlabThickness: 0.45,
    bottomSlabThickness: 0.50,
    sideWallThickness: 0.45,
    haunchWidth: 0.30,
    haunchHeight: 0.30,
  });

  // Demiryolu & UIC 71 Parametreleri
  const [railway, setRailway] = useState<RailwayLoadingParams>({
    trackType: 'single',
    trackSpacing: 4.2,
    fillHeight: 2.0,
    ballastThickness: 0.5,
    trainSpeed: 160,
    alphaFactor: 1.0,
    dispersionSlope: 1.0, // 1:1 açılma
    sleeperLength: 2.6,
    longitudinalAxleSpacing: 1.6,
  });

  // Zemin ve Malzeme Parametreleri
  const [soil, setSoil] = useState<SoilAndMaterialParams>({
    soilUnitWeight: 20.0,
    ballastUnitWeight: 19.0,
    concreteUnitWeight: 25.0,
    frictionAngle: 32,
    subgradeReactionModulus: 40000,
    waterTableHeight: 0.0,
    internalWaterDepth: 0.0,
    concreteGrade: 'C30/37',
    steelGrade: 'B420C',
    concreteCover: 50,
  });

  // Birim Fiyatlar
  const [unitCosts, setUnitCosts] = useState<UnitCostParams>({
    concretePrice: 2800,
    rebarPrice: 32000,
    formworkPrice: 650,
    excavationPrice: 180,
    backfillPrice: 240,
    waterproofingPrice: 450,
    currency: 'TRY',
  });

  // SAP2000 Mesh boyutu
  const [meshSize, setMeshSize] = useState<number>(0.5);

  // Aktif görünüm sekmesi
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'sap2000' | 'rebar' | 'boq'>('2d');

  // Hesap raporu modalı
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Mobil/tablet giriş paneli çekmecesi
  const [isInputPanelOpen, setIsInputPanelOpen] = useState(false);

  // Canlı Mühendislik Hesap Motorları
  const calculatedLoads = useMemo(() => {
    return calculateUIC71Loads(geometry, railway, soil);
  }, [geometry, railway, soil]);

  const sap2000Model = useMemo(() => {
    return generateSAP2000Model(geometry, soil, calculatedLoads, meshSize);
  }, [geometry, soil, calculatedLoads, meshSize]);

  const structuralResults = useMemo(() => {
    return solveCulvertStructuralDesign(geometry, soil, calculatedLoads);
  }, [geometry, soil, calculatedLoads]);

  // Metraj donatı çap/aralıklarını yapısal çözücüden alır (tek doğruluk kaynağı)
  const quantityReport = useMemo(() => {
    return calculateQuantitySurvey(
      geometry,
      railway,
      unitCosts,
      soil.concreteGrade,
      structuralResults.sections
    );
  }, [geometry, railway, unitCosts, soil.concreteGrade, structuralResults.sections]);

  // SAP2000 .s2k Dosyasını İndirme
  const handleDownloadS2K = () => {
    const blob = new Blob([sap2000Model.s2kScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcdd_kutu_menfez_${geometry.clearSpan}x${geometry.clearHeight}m_sap2000.s2k`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Malzeme Metrajı CSV İndirme
  const handleExportCSV = () => {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows: (string | number)[][] = [
      [
        'Poz No',
        'Imalat Tanimi',
        'Birim',
        'Miktar',
        `Birim Fiyat (${quantityReport.currency})`,
        `Toplam Tutar (${quantityReport.currency})`,
      ],
      ...quantityReport.items.map((it) => [
        it.posNo,
        it.description,
        it.unit,
        it.quantity.toFixed(2).replace('.', ','),
        it.unitPrice.toFixed(2).replace('.', ','),
        it.totalCost.toFixed(2).replace('.', ','),
      ]),
      ['', '', '', '', 'TOPLAM TUTAR', quantityReport.totalEstimatedCost.toFixed(2).replace('.', ',')],
    ];
    const csvContent = rows.map((e) => e.map(esc).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcdd_menfez_metraj_${geometry.clearSpan}x${geometry.clearHeight}m.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Hazır TCDD Tip Şablonları
  const handleSelectPreset = (presetKey: string) => {
    if (presetKey === 'tip1') {
      setGeometry({
        clearSpan: 2.0,
        clearHeight: 2.0,
        totalLength: 14.0,
        topSlabThickness: 0.35,
        bottomSlabThickness: 0.4,
        sideWallThickness: 0.35,
        haunchWidth: 0.25,
        haunchHeight: 0.25,
      });
      setRailway((prev) => ({
        ...prev,
        trackType: 'single',
        fillHeight: 1.2,
      }));
    } else if (presetKey === 'tip2') {
      setGeometry({
        clearSpan: 3.0,
        clearHeight: 3.0,
        totalLength: 16.0,
        topSlabThickness: 0.45,
        bottomSlabThickness: 0.5,
        sideWallThickness: 0.45,
        haunchWidth: 0.3,
        haunchHeight: 0.3,
      });
      setRailway((prev) => ({
        ...prev,
        trackType: 'single',
        fillHeight: 2.0,
      }));
    } else if (presetKey === 'tip3') {
      setGeometry({
        clearSpan: 4.0,
        clearHeight: 3.0,
        totalLength: 20.0,
        topSlabThickness: 0.55,
        bottomSlabThickness: 0.6,
        sideWallThickness: 0.5,
        haunchWidth: 0.35,
        haunchHeight: 0.35,
      });
      setRailway((prev) => ({
        ...prev,
        trackType: 'double',
        trackSpacing: 4.2,
        fillHeight: 2.5,
      }));
    } else if (presetKey === 'tip4') {
      setGeometry({
        clearSpan: 5.0,
        clearHeight: 4.0,
        totalLength: 26.0,
        topSlabThickness: 0.7,
        bottomSlabThickness: 0.75,
        sideWallThickness: 0.65,
        haunchWidth: 0.4,
        haunchHeight: 0.4,
      });
      setRailway((prev) => ({
        ...prev,
        trackType: 'double',
        trackSpacing: 4.5,
        fillHeight: 4.5,
      }));
    }
  };

  const handleReset = () => {
    handleSelectPreset('tip2');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        onDownloadS2K={handleDownloadS2K}
        onExportCSV={handleExportCSV}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onToggleInputPanel={() => setIsInputPanelOpen((prev) => !prev)}
      />

      {/* Main Split Layout: Left Input Panel, Right Interactive Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Input Sidebar (masaüstü/tablet) */}
        <div className="hidden md:flex w-80 md:w-88 lg:w-96 shrink-0">
          <InputPanel
            projectName={projectName}
            stationOrKm={stationOrKm}
            designer={designer}
            geometry={geometry}
            railway={railway}
            soil={soil}
            unitCosts={unitCosts}
            meshSize={meshSize}
            onUpdateProject={(data) => {
              if (data.projectName !== undefined) setProjectName(data.projectName);
              if (data.stationOrKm !== undefined) setStationOrKm(data.stationOrKm);
              if (data.designer !== undefined) setDesigner(data.designer);
            }}
            onUpdateGeometry={(geo) => setGeometry((prev) => ({ ...prev, ...geo }))}
            onUpdateRailway={(rail) => setRailway((prev) => ({ ...prev, ...rail }))}
            onUpdateSoil={(s) => setSoil((prev) => ({ ...prev, ...s }))}
            onUpdateCosts={(c) => setUnitCosts((prev) => ({ ...prev, ...c }))}
            onUpdateMeshSize={setMeshSize}
          />
        </div>

        {/* Mobil/tablet giriş paneli çekmecesi */}
        {isInputPanelOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsInputPanelOpen(false)}
            />
            <div className="relative w-80 max-w-[88vw] h-full shadow-2xl">
              <InputPanel
                projectName={projectName}
                stationOrKm={stationOrKm}
                designer={designer}
                geometry={geometry}
                railway={railway}
                soil={soil}
                unitCosts={unitCosts}
                meshSize={meshSize}
                onUpdateProject={(data) => {
                  if (data.projectName !== undefined) setProjectName(data.projectName);
                  if (data.stationOrKm !== undefined) setStationOrKm(data.stationOrKm);
                  if (data.designer !== undefined) setDesigner(data.designer);
                }}
                onUpdateGeometry={(geo) => setGeometry((prev) => ({ ...prev, ...geo }))}
                onUpdateRailway={(rail) => setRailway((prev) => ({ ...prev, ...rail }))}
                onUpdateSoil={(s) => setSoil((prev) => ({ ...prev, ...s }))}
                onUpdateCosts={(c) => setUnitCosts((prev) => ({ ...prev, ...c }))}
                onUpdateMeshSize={setMeshSize}
              />
            </div>
          </div>
        )}

        {/* Right Active Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {activeTab === '2d' && (
            <Section2DViewer
              geometry={geometry}
              railway={railway}
              soil={soil}
              loads={calculatedLoads}
            />
          )}

          {activeTab === '3d' && (
            <Mesh3DViewer
              modelData={sap2000Model}
              geometry={geometry}
              railway={railway}
            />
          )}

          {activeTab === 'sap2000' && (
            <Sap2000ExporterView
              modelData={sap2000Model}
              geometry={geometry}
              loads={calculatedLoads}
              onDownloadS2K={handleDownloadS2K}
            />
          )}

          {activeTab === 'rebar' && (
            <RebarDesignView
              sections={structuralResults.sections}
              summary={structuralResults.summary}
              geometry={geometry}
              soil={soil}
            />
          )}

          {activeTab === 'boq' && (
            <QuantityReportView
              report={quantityReport}
              geometry={geometry}
              onExportCSV={handleExportCSV}
            />
          )}
        </main>
      </div>

      {/* Mobil/tablet alt sekme çubuğu (lg altındaki ekranlarda gezinme erişimi) */}
      <nav className="lg:hidden flex shrink-0 border-t border-slate-800 bg-slate-900">
        {(
          [
            ['2d', '2B Kesit'],
            ['3d', '3B Mesh'],
            ['sap2000', 'SAP2000'],
            ['rebar', 'Donatı'],
            ['boq', 'Metraj'],
          ] as [typeof activeTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${
              activeTab === key
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Official Calculation Report Modal */}
      <CalculationReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        projectName={projectName}
        stationOrKm={stationOrKm}
        designer={designer}
        geometry={geometry}
        railway={railway}
        soil={soil}
        loads={calculatedLoads}
        sections={structuralResults.sections}
        summary={structuralResults.summary}
        report={quantityReport}
        onDownloadS2K={handleDownloadS2K}
      />
    </div>
  );
}
