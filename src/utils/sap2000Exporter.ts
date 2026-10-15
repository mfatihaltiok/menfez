/**
 * SAP2000 Shell Finite Element Mesh Generator & .s2k Script Exporter
 * Generates Joints, Shell Connectivity, Winkler Springs, Area Loads, and Combinations
 */

import {
  CulvertGeometry,
  RailwayLoadingParams,
  SoilAndMaterialParams,
  UIC71CalculatedLoads,
  SAPJoint,
  SAPShellElement,
  SAPJointSpring,
  SAPAreaLoad,
  SAPLoadCombination,
  SAP2000ModelData,
} from '../types/culvert';

export function generateSAP2000Model(
  geo: CulvertGeometry,
  rail: RailwayLoadingParams,
  soil: SoilAndMaterialParams,
  calculatedLoads: UIC71CalculatedLoads,
  meshTargetSize: number = 0.50
): SAP2000ModelData {
  const bCenter = geo.clearSpan + geo.sideWallThickness;
  const hCenter = geo.clearHeight + (geo.topSlabThickness + geo.bottomSlabThickness) / 2;
  const culvertLength = geo.totalLength;

  const xMin = -bCenter / 2;
  const xMax = bCenter / 2;
  const zMin = 0;
  const zMax = hCenter;

  // Bölüntü sayıları
  const nx = Math.max(Math.round(bCenter / meshTargetSize), 4);
  const nz = Math.max(Math.round(hCenter / meshTargetSize), 3);
  const ny = Math.max(Math.round(culvertLength / meshTargetSize), 4);

  const dx = bCenter / nx;
  const dz = hCenter / nz;
  const dy = culvertLength / ny;

  // Düğüm koordinatları
  const joints: SAPJoint[] = [];
  const jointMap = new Map<string, number>();

  function getOrAddJoint(x: number, y: number, z: number, isBottom: boolean = false): number {
    const key = `${x.toFixed(3)}_${y.toFixed(3)}_${z.toFixed(3)}`;
    if (jointMap.has(key)) {
      return jointMap.get(key)!;
    }
    const newId = joints.length + 1;
    joints.push({
      id: newId,
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      z: Number(z.toFixed(3)),
      isBottom,
      tributaryArea: 0,
    });
    jointMap.set(key, newId);
    return newId;
  }

  const shells: SAPShellElement[] = [];
  let shellIdCounter = 1;

  // 1. Taban Plağı (Z = zMin, X: xMin -> xMax, Y: 0 -> culvertLength)
  for (let j = 0; j < ny; j++) {
    const y0 = j * dy;
    const y1 = (j + 1) * dy;
    for (let i = 0; i < nx; i++) {
      const x0 = xMin + i * dx;
      const x1 = xMin + (i + 1) * dx;

      const j1 = getOrAddJoint(x0, y0, zMin, true);
      const j2 = getOrAddJoint(x1, y0, zMin, true);
      const j3 = getOrAddJoint(x1, y1, zMin, true);
      const j4 = getOrAddJoint(x0, y1, zMin, true);

      shells.push({
        id: shellIdCounter++,
        section: 'SHELL_BOT',
        jointIds: [j1, j2, j3, j4],
        part: 'bottom',
        centerZ: zMin,
        area: dx * dy,
      });
    }
  }

  // 2. Üst Plak (Z = zMax, X: xMin -> xMax, Y: 0 -> culvertLength)
  for (let j = 0; j < ny; j++) {
    const y0 = j * dy;
    const y1 = (j + 1) * dy;
    for (let i = 0; i < nx; i++) {
      const x0 = xMin + i * dx;
      const x1 = xMin + (i + 1) * dx;

      const j1 = getOrAddJoint(x0, y0, zMax, false);
      const j2 = getOrAddJoint(x1, y0, zMax, false);
      const j3 = getOrAddJoint(x1, y1, zMax, false);
      const j4 = getOrAddJoint(x0, y1, zMax, false);

      shells.push({
        id: shellIdCounter++,
        section: 'SHELL_TOP',
        jointIds: [j1, j2, j3, j4],
        part: 'top',
        centerZ: zMax,
        area: dx * dy,
      });
    }
  }

  // 3. Sol Yan Duvar (X = xMin, Z: zMin -> zMax, Y: 0 -> culvertLength)
  for (let j = 0; j < ny; j++) {
    const y0 = j * dy;
    const y1 = (j + 1) * dy;
    for (let k = 0; k < nz; k++) {
      const z0 = zMin + k * dz;
      const z1 = zMin + (k + 1) * dz;

      const j1 = getOrAddJoint(xMin, y0, z0, k === 0);
      const j2 = getOrAddJoint(xMin, y1, z0, k === 0);
      const j3 = getOrAddJoint(xMin, y1, z1, false);
      const j4 = getOrAddJoint(xMin, y0, z1, false);

      shells.push({
        id: shellIdCounter++,
        section: 'SHELL_WALL',
        jointIds: [j1, j2, j3, j4],
        part: 'left',
        centerZ: (z0 + z1) / 2,
        area: dy * dz,
      });
    }
  }

  // 4. Sağ Yan Duvar (X = xMax, Z: zMin -> zMax, Y: 0 -> culvertLength)
  for (let j = 0; j < ny; j++) {
    const y0 = j * dy;
    const y1 = (j + 1) * dy;
    for (let k = 0; k < nz; k++) {
      const z0 = zMin + k * dz;
      const z1 = zMin + (k + 1) * dz;

      const j1 = getOrAddJoint(xMax, y0, z0, k === 0);
      const j2 = getOrAddJoint(xMax, y0, z1, false);
      const j3 = getOrAddJoint(xMax, y1, z1, false);
      const j4 = getOrAddJoint(xMax, y1, z0, k === 0);

      shells.push({
        id: shellIdCounter++,
        section: 'SHELL_WALL',
        jointIds: [j1, j2, j3, j4],
        part: 'right',
        centerZ: (z0 + z1) / 2,
        area: dy * dz,
      });
    }
  }

  // 5. Taban Düğümlerinde Winkler Zemin Yayları (ks * Tributary Area)
  // Her taban düğümünün etkili zemin alanını hesapla
  for (const shell of shells) {
    if (shell.part === 'bottom') {
      const quarterArea = shell.area / 4;
      for (const jId of shell.jointIds) {
        const j = joints.find((item) => item.id === jId);
        if (j) {
          j.tributaryArea += quarterArea;
        }
      }
    }
  }

  const springs: SAPJointSpring[] = [];
  for (const joint of joints) {
    if (joint.isBottom && joint.tributaryArea > 0) {
      const kz = Number((soil.subgradeReactionModulus * joint.tributaryArea).toFixed(1));
      springs.push({
        jointId: joint.id,
        kZ: kz,
      });
    }
  }

  // 6. Kabuk Yüzey Yükleri (Area Loads)
  const loads: SAPAreaLoad[] = [];

  for (const shell of shells) {
    if (shell.part === 'top') {
      // Üst plak: Düşey Zemin ve UIC 71 Canlı Yük
      loads.push({
        shellId: shell.id,
        loadPattern: 'SOIL_VERT',
        direction: 'Gravity',
        value: calculatedLoads.qVerticalSoil,
      });
      loads.push({
        shellId: shell.id,
        loadPattern: 'UIC71_VERT',
        direction: 'Gravity',
        value: calculatedLoads.qVerticalLiveMax,
      });
    } else if (shell.part === 'left') {
      // Sol yan duvar: İçeri doğru (+X yönü) derinlikle artan zemin ve sürşarj itkisi
      const depthFromTop = zMax - shell.centerZ;
      const depthRatio = Math.max(0, Math.min(depthFromTop / hCenter, 1.0));
      const soilPressure = Number(
        (
          calculatedLoads.sigmaSoilTop +
          depthRatio * (calculatedLoads.sigmaSoilBottom - calculatedLoads.sigmaSoilTop)
        ).toFixed(2)
      );

      loads.push({
        shellId: shell.id,
        loadPattern: 'SOIL_LAT',
        direction: 'X',
        value: soilPressure,
      });
      loads.push({
        shellId: shell.id,
        loadPattern: 'UIC71_LAT',
        direction: 'X',
        value: calculatedLoads.sigmaLiveSurcharge,
      });
    } else if (shell.part === 'right') {
      // Sağ yan duvar: İçeri doğru (-X yönü) derinlikle artan zemin ve sürşarj itkisi
      const depthFromTop = zMax - shell.centerZ;
      const depthRatio = Math.max(0, Math.min(depthFromTop / hCenter, 1.0));
      const soilPressure = Number(
        (
          calculatedLoads.sigmaSoilTop +
          depthRatio * (calculatedLoads.sigmaSoilBottom - calculatedLoads.sigmaSoilTop)
        ).toFixed(2)
      );

      loads.push({
        shellId: shell.id,
        loadPattern: 'SOIL_LAT',
        direction: 'X',
        value: -soilPressure,
      });
      loads.push({
        shellId: shell.id,
        loadPattern: 'UIC71_LAT',
        direction: 'X',
        value: -calculatedLoads.sigmaLiveSurcharge,
      });
    }
  }

  // 7. Yük Kombinasyonları (TCDD / TS 500 / EN 1990 ULS ve SLS Kombinasyonları)
  const loadPatterns = ['DEAD', 'SOIL_VERT', 'SOIL_LAT', 'UIC71_VERT', 'UIC71_LAT'];
  const combinations: SAPLoadCombination[] = [
    {
      name: 'ULS1_MAX_VERT',
      type: 'Linear Add',
      description: '1.35G + 1.35H + 1.45Q (Maksimum Düşey ve UIC 71 Canlı Yük)',
      factors: {
        DEAD: 1.35,
        SOIL_VERT: 1.35,
        SOIL_LAT: 1.35,
        UIC71_VERT: 1.45,
        UIC71_LAT: 1.45,
      },
    },
    {
      name: 'ULS2_MAX_LAT',
      type: 'Linear Add',
      description: '1.00G + 1.00H_vert + 1.35H_lat + 1.45Q_lat (Maksimum Yanal İtki)',
      factors: {
        DEAD: 1.0,
        SOIL_VERT: 1.0,
        SOIL_LAT: 1.35,
        UIC71_VERT: 0.0,
        UIC71_LAT: 1.45,
      },
    },
    {
      name: 'ULS3_PERMANENT',
      type: 'Linear Add',
      description: '1.35G + 1.35H (Yalnız Zati ve Toprak Yükü - Tren Yok)',
      factors: {
        DEAD: 1.35,
        SOIL_VERT: 1.35,
        SOIL_LAT: 1.35,
        UIC71_VERT: 0.0,
        UIC71_LAT: 0.0,
      },
    },
    {
      name: 'SLS_CHAR',
      type: 'Linear Add',
      description: '1.00G + 1.00H + 1.00Q (Karakteristik Servis Kombinasyonu)',
      factors: {
        DEAD: 1.0,
        SOIL_VERT: 1.0,
        SOIL_LAT: 1.0,
        UIC71_VERT: 1.0,
        UIC71_LAT: 1.0,
      },
    },
    {
      name: 'SLS_PERM',
      type: 'Linear Add',
      description: '1.00G + 1.00H + 0.50Q (Kalıcı Servis ve Çatlak Kontrolü)',
      factors: {
        DEAD: 1.0,
        SOIL_VERT: 1.0,
        SOIL_LAT: 1.0,
        UIC71_VERT: 0.5,
        UIC71_LAT: 0.5,
      },
    },
    {
      name: 'ULS_ENVELOPE',
      type: 'Envelope',
      description: 'Tasarım Zarfı (Tüm ULS Kombinasyonları Max Zarfı)',
      factors: {
        ULS1_MAX_VERT: 1.0,
        ULS2_MAX_LAT: 1.0,
        ULS3_PERMANENT: 1.0,
      },
    },
  ];

  // 8. SAP2000 .s2k Script Metnini Oluştur
  const s2kScript = generateS2KScriptContent(
    geo,
    soil,
    joints,
    shells,
    springs,
    loads,
    combinations,
    loadPatterns
  );

  return {
    joints,
    shells,
    springs,
    loads,
    combinations,
    loadPatterns,
    totalNodes: joints.length,
    totalShells: shells.length,
    totalSprings: springs.length,
    s2kScript,
  };
}

