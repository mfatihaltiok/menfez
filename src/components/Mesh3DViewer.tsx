/**
 * Interactive 3D WebGL Viewer for SAP2000 Shell Finite Element Mesh
 * Powered by Three.js
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SAP2000ModelData, CulvertGeometry, RailwayLoadingParams } from '../types/culvert';
import { Eye, Layers, RotateCcw, Box, Grid3X3, ArrowDown } from 'lucide-react';

interface Mesh3DViewerProps {
  modelData: SAP2000ModelData;
  geometry: CulvertGeometry;
  railway: RailwayLoadingParams;
}

export const Mesh3DViewer: React.FC<Mesh3DViewerProps> = ({
  modelData,
  geometry,
  railway,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showNodes, setShowNodes] = useState(false);
  const [showSprings, setShowSprings] = useState(true);
  const [showLoads, setShowLoads] = useState(true);

  // References for animation and controls
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const culvertGroupRef = useRef<THREE.Group | null>(null);

  // Orbit state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.45, y: -0.65 });
  const distanceRef = useRef(Math.max(geometry.clearSpan, geometry.totalLength) * 1.6);
  const targetRef = useRef(new THREE.Vector3(0, geometry.clearHeight / 2, geometry.totalLength / 2));

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1120'); // Dark slate CAD background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.4);
    dirLight2.position.set(-20, 10, -20);
    scene.add(dirLight2);

    // 3. Coordinate Axes Helper & Grid
    const gridHelper = new THREE.GridHelper(geometry.totalLength + 10, 20, 0x3b82f6, 0x1e293b);
    gridHelper.position.set(0, -0.05, geometry.totalLength / 2);
    scene.add(gridHelper);

    // 4. Culvert Mesh Geometry Group
    const culvertGroup = new THREE.Group();
    culvertGroupRef.current = culvertGroup;
    scene.add(culvertGroup);

    // Material definitions
    const matTop = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const matBottom = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const matWall = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const jointMap = new Map<number, { x: number; y: number; z: number }>();
    modelData.joints.forEach((j) => jointMap.set(j.id, { x: j.x, y: j.y, z: j.z }));

    // Build Shell Meshes
    modelData.shells.forEach((shell) => {
      const p1 = jointMap.get(shell.jointIds[0])!;
      const p2 = jointMap.get(shell.jointIds[1])!;
      const p3 = jointMap.get(shell.jointIds[2])!;
      const p4 = jointMap.get(shell.jointIds[3])!;

      if (!p1 || !p2 || !p3 || !p4) return;

      const geom = new THREE.BufferGeometry();
      // SAP2000: X (transverse), Y (longitudinal), Z (elevation)
      // Three.js: X (transverse), Y (elevation), Z (longitudinal)
      const vertices = new Float32Array([
        p1.x, p1.z, p1.y,
        p2.x, p2.z, p2.y,
        p3.x, p3.z, p3.y,

        p1.x, p1.z, p1.y,
        p3.x, p3.z, p3.y,
        p4.x, p4.z, p4.y,
      ]);

      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      let chosenMat = matTop;
      if (shell.part === 'bottom') chosenMat = matBottom;
      if (shell.part === 'left' || shell.part === 'right') chosenMat = matWall;

      const mesh = new THREE.Mesh(geom, chosenMat);
      culvertGroup.add(mesh);

      // Shell wireframe border
      if (showWireframe) {
        const wireGeom = new THREE.BufferGeometry();
        const wireVertices = new Float32Array([
          p1.x, p1.z, p1.y,
          p2.x, p2.z, p2.y,
          p2.x, p2.z, p2.y,
          p3.x, p3.z, p3.y,
          p3.x, p3.z, p3.y,
          p4.x, p4.z, p4.y,
          p4.x, p4.z, p4.y,
          p1.x, p1.z, p1.y,
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wireVertices, 3));
        const line = new THREE.LineSegments(
          wireGeom,
          new THREE.LineBasicMaterial({ color: 0x93c5fd, linewidth: 1, transparent: true, opacity: 0.6 })
        );
        culvertGroup.add(line);
      }
    });

    // 5. Node Points
    if (showNodes) {
      const nodeGeom = new THREE.BufferGeometry();
      const nodePositions: number[] = [];
      modelData.joints.forEach((j) => {
        nodePositions.push(j.x, j.z, j.y);
      });
      nodeGeom.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
      const nodeMat = new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.12 });
      const nodePoints = new THREE.Points(nodeGeom, nodeMat);
      culvertGroup.add(nodePoints);
    }

    // 6. Springs under Bottom Slab
    if (showSprings) {
      const springGroup = new THREE.Group();
      modelData.springs.forEach((sp) => {
        const j = jointMap.get(sp.jointId);
        if (!j) return;
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(j.x, j.z, j.y),
          new THREE.Vector3(j.x, j.z - 0.45, j.y),
        ]);
        const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
        springGroup.add(line);

        const coneGeom = new THREE.ConeGeometry(0.06, 0.15, 6);
        const coneMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(j.x, j.z - 0.45, j.y);
        cone.rotation.x = Math.PI;
        springGroup.add(cone);
      });
      culvertGroup.add(springGroup);
    }

    // 7. Railway Rails & UIC 71 Load Vectors
    const hCenter = geometry.clearHeight + (geometry.topSlabThickness + geometry.bottomSlabThickness) / 2;
    const topSlabZ = hCenter;

    if (showLoads) {
      const railGroup = new THREE.Group();
      // Rails running along Y
      const railSpacing = 1.435;
      [-railSpacing / 2, railSpacing / 2].forEach((xOffset) => {
        const railGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(xOffset, topSlabZ + railway.fillHeight, -1),
          new THREE.Vector3(xOffset, topSlabZ + railway.fillHeight, geometry.totalLength + 1),
        ]);
        const railLine = new THREE.Line(
          railGeom,
          new THREE.LineBasicMaterial({ color: 0xcbd5e1, linewidth: 2 })
        );
        railGroup.add(railLine);
      });

      // UIC 71 Train Load Arrows
      const axlePositions = [2.0, 3.6, 5.2, 6.8];
      axlePositions.forEach((yPos) => {
        if (yPos <= geometry.totalLength) {
          [-railSpacing / 2, railSpacing / 2].forEach((xPos) => {
            const arrow = new THREE.ArrowHelper(
              new THREE.Vector3(0, -1, 0),
              new THREE.Vector3(xPos, topSlabZ + railway.fillHeight + 1.2, yPos),
              1.0,
              0xef4444,
              0.3,
              0.15
            );
            railGroup.add(arrow);
          });
        }
      });
      culvertGroup.add(railGroup);
    }

    // Mouse Drag Controls
    const updateCameraPosition = () => {
      const phi = rotationRef.current.x;
      const theta = rotationRef.current.y;
      const dist = distanceRef.current;

      camera.position.x = targetRef.current.x + dist * Math.sin(theta) * Math.cos(phi);
      camera.position.y = targetRef.current.y + dist * Math.sin(phi);
      camera.position.z = targetRef.current.z + dist * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(targetRef.current);
    };

    updateCameraPosition();

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      rotationRef.current.y += deltaX * 0.008;
      rotationRef.current.x = Math.max(
        0.05,
        Math.min(Math.PI / 2 - 0.05, rotationRef.current.x + deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distanceRef.current = Math.max(3, Math.min(60, distanceRef.current + e.deltaY * 0.02));
      updateCameraPosition();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [modelData, geometry, railway, showWireframe, showNodes, showSprings, showLoads]);

  const resetView = () => {
    rotationRef.current = { x: 0.45, y: -0.65 };
    distanceRef.current = Math.max(geometry.clearSpan, geometry.totalLength) * 1.6;
    if (cameraRef.current) {
      const phi = rotationRef.current.x;
      const theta = rotationRef.current.y;
      const dist = distanceRef.current;
      cameraRef.current.position.x = targetRef.current.x + dist * Math.sin(theta) * Math.cos(phi);
      cameraRef.current.position.y = targetRef.current.y + dist * Math.sin(phi);
      cameraRef.current.position.z = targetRef.current.z + dist * Math.cos(theta) * Math.cos(phi);
      cameraRef.current.lookAt(targetRef.current);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs shrink-0 z-10">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold text-white">3B SAP2000 Kabuk (Shell) Sonlu Eleman Mesh Ağı</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono">
            {modelData.totalNodes} Düğüm / {modelData.totalShells} Kabuk Eleman
          </span>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showWireframe ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Ağ Çizgileri</span>
          </button>

          <button
            onClick={() => setShowNodes(!showNodes)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showNodes ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Düğümler</span>
          </button>

          <button
            onClick={() => setShowSprings(!showSprings)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showSprings ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Zemin Yayları</span>
          </button>

          <button
            onClick={() => setShowLoads(!showLoads)}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              showLoads ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>UIC 71 Dingil Yükleri</span>
          </button>

          <button
            onClick={resetView}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded ml-1"
            title="Kamera Açısını Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom Floating Legend / Stats */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-xs border border-slate-800 rounded-lg p-3 text-xs text-slate-300 shadow-xl pointer-events-none flex flex-col gap-1.5 font-mono">
        <div className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">
          SAP2000 Model Özeti
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Düğüm Noktası (Joints):</span>
          <span className="font-semibold text-white">{modelData.totalNodes} adet</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Kabuk Eleman (Shells):</span>
          <span className="font-semibold text-blue-400">{modelData.totalShells} adet</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Taban Zemin Yayları:</span>
          <span className="font-semibold text-sky-400">{modelData.totalSprings} adet</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Yük Kombinasyonları:</span>
          <span className="font-semibold text-emerald-400">{modelData.combinations.length} adet</span>
        </div>
        <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-500">
          Sol tık: Döndür · Sağ tık: Kaydır · Tekerlek: Yakınlaş
        </div>
      </div>
    </div>
  );
};
