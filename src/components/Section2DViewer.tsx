/**
 * Interactive 2D CAD-like Cross-Section and Load Dispersal SVG Viewer
 */

import React, { useState } from 'react';
import {
  CulvertGeometry,
  RailwayLoadingParams,
  SoilAndMaterialParams,
  UIC71CalculatedLoads,
} from '../types/culvert';
import { Eye, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Section2DViewerProps {
  geometry: CulvertGeometry;
  railway: RailwayLoadingParams;
  soil: SoilAndMaterialParams;
  loads: UIC71CalculatedLoads;
}

export const Section2DViewer: React.FC<Section2DViewerProps> = ({
  geometry,
  railway,
  soil,
  loads,
}) => {
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLoads, setShowLoads] = useState(true);
  const [showRebar, setShowRebar] = useState(true);
  const [showSoilPressure, setShowSoilPressure] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);

  // Toplam dış boyutlar
  const bExt = geometry.clearSpan + 2 * geometry.sideWallThickness;
  const hExt = geometry.clearHeight + geometry.topSlabThickness + geometry.bottomSlabThickness;
  const totalHeightView = hExt + railway.fillHeight + 1.2;
  const totalWidthView = Math.max(bExt + 4.0, loads.effectiveWidth + 3.0, 9.0);

  // SVG Koordinat haritalaması
  const svgWidth = 850;
  const svgHeight = 580;
  const scale = Math.min((svgWidth - 140) / totalWidthView, (svgHeight - 140) / totalHeightView) * zoomScale;

  const centerX = svgWidth / 2;
  const culvertBottomY = svgHeight - 80;
  const culvertTopY = culvertBottomY - hExt * scale;
  const groundY = culvertTopY - (railway.fillHeight - railway.ballastThickness) * scale;
  const ballastTopY = culvertTopY - railway.fillHeight * scale;

  // Menfez Köşe Koordinatları (Dış)
  const xLeftExt = centerX - (bExt / 2) * scale;
  const xRightExt = centerX + (bExt / 2) * scale;
  const yTopExt = culvertTopY;
  const yBotExt = culvertBottomY;

  // Menfez Köşe Koordinatları (İç)
  const xLeftInt = centerX - (geometry.clearSpan / 2) * scale;
  const xRightInt = centerX + (geometry.clearSpan / 2) * scale;
  const yTopInt = culvertTopY + geometry.topSlabThickness * scale;
  const yBotInt = culvertBottomY - geometry.bottomSlabThickness * scale;

  // Pahlar
  const phX = geometry.haunchWidth * scale;
  const phY = geometry.haunchHeight * scale;

  // İç delik SVG path'i (Yalnızca üst tabliye-kenar birleşiminde pah, tabanda 90° dik köşe)
  const innerPath = `
    M ${xLeftInt + phX} ${yTopInt}
    L ${xRightInt - phX} ${yTopInt}
    L ${xRightInt} ${yTopInt + phY}
    L ${xRightInt} ${yBotInt}
    L ${xLeftInt} ${yBotInt}
    L ${xLeftInt} ${yTopInt + phY}
    Z
  `;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/80 text-xs shrink-0 z-10">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold text-white">2B Enkesit & UIC 71 Yük Yayılım Şeması</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-blue-400">
            Açıklık: {geometry.clearSpan.toFixed(2)}m × Yükseklik: {geometry.clearHeight.toFixed(2)}m
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-emerald-400">
            Dolgu: {railway.fillHeight.toFixed(2)}m
          </span>
        </div>

        {/* Toggle Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showDimensions ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Ölçüler
          </button>
          <button
            onClick={() => setShowLoads(!showLoads)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showLoads ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            UIC 71 Yükü
          </button>
          <button
            onClick={() => setShowSoilPressure(!showSoilPressure)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showSoilPressure ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Zemin İtkisi
          </button>
          <button
            onClick={() => setShowRebar(!showRebar)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showRebar ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Donatılar
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button
            onClick={() => setZoomScale((prev) => Math.min(prev + 0.15, 2.0))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomScale((prev) => Math.max(prev - 0.15, 0.6))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomScale(1)}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
            title="Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full max-h-[82vh] drop-shadow-md select-none"
        >
          <defs>
            {/* Zemin Dolgusu Deseni */}
            <pattern id="soilPattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M0 16 L16 0 M-4 4 L4 -4 M12 20 L20 12" stroke="#334155" strokeWidth="0.75" />
            </pattern>
            {/* Balast Deseni */}
            <pattern id="ballastPattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill="#475569" />
              <circle cx="9" cy="9" r="1.5" fill="#475569" />
              <circle cx="9" cy="3" r="1.2" fill="#334155" />
              <circle cx="3" cy="9" r="1.2" fill="#334155" />
            </pattern>
            {/* Ok Başları */}
            <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="#ef4444" />
            </marker>
            <marker id="arrowOrange" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="#f97316" />
            </marker>
            <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="#3b82f6" />
            </marker>
          </defs>

          {/* 1. Zemin Katmanı (Embankment Fill) */}
          <rect
            x={centerX - (totalWidthView / 2) * scale}
            y={ballastTopY}
            width={totalWidthView * scale}
            height={(culvertBottomY - ballastTopY) + 40}
            fill="#1e293b"
            opacity="0.4"
          />
          <rect
            x={centerX - (totalWidthView / 2) * scale}
            y={ballastTopY}
            width={totalWidthView * scale}
            height={(culvertBottomY - ballastTopY) + 40}
            fill="url(#soilPattern)"
            opacity="0.6"
          />

          {/* 2. Balast Tabakası */}
          {railway.fillHeight > 0 && (
            <polygon
              points={`
                ${centerX - (railway.sleeperLength / 2 + 1.2) * scale},${ballastTopY}
                ${centerX + (railway.sleeperLength / 2 + 1.2) * scale},${ballastTopY}
                ${centerX + (railway.sleeperLength / 2 + 1.2 + railway.ballastThickness * 1.5) * scale},${ballastTopY + railway.ballastThickness * scale}
                ${centerX - (railway.sleeperLength / 2 + 1.2 + railway.ballastThickness * 1.5) * scale},${ballastTopY + railway.ballastThickness * scale}
              `}
              fill="#334155"
              stroke="#475569"
              strokeWidth="1.5"
            />
          )}

          {/* 3. Yük Yayılma Piramidi (UIC 71 Dispersal) */}
          {showLoads && (
            <g opacity="0.85">
              {/* Yayılma çizgileri */}
              <polygon
                points={`
                  ${centerX - (railway.sleeperLength / 2) * scale},${ballastTopY}
                  ${centerX + (railway.sleeperLength / 2) * scale},${ballastTopY}
                  ${centerX + (loads.effectiveWidth / 2) * scale},${yTopExt}
                  ${centerX - (loads.effectiveWidth / 2) * scale},${yTopExt}
                `}
                fill="#f59e0b"
                fillOpacity="0.12"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />

              {/* Üst plak üstünde dağılmış UIC 71 basınç bandı */}
              <rect
                x={centerX - (Math.min(loads.effectiveWidth, bExt) / 2) * scale}
                y={yTopExt - 18}
                width={Math.min(loads.effectiveWidth, bExt) * scale}
                height={16}
                fill="#ef4444"
                fillOpacity="0.25"
                stroke="#ef4444"
                strokeWidth="1"
              />

              {/* Düşey yük basınç okları */}
              {[-0.35, -0.15, 0.05, 0.25].map((ratio, idx) => (
                <line
                  key={idx}
                  x1={centerX + (Math.min(loads.effectiveWidth, bExt) * ratio) * scale}
                  y1={yTopExt - 36}
                  x2={centerX + (Math.min(loads.effectiveWidth, bExt) * ratio) * scale}
                  y2={yTopExt - 4}
                  stroke="#ef4444"
                  strokeWidth="2"
                  markerEnd="url(#arrowRed)"
                />
              ))}

              <text
                x={centerX}
                y={yTopExt - 42}
                textAnchor="middle"
                fill="#fca5a5"
                fontSize="11"
                fontWeight="bold"
                className="font-mono"
              >
                q_live = {loads.qVerticalLiveMax.toFixed(1)} kN/m² (Φ = {loads.phiReduced.toFixed(2)})
              </text>
            </g>
          )}

          {/* 4. Demiryolu Travers ve Rayları */}
          <g>
            {/* Travers (Sleeper) */}
            <rect
              x={centerX - (railway.sleeperLength / 2) * scale}
              y={ballastTopY - 8}
              width={railway.sleeperLength * scale}
              height="8"
              fill="#78350f"
              stroke="#92400e"
              strokeWidth="1.5"
              rx="1"
            />
            {/* Çelik Raylar (1435 mm açıklık) */}
            {[-0.7175, 0.7175].map((pos, idx) => (
              <g key={idx}>
                {/* Ray I-profili */}
                <rect
                  x={centerX + pos * scale - 4}
                  y={ballastTopY - 20}
                  width="8"
                  height="12"
                  fill="#94a3b8"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Dingil Yükü Oku (UIC 71 250 kN) */}
                {showLoads && (
                  <g>
                    <line
                      x1={centerX + pos * scale}
                      y1={ballastTopY - 55}
                      x2={centerX + pos * scale}
                      y2={ballastTopY - 22}
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      markerEnd="url(#arrowRed)"
                    />
                    <text
                      x={centerX + pos * scale}
                      y={ballastTopY - 60}
                      textAnchor="middle"
                      fill="#f87171"
                      fontSize="10"
                      fontWeight="bold"
                      className="font-mono"
                    >
                      250 kN
                    </text>
                  </g>
                )}
              </g>
            ))}
          </g>

          {/* 5. Betonarme Kutu Menfez Gövdesi */}
          <path
            d={`
              M ${xLeftExt} ${yTopExt}
              H ${xRightExt}
              V ${yBotExt}
              H ${xLeftExt}
              Z
              ${innerPath}
            `}
            fill="#334155"
            fillRule="evenodd"
            stroke="#64748b"
            strokeWidth="2.5"
          />

          {/* 6. Zemin Yayları (Winkler Springs) */}
          <g>
            {Array.from({ length: 9 }).map((_, idx) => {
              const spX = xLeftExt + ((idx + 0.5) / 9) * bExt * scale;
              return (
                <g key={idx} opacity="0.8">
                  <path
                    d={`
                      M ${spX} ${yBotExt}
                      l -4 4 l 8 4 l -8 4 l 8 4 l -4 4
                      M ${spX - 8} ${yBotExt + 20} h 16
                      M ${spX - 6} ${yBotExt + 23} h 12
                    `}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
            <text
              x={centerX}
              y={yBotExt + 38}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="10"
              fontWeight="medium"
              className="font-mono"
            >
              Taban Zemin Yatağı ks = {soil.subgradeReactionModulus.toLocaleString()} kN/m³
            </text>
          </g>

          {/* 7. Yanal Zemin Basıncı Dağılımı (Soil Pressure Trapezoid) */}
          {showSoilPressure && (
            <g>
              {/* Sol Duvar Basınç Diyagramı */}
              <polygon
                points={`
                  ${xLeftExt},${yTopExt}
                  ${xLeftExt - loads.sigmaSoilTop * 0.8 * zoomScale},${yTopExt}
                  ${xLeftExt - loads.sigmaSoilBottom * 0.8 * zoomScale},${yBotExt}
                  ${xLeftExt},${yBotExt}
                `}
                fill="#ea580c"
                fillOpacity="0.25"
                stroke="#f97316"
                strokeWidth="1.5"
              />
              {/* Basınç okları */}
              {[0.15, 0.5, 0.85].map((r, i) => {
                const py = yTopExt + r * hExt * scale;
                const pVal = loads.sigmaSoilTop + r * (loads.sigmaSoilBottom - loads.sigmaSoilTop);
                const px = xLeftExt - pVal * 0.8 * zoomScale;
                return (
                  <line
                    key={i}
                    x1={px}
                    y1={py}
                    x2={xLeftExt}
                    y2={py}
                    stroke="#f97316"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowOrange)"
                  />
                );
              })}
              <text
                x={xLeftExt - loads.sigmaSoilTop * 0.8 * zoomScale - 8}
                y={yTopExt + 4}
                textAnchor="end"
                fill="#fdba74"
                fontSize="10"
                className="font-mono"
              >
                σ_top = {loads.sigmaSoilTop} kPa
              </text>
              <text
                x={xLeftExt - loads.sigmaSoilBottom * 0.8 * zoomScale - 8}
                y={yBotExt - 2}
                textAnchor="end"
                fill="#fdba74"
                fontSize="10"
                className="font-mono"
              >
                σ_bot = {loads.sigmaSoilBottom} kPa
              </text>
            </g>
          )}

          {/* 8. Donatı Gösterimi (Rebar Dots & Lines) */}
          {showRebar && (
            <g opacity="0.95">
              {/* Üst Plak Donatıları (Alt sıra kırmızı, üst sıra mavi) */}
              {Array.from({ length: 8 }).map((_, i) => {
                const rx = xLeftInt + 15 + ((i + 0.5) / 8) * (geometry.clearSpan * scale - 30);
                return (
                  <g key={i}>
                    {/* Alt çekme donatıları */}
                    <circle cx={rx} cy={yTopInt - 10} r="2.5" fill="#ef4444" />
                    {/* Üst mesnet donatıları */}
                    <circle cx={rx} cy={yTopExt + 10} r="2.5" fill="#3b82f6" />
                    {/* Alt plak alt ve üst donatıları */}
                    <circle cx={rx} cy={yBotExt - 10} r="2.5" fill="#3b82f6" />
                    <circle cx={rx} cy={yBotInt + 10} r="2.5" fill="#ef4444" />
                  </g>
                );
              })}
              {/* Yan Duvar Düşey Donatıları */}
              {Array.from({ length: 6 }).map((_, i) => {
                const ry = yTopInt + 15 + ((i + 0.5) / 6) * (geometry.clearHeight * scale - 30);
                return (
                  <g key={i}>
                    {/* Sol duvar iç ve dış */}
                    <circle cx={xLeftExt + 10} cy={ry} r="2.2" fill="#3b82f6" />
                    <circle cx={xLeftInt - 10} cy={ry} r="2.2" fill="#ef4444" />
                    {/* Sağ duvar iç ve dış */}
                    <circle cx={xRightInt + 10} cy={ry} r="2.2" fill="#ef4444" />
                    <circle cx={xRightExt - 10} cy={ry} r="2.2" fill="#3b82f6" />
                  </g>
                );
              })}
            </g>
          )}

          {/* 9. Ölçülendirme Çizgileri (Dimension Lines) */}
          {showDimensions && (
            <g stroke="#94a3b8" strokeWidth="1" opacity="0.9">
              {/* İç Açıklık (B) Ölçüsü */}
              <line x1={xLeftInt} y1={yTopInt + 35} x2={xRightInt} y2={yTopInt + 35} />
              <line x1={xLeftInt} y1={yTopInt + 25} x2={xLeftInt} y2={yTopInt + 45} />
              <line x1={xRightInt} y1={yTopInt + 25} x2={xRightInt} y2={yTopInt + 45} />
              <text
                x={centerX}
                y={yTopInt + 31}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="11"
                fontWeight="bold"
                className="font-mono"
              >
                B = {geometry.clearSpan.toFixed(2)} m
              </text>

              {/* İç Yükseklik (H) Ölçüsü */}
              <line x1={xLeftInt + 35} y1={yTopInt} x2={xLeftInt + 35} y2={yBotInt} />
              <line x1={xLeftInt + 25} y1={yTopInt} x2={xLeftInt + 45} y2={yTopInt} />
              <line x1={xLeftInt + 25} y1={yBotInt} x2={xLeftInt + 45} y2={yBotInt} />
              <text
                x={xLeftInt + 40}
                y={yTopInt + (geometry.clearHeight * scale) / 2 + 4}
                textAnchor="start"
                fill="#e2e8f0"
                fontSize="11"
                fontWeight="bold"
                className="font-mono"
              >
                H = {geometry.clearHeight.toFixed(2)} m
              </text>

              {/* Üst Plak Kalınlığı (tt) */}
              <line x1={xRightExt + 15} y1={yTopExt} x2={xRightExt + 15} y2={yTopInt} />
              <line x1={xRightExt + 10} y1={yTopExt} x2={xRightExt + 20} y2={yTopExt} />
              <line x1={xRightExt + 10} y1={yTopInt} x2={xRightExt + 20} y2={yTopInt} />
              <text
                x={xRightExt + 22}
                y={yTopExt + (geometry.topSlabThickness * scale) / 2 + 4}
                textAnchor="start"
                fill="#cbd5e1"
                fontSize="10"
                className="font-mono"
              >
                tt={geometry.topSlabThickness.toFixed(2)}m
              </text>

              {/* Alt Plak Kalınlığı (tb) */}
              <line x1={xRightExt + 15} y1={yBotInt} x2={xRightExt + 15} y2={yBotExt} />
              <line x1={xRightExt + 10} y1={yBotInt} x2={xRightExt + 20} y2={yBotInt} />
              <line x1={xRightExt + 10} y1={yBotExt} x2={xRightExt + 20} y2={yBotExt} />
              <text
                x={xRightExt + 22}
                y={yBotInt + (geometry.bottomSlabThickness * scale) / 2 + 4}
                textAnchor="start"
                fill="#cbd5e1"
                fontSize="10"
                className="font-mono"
              >
                tb={geometry.bottomSlabThickness.toFixed(2)}m
              </text>

              {/* Dolgu Yüksekliği Ölçüsü */}
              <line x1={centerX - (bExt / 2) * scale - 50} y1={ballastTopY} x2={centerX - (bExt / 2) * scale - 50} y2={yTopExt} />
              <line x1={centerX - (bExt / 2) * scale - 55} y1={ballastTopY} x2={centerX - (bExt / 2) * scale - 45} y2={ballastTopY} />
              <line x1={centerX - (bExt / 2) * scale - 55} y1={yTopExt} x2={centerX - (bExt / 2) * scale - 45} y2={yTopExt} />
              <text
                x={centerX - (bExt / 2) * scale - 58}
                y={ballastTopY + (railway.fillHeight * scale) / 2 + 4}
                textAnchor="end"
                fill="#fbbf24"
                fontSize="11"
                fontWeight="bold"
                className="font-mono"
              >
                Hf = {railway.fillHeight.toFixed(2)} m
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-400 shrink-0">
        <div className="flex items-center gap-4">
          <span>
            Beton: <strong className="text-white font-mono">{soil.concreteGrade}</strong>
          </span>
          <span>
            Donatı: <strong className="text-white font-mono">{soil.steelGrade}</strong>
          </span>
          <span>
            Sükunet Katsayısı K₀: <strong className="text-white font-mono">{loads.k0}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono">
          <span>L = {geometry.totalLength.toFixed(1)}m</span>
          <span>·</span>
          <span>Dış Ebat: {bExt.toFixed(2)}m × {hExt.toFixed(2)}m</span>
        </div>
      </div>
    </div>
  );
};