function generateS2KScriptContent(
  geo: CulvertGeometry,
  soil: SoilAndMaterialParams,
  joints: SAPJoint[],
  shells: SAPShellElement[],
  springs: SAPJointSpring[],
  loads: SAPAreaLoad[],
  combinations: SAPLoadCombination[],
  loadPatterns: string[]
): string {
  const lines: string[] = [];
  const safeMatName = `CONC_${soil.concreteGrade.replace('/', '_')}`;

  // 1. SAP2000 PROGRAM CONTROL (Dosyanın EN BAŞINDA 1. SATIRDA OLMALIDIR - SAP2000 Parser kuralı)
  lines.push('TABLE:  "PROGRAM CONTROL"');
  lines.push('   ProgramName=SAP2000   Version=26.3.0   ProgLevel=Ultimate   CurrUnits="KN, m, C"');
  lines.push('');

  // 2. Aktif Serbestlik Dereceleri (3B Kabuk Modeli için 6 DOF)
  lines.push('TABLE:  "ACTIVE DEGREES OF FREEDOM"');
  lines.push('   UX=Yes   UY=Yes   UZ=Yes   RX=Yes   RY=Yes   RZ=Yes');
  lines.push('');

  // 3. Malzeme Özellikleri - Genel (Type=Isotropic ve DesignType=Concrete standart CSI formatı)
  lines.push('TABLE:  "MATERIAL PROPERTIES 01 - GENERAL"');
  lines.push(`   Material="${safeMatName}"   Type=Isotropic   DesignType=Concrete   UnitWeight=${soil.concreteUnitWeight}   UnitMass=2.548`);
  lines.push('');

  // 4. Malzeme Özellikleri - Temel Mekanik
  lines.push('TABLE:  "MATERIAL PROPERTIES 02 - BASIC MECHANICAL"');
  let eMod = 32000000;
  if (soil.concreteGrade === 'C25/30') eMod = 30000000;
  if (soil.concreteGrade === 'C35/45') eMod = 34000000;
  if (soil.concreteGrade === 'C40/50') eMod = 35000000;
  lines.push(`   Material="${safeMatName}"   Unit1="KN, m, C"   E1=${eMod}   Poisson=0.20   ThermCoeff=1.0E-05`);
  lines.push('');

  // 5. Kabuk Kesit Özellikleri (Type="Shell-Thin" eklenmelidir, aksi halde SAP2000 kesiti kabul etmez)
  lines.push('TABLE:  "AREA SECTION PROPERTIES"');
  lines.push(`   Section="SHELL_TOP"   MatProp="${safeMatName}"   AreaType=Shell   Type="Shell-Thin"   Thickness=${geo.topSlabThickness}   BendThick=${geo.topSlabThickness}   Color=Blue`);
  lines.push(`   Section="SHELL_BOT"   MatProp="${safeMatName}"   AreaType=Shell   Type="Shell-Thin"   Thickness=${geo.bottomSlabThickness}   BendThick=${geo.bottomSlabThickness}   Color=Cyan`);
  lines.push(`   Section="SHELL_WALL"  MatProp="${safeMatName}"   AreaType=Shell   Type="Shell-Thin"   Thickness=${geo.sideWallThickness}   BendThick=${geo.sideWallThickness}   Color=Magenta`);
  lines.push('');

  // 6. Düğüm Noktası Koordinatları (SpecialJt=No SAP2000 standardı)
  lines.push('TABLE:  "JOINT COORDINATES"');
  for (const j of joints) {
    lines.push(`   Joint=${j.id}   CoordSys=GLOBAL   CoordType=Cartesian   XorR=${j.x}   Y=${j.y}   Z=${j.z}   SpecialJt=No`);
  }
  lines.push('');

  // 7. Kabuk Eleman Bağlantıları (NumJoints=4 ve Joint1..Joint4 - Section bu tabloda DEĞİL, AREA SECTION ASSIGNMENTS tablosundadır)
  lines.push('TABLE:  "CONNECTIVITY - AREA"');
  for (const s of shells) {
    lines.push(
      `   Area=${s.id}   NumJoints=4   Joint1=${s.jointIds[0]}   Joint2=${s.jointIds[1]}   Joint3=${s.jointIds[2]}   Joint4=${s.jointIds[3]}`
    );
  }
  lines.push('');

  // 8. Kabuk Eleman Kesit Atamaları (200 uyarının ana sebebi bu tablonun eksik olmasıdır)
  lines.push('TABLE:  "AREA SECTION ASSIGNMENTS"');
  for (const s of shells) {
    lines.push(`   Area=${s.id}   Section="${s.section}"`);
  }
  lines.push('');

  // 9. Düğüm Mesnetleri (Rijit gövde ötelenmesini engellemek için sol-alt düğümde U1 ve U2 sabitlemesi)
  lines.push('TABLE:  "JOINT RESTRAINT ASSIGNMENTS"');
  lines.push('   Joint=1   U1=Yes   U2=Yes   U3=No   R1=No   R2=No   R3=No');
  lines.push('');

  // 10. Zemin Winkler Yayları (Doğru tablo adı: JOINT SPRING ASSIGNMENTS 1 - UNCOUPLED)
  lines.push('TABLE:  "JOINT SPRING ASSIGNMENTS 1 - UNCOUPLED"');
  for (const sp of springs) {
    lines.push(
      `   Joint=${sp.jointId}   CoordSys=GLOBAL   U1=${(sp.kZ * 0.1).toFixed(1)}   U2=${(sp.kZ * 0.1).toFixed(1)}   U3=${sp.kZ}   R1=0   R2=0   R3=0`
    );
  }
  lines.push('');

  // 11. Yük Patern Tanımları
  lines.push('TABLE:  "LOAD PATTERN DEFINITIONS"');
  lines.push('   LoadPat=DEAD   DesignType=Dead   SelfWtMult=1');
  lines.push('   LoadPat=SOIL_VERT   DesignType=Other   SelfWtMult=0');
  lines.push('   LoadPat=SOIL_LAT    DesignType=Other   SelfWtMult=0');
  lines.push('   LoadPat=UIC71_VERT  DesignType=Live    SelfWtMult=0');
  lines.push('   LoadPat=UIC71_LAT   DesignType=Live    SelfWtMult=0');
  lines.push('');

  // 12. Yük Durumu (Load Case) Tanımları (Kombinasyonların SAP2000'de hata vermemesi için zorunludur)
  lines.push('TABLE:  "LOAD CASE DEFINITIONS"');
  lines.push('   Case=DEAD   Type="Linear Static"   InitialCond="Zero"');
  lines.push('   Case=SOIL_VERT   Type="Linear Static"   InitialCond="Zero"');
  lines.push('   Case=SOIL_LAT   Type="Linear Static"   InitialCond="Zero"');
  lines.push('   Case=UIC71_VERT   Type="Linear Static"   InitialCond="Zero"');
  lines.push('   Case=UIC71_LAT   Type="Linear Static"   InitialCond="Zero"');
  lines.push('');

  // 13. Yük Durumu - Statik Yük Atamaları (Paternleri Durumlara Eşleme)
  lines.push('TABLE:  "CASE - STATIC 1 - LOAD ASSIGNMENTS"');
  lines.push('   Case=DEAD   LoadType="Load pattern"   LoadName=DEAD   LoadSF=1');
  lines.push('   Case=SOIL_VERT   LoadType="Load pattern"   LoadName=SOIL_VERT   LoadSF=1');
  lines.push('   Case=SOIL_LAT   LoadType="Load pattern"   LoadName=SOIL_LAT   LoadSF=1');
  lines.push('   Case=UIC71_VERT   LoadType="Load pattern"   LoadName=UIC71_VERT   LoadSF=1');
  lines.push('   Case=UIC71_LAT   LoadType="Load pattern"   LoadName=UIC71_LAT   LoadSF=1');
  lines.push('');

  // 14. Kabuk Yüzey Yükleri (SAP2000 kolonu: UnifLoad, Dir=Gravity veya Dir=X)
  lines.push('TABLE:  "AREA LOADS - UNIFORM"');
  for (const l of loads) {
    lines.push(
      `   Area=${l.shellId}   LoadPat=${l.loadPattern}   CoordSys=GLOBAL   Dir=${l.direction}   UnifLoad=${l.value}`
    );
  }
  lines.push('');

  // 15. Yük Kombinasyonları (Tüm ULS ve SLS Kombinasyonları ve ULS Zarfı)
  lines.push('TABLE:  "COMBINATION DEFINITIONS"');
  for (const combo of combinations) {
    if (combo.type === 'Linear Add') {
      for (const [pat, factor] of Object.entries(combo.factors)) {
        if (factor > 0) {
          lines.push(
            `   ComboName="${combo.name}"   ComboType="Linear Add"   AutoDesign=No   CaseType="Linear Static"   CaseName="${pat}"   ScaleFactor=${factor}`
          );
        }
      }
    } else if (combo.type === 'Envelope') {
      for (const [subCombo, factor] of Object.entries(combo.factors)) {
        lines.push(
          `   ComboName="${combo.name}"   ComboType="Envelope"   AutoDesign=No   CaseType="Combination"   CaseName="${subCombo}"   ScaleFactor=${factor}`
        );
      }
    }
  }
  lines.push('');
  lines.push('END TABLE DATA');

  // Windows CR-LF formatı (\r\n) ile satır sonlandırma
  return lines.join('\r\n');
}
