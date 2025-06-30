"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Ruler,
  MessageSquare,
  RotateCcw,
  Calculator,
  Plus,
  Target,
} from "lucide-react";
import type { BIMModel as DBBIMModel, TakeoffItem } from "@/app/types";

// Define interfaces locally to avoid import conflicts
interface BIMModel {
  id: number;
  name: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadDate: Date;
  uploadedBy?: number;
  version?: string;
  revitVersion?: string;
  ifcSchema?: string;
  projectId?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  isActive: boolean;
  metadata?: any;
}

// Local BIMElement interface with proper typing for this component
interface LocalBIMElement {
  id: number;
  modelId: number;
  ifcId: string;
  elementType: string | null;
  elementName: string | null;
  level: string | null;
  material: string | null;
  properties: Record<string, any> | null;
  geometryData: Record<string, any> | null;
  createdAt: Date;
}

interface BIMViewerProps {
  model: BIMModel;
  onElementSelect?: (element: LocalBIMElement, position: THREE.Vector3) => void;
  onAddToTakeoff?: (element: LocalBIMElement) => void;
  onAddComment?: (position: THREE.Vector3, element?: LocalBIMElement) => void;
  selectedElements?: number[]; // For highlighting takeoff items
  comments?: Array<{
    id: number;
    position: THREE.Vector3;
    text: string;
    status: string;
  }>;
}

interface ViewerMode {
  type: "view" | "takeoff" | "comment";
  active: boolean;
}

export default function EnhancedBIMViewer({
  model,
  onElementSelect,
  onAddToTakeoff,
  onAddComment,
  selectedElements = [],
  comments = [],
}: BIMViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef<THREE.Vector2>();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedElement, setSelectedElement] =
    useState<LocalBIMElement | null>(null);
  const [viewerMode, setViewerMode] = useState<ViewerMode>({
    type: "view",
    active: false,
  });
  const [showProperties, setShowProperties] = useState(false);
  const [curtainWallElements, setCurtainWallElements] = useState<
    THREE.Object3D[]
  >([]);

  // Enhanced material creation functions
  const createMaterials = useCallback(() => {
    return {
      // Enhanced aluminum material with better depth definition
      aluminum: new THREE.MeshPhysicalMaterial({
        color: 0xc8c8c8, // Slightly darker for better contrast
        metalness: 0.9,
        roughness: 0.2, // Slightly rougher for more definition
        clearcoat: 0.5,
        clearcoatRoughness: 0.05,
        envMapIntensity: 0.8,
        reflectivity: 0.6,
      }),

      // Enhanced glass materials - more transparent and realistic
      outerGlass: new THREE.MeshPhysicalMaterial({
        color: 0xf0f8ff, // Very light blue tint
        transparent: true,
        opacity: 0.15, // Much more transparent
        transmission: 0.9, // High transmission for realistic glass
        thickness: 0.006, // 6mm glass thickness
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        ior: 1.52, // Index of refraction for glass
        envMapIntensity: 1.0,
        side: THREE.DoubleSide,
      }),

      middleGlass: new THREE.MeshPhysicalMaterial({
        color: 0xf5f5ff, // Neutral tint
        transparent: true,
        opacity: 0.12,
        transmission: 0.9,
        thickness: 0.006,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        ior: 1.52,
        envMapIntensity: 1.0,
        side: THREE.DoubleSide,
      }),

      innerGlass: new THREE.MeshPhysicalMaterial({
        color: 0xf8fff8, // Very slight green tint for Low-E
        transparent: true,
        opacity: 0.12,
        transmission: 0.85, // Slightly less transmission for Low-E coating
        thickness: 0.006,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        ior: 1.52,
        envMapIntensity: 1.0,
        side: THREE.DoubleSide,
      }),

      // Enhanced structural silicone - darker and more defined
      structuralSeal: new THREE.MeshLambertMaterial({
        color: 0x1a1a1a, // Darker black
        // roughness: 0.9,
        // metalness: 0.0,
      }),
    };
  }, []);

  // Initialize Three.js scene with enhanced lighting
  const initThreeJS = useCallback(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa); // Lighter background like Revit
    scene.fog = new THREE.Fog(0xf8f9fa, 50, 200); // Add some atmospheric perspective
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60, // Slightly narrower FOV for more realistic perspective
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 15);
    cameraRef.current = camera;

    // Enhanced renderer setup with fallback options
    let renderer: THREE.WebGLRenderer;
    try {
      // Try with high-performance settings first
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.warn(
        "Failed to create high-performance WebGL context, trying with default settings:",
        error
      );
      try {
        // Fallback to basic settings
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
        });
      } catch (fallbackError) {
        console.error("Failed to create WebGL context:", fallbackError);
        // Show error message to user instead of crashing
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #666; text-align: center; padding: 20px;">
              <div>
                <h3>WebGL Not Available</h3>
                <p>Your browser or graphics card doesn't support WebGL.</p>
                <p>Please try:</p>
                <ul style="text-align: left; margin-top: 10px;">
                  <li>Updating your browser</li>
                  <li>Enabling hardware acceleration</li>
                  <li>Using a different browser (Chrome, Firefox, Edge)</li>
                </ul>
              </div>
            </div>
          `;
        }
        return;
      }
    }

    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance

    // Enhanced renderer settings for better materials (with error handling)
    try {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2; // Brighter exposure
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch (error) {
      console.warn("Some advanced renderer features not available:", error);
      // Continue with basic rendering
    }

    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup for better element definition

    // Reduced ambient light to increase contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Reduced from 0.6
    scene.add(ambientLight);

    // Main directional light with stronger shadows
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(50, 80, 50);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 4096; // Higher resolution shadows
    directionalLight1.shadow.mapSize.height = 4096;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 500;
    directionalLight1.shadow.camera.left = -50;
    directionalLight1.shadow.camera.right = 50;
    directionalLight1.shadow.camera.top = 50;
    directionalLight1.shadow.camera.bottom = -50;
    directionalLight1.shadow.bias = -0.0005; // Stronger shadow bias
    directionalLight1.shadow.normalBias = 0.02;
    scene.add(directionalLight1);

    // Secondary directional light for fill lighting (reduced)
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3); // Reduced from 0.6
    directionalLight2.position.set(-30, 40, -30);
    scene.add(directionalLight2);

    // Reduced hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x98fb98, 0.2); // Reduced from 0.4
    scene.add(hemisphereLight);

    // Add some point lights for interior illumination (reduced)
    const pointLight1 = new THREE.PointLight(0xffffff, 0.3, 100); // Reduced from 0.5
    pointLight1.position.set(0, 10, 0);
    scene.add(pointLight1);

    // Enhanced grid helper - lighter and more subtle
    const gridHelper = new THREE.GridHelper(50, 50, 0xe0e0e0, 0xf0f0f0);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);

    // Environment map for reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(
      new THREE.Scene().add(
        new THREE.Mesh(
          new THREE.SphereGeometry(100),
          new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide })
        )
      )
    ).texture;
    scene.environment = envTexture;

    // Raycaster for picking
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Enhanced OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03; // Smoother damping
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.zoomSpeed = 0.8;
    controls.rotateSpeed = 0.5;
    controls.panSpeed = 0.8;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, []);

  // Enhanced curtain wall system with better materials
  const createCurtainWallSystem = useCallback(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const elements: THREE.Object3D[] = [];
    const materials = createMaterials();

    // Main curtain wall group
    const curtainWallGroup = new THREE.Group();
    curtainWallGroup.name = "CurtainWall_Building_A";

    // CURTAIN WALL DIMENSIONS (all in meters)
    const panelWidth = 1.2;
    const panelHeight = 1.0;
    const wallWidth = 7;
    const wallHeight = 3;
    const baseHeight = 0.5;

    // Enhanced mullion geometry with more detail
    const createMullionGeometry = () => {
      const shape = new THREE.Shape();
      // More detailed T-shaped profile
      shape.moveTo(-0.03, -0.03);
      shape.lineTo(0.03, -0.03);
      shape.lineTo(0.03, -0.01);
      shape.lineTo(0.015, -0.01);
      shape.lineTo(0.015, 0.03);
      shape.lineTo(-0.015, 0.03);
      shape.lineTo(-0.015, -0.01);
      shape.lineTo(-0.03, -0.01);
      shape.lineTo(-0.03, -0.03);

      return new THREE.ExtrudeGeometry(shape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.002,
        bevelSize: 0.002,
        bevelSegments: 2,
      });
    };

    const mullionGeometry = createMullionGeometry();

    // Create edge material for better definition
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x999999,
      linewidth: 2,
      transparent: true,
      opacity: 0.6,
    });

    // VERTICAL MULLIONS with enhanced materials
    for (let i = 0; i <= wallWidth; i++) {
      const mullion = new THREE.Mesh(mullionGeometry, materials.aluminum);
      const xPos = i * panelWidth - (wallWidth * panelWidth) / 2;
      const yPos = baseHeight + (wallHeight * panelHeight) / 2;

      mullion.position.set(xPos, yPos, 0);
      mullion.rotation.x = Math.PI / 2;
      mullion.scale.set(1, (wallHeight * panelHeight) / 0.06, 1);
      mullion.castShadow = true;
      mullion.receiveShadow = true;

      mullion.userData = {
        elementType: "Mullion",
        elementName: `Vertical Mullion VM-${i + 1}`,
        material: "Aluminum 6063-T6",
        category: "Framing",
        properties: {
          profile: "Custom T-Profile 60x60x4mm",
          length: `${(wallHeight * panelHeight * 1000).toFixed(0)}mm`,
          finish: "Mill Anodized",
          thermalBreak: true,
          weight: "3.2 kg/m",
          cost: 52.5,
        },
        quantities: {
          length: wallHeight * panelHeight,
          unit: "LM",
        },
      };

      curtainWallGroup.add(mullion);
      elements.push(mullion);

      // Add edge lines for better mullion definition
      // const edgesGeometry = new THREE.EdgesGeometry(mullionGeometry);
      // const edgeLine = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      // edgeLine.position.copy(mullion.position);
      // edgeLine.rotation.copy(mullion.rotation);
      // edgeLine.scale.copy(mullion.scale);
      // curtainWallGroup.add(edgeLine);

      // Add edge lines for better mullion definition
      const edgesGeometry = new THREE.EdgesGeometry(mullionGeometry);
      const edgeLine = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      edgeLine.position.copy(mullion.position);
      edgeLine.rotation.copy(mullion.rotation);
      edgeLine.scale.copy(mullion.scale);
      curtainWallGroup.add(edgeLine);
    }

    // HORIZONTAL MULLIONS with enhanced materials
    for (let i = 0; i <= wallHeight; i++) {
      const mullion = new THREE.Mesh(mullionGeometry, materials.aluminum);
      const xPos = 0;
      const yPos = baseHeight + i * panelHeight;

      mullion.position.set(xPos, yPos, 0);
      mullion.rotation.z = Math.PI / 2;
      mullion.rotation.x = Math.PI / 2;
      mullion.scale.set(1, (wallWidth * panelWidth) / 0.06, 1);
      mullion.castShadow = true;
      mullion.receiveShadow = true;

      mullion.userData = {
        elementType: "Mullion",
        elementName: `Horizontal Mullion HM-${i + 1}`,
        material: "Aluminum 6063-T6",
        category: "Framing",
        properties: {
          profile: "Custom T-Profile 60x60x4mm",
          length: `${(wallWidth * panelWidth * 1000).toFixed(0)}mm`,
          finish: "Mill Anodized",
          thermalBreak: true,
          weight: "3.2 kg/m",
          cost: 147.0,
        },
        quantities: {
          length: wallWidth * panelWidth,
          unit: "LM",
        },
      };

      curtainWallGroup.add(mullion);
      elements.push(mullion);
    }

    // ENHANCED GLAZING UNITS with realistic triple glazing
    const glassGeometry = new THREE.PlaneGeometry(
      panelWidth * 0.85, // More space for mullions to be visible
      panelHeight * 0.85
    );

    for (let x = 0; x < wallWidth; x++) {
      for (let y = 0; y < wallHeight; y++) {
        const glassGroup = new THREE.Group();

        // Outer glass (Low-E coating)
        const outerGlass = new THREE.Mesh(glassGeometry, materials.outerGlass);
        outerGlass.position.z = 0.02;
        outerGlass.castShadow = true;
        outerGlass.receiveShadow = true;

        // Middle glass
        const middleGlass = new THREE.Mesh(
          glassGeometry,
          materials.middleGlass
        );
        middleGlass.position.z = 0.004;
        middleGlass.castShadow = true;
        middleGlass.receiveShadow = true;

        // Inner glass (Low-E coating)
        const innerGlass = new THREE.Mesh(glassGeometry, materials.innerGlass);
        innerGlass.position.z = -0.012;
        innerGlass.castShadow = true;
        innerGlass.receiveShadow = true;

        glassGroup.add(outerGlass, middleGlass, innerGlass);

        // Position glass in center of each panel
        const xPos = (x + 0.5) * panelWidth - (wallWidth * panelWidth) / 2;
        const yPos = baseHeight + (y + 0.5) * panelHeight;
        glassGroup.position.set(xPos, yPos, 0.02);

        glassGroup.userData = {
          elementType: "Glazing",
          elementName: `IGU-${x + 1}-${y + 1}`,
          material: "Triple Glazed Low-E",
          category: "Glazing",
          properties: {
            thickness: "36mm (6-12-6-12-6)",
            uValue: "0.6 W/m²K",
            solarHeatGainCoeff: 0.25,
            visibleTransmittance: 0.78,
            gassFill: "Argon",
            spacerType: "Warm Edge TGI",
            cost: 320.5,
          },
          quantities: {
            area: panelWidth * 0.88 * (panelHeight * 0.88),
            unit: "M2",
          },
        };

        curtainWallGroup.add(glassGroup);
        elements.push(glassGroup);
      }
    }

    // ENHANCED STRUCTURAL GLAZING SEALS
    const sealGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 12);

    for (let x = 0; x < wallWidth; x++) {
      for (let y = 0; y < wallHeight; y++) {
        const xPos = (x + 0.5) * panelWidth - (wallWidth * panelWidth) / 2;
        const yPos = baseHeight + (y + 0.5) * panelHeight;

        const sealPositions = [
          { x: xPos, y: yPos + panelHeight * 0.44, rotation: 0 },
          { x: xPos, y: yPos - panelHeight * 0.44, rotation: 0 },
          { x: xPos - panelWidth * 0.44, y: yPos, rotation: Math.PI / 2 },
          { x: xPos + panelWidth * 0.44, y: yPos, rotation: Math.PI / 2 },
        ];

        sealPositions.forEach((pos, index) => {
          const seal = new THREE.Mesh(sealGeometry, materials.structuralSeal);
          seal.position.set(pos.x, pos.y, 0.028);
          seal.rotation.z = pos.rotation;
          seal.castShadow = true;
          seal.receiveShadow = true;

          seal.userData = {
            elementType: "Seal",
            elementName: `Seal ${x + 1}-${y + 1}-${index + 1}`,
            material: "Structural Silicone",
            category: "Sealing",
            properties: {
              type: "Structural Glazing Seal",
              cureTime: "7 days",
              color: "Black",
              weatherSeal: true,
              cost: 15.75,
            },
            quantities: {
              length: index < 2 ? panelWidth * 0.88 : panelHeight * 0.88,
              unit: "LM",
            },
          };
          curtainWallGroup.add(seal);
          elements.push(seal);
        });
      }
    }

    scene.add(curtainWallGroup);
    setCurtainWallElements(elements);

    console.log(
      "🔥 Enhanced curtain wall system created with",
      elements.length,
      "elements"
    );
  }, [createMaterials]);

  // Enhanced IFC loading with material improvements
  const loadIFCModel = useCallback(async () => {
    if (!sceneRef.current) return;

    try {
      setIsLoading(true);

      if (model?.filePath && model.filePath.endsWith(".ifc")) {
        console.log("🔥 Attempting to load IFC file:", model.filePath);

        const components = new OBC.Components();
        const fragments = components.get(OBC.FragmentsManager);
        const ifcLoader = components.get(OBC.IfcLoader);

        await ifcLoader.setup();

        ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
        ifcLoader.settings.includeProperties = true;

        const excludedCategories = [
          WEBIFC.IFCTENDONANCHOR,
          WEBIFC.IFCREINFORCINGBAR,
          WEBIFC.IFCREINFORCINGELEMENT,
        ];
        for (const category of excludedCategories) {
          ifcLoader.settings.excludedCategories.add(category);
        }

        const response = await fetch(model.filePath);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch IFC file: ${response.status} ${response.statusText}`
          );
        }

        const buffer = await response.arrayBuffer();
        const ifcModel = await ifcLoader.load(new Uint8Array(buffer));

        // Debug: Let's see what's actually in the ifcModel
        console.log("🔥 IFC Model Structure:", ifcModel);
        console.log("🔥 IFC Model Type:", ifcModel.constructor.name);
        console.log("🔥 IFC Model Properties:", Object.keys(ifcModel));
        console.log("🔥 IFC Model Children Count:", ifcModel.children?.length);

        // Check if there are fragments or other data structures
        console.log("🔥 IFC Model userData:", ifcModel.userData);
        //console.log("🔥 IFC Model material:", ifcModel.userData;

        // Let's also check what the components contain
        console.log("🔥 Fragments Manager:", fragments);
        console.log("🔥 IFC Loader settings:", ifcLoader.settings);

        // Apply enhanced materials to IFC model elements
        const materials = createMaterials();

        // Create additional materials for IFC elements
        const ifcMaterials = {
          ...materials,
          // Enhanced curtain wall frame material
          curtainWallFrame: new THREE.MeshPhysicalMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.15,
            clearcoat: 0.6,
            clearcoatRoughness: 0.05,
            envMapIntensity: 0.8,
          }),
          // Lighter curtain panel material
          curtainPanel: new THREE.MeshPhysicalMaterial({
            color: 0xe8e8e8, // Much lighter color
            metalness: 0.7,
            roughness: 0.25,
            clearcoat: 0.4,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.9,
          }),
          // Enhanced window frame material
          windowFrame: new THREE.MeshPhysicalMaterial({
            color: 0xb8b8b8,
            metalness: 0.85,
            roughness: 0.2,
            clearcoat: 0.4,
            clearcoatRoughness: 0.08,
            envMapIntensity: 0.7,
          }),
          // Enhanced glazing material
          ifcGlazing: new THREE.MeshPhysicalMaterial({
            color: 0xf0f8ff,
            transparent: true,
            opacity: 0.12,
            transmission: 0.88,
            thickness: 0.024,
            roughness: 0.03,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            ior: 1.52,
            envMapIntensity: 1.0,
            side: THREE.DoubleSide,
          }),
        };

        let meshCount = 0;
        let totalChildren = 0;

        ifcModel.traverse((child: any) => {
          totalChildren++;

          if (child.isMesh) {
            meshCount++;

            // Detailed analysis of the first few meshes
            if (meshCount <= 3) {
              console.log(`🔍 Mesh ${meshCount} Analysis:`, {
                name: child.name,
                type: child.type,
                uuid: child.uuid,
                userData: child.userData,
                userDataKeys: Object.keys(child.userData || {}),
                material: {
                  type: child.material?.type,
                  name: child.material?.name,
                  color: child.material?.color,
                  transparent: child.material?.transparent,
                  opacity: child.material?.opacity,
                  metalness: child.material?.metalness,
                },
                geometry: {
                  type: child.geometry?.type,
                  vertexCount: child.geometry?.attributes?.position?.count,
                  hasNormals: !!child.geometry?.attributes?.normal,
                  hasUVs: !!child.geometry?.attributes?.uv,
                },
                parent: child.parent?.name || "no parent",
                children: child.children?.length || 0,
              });
            }

            // Since IFC metadata isn't available, use geometry and material analysis
            const geometry = child.geometry;
            const material = child.material;
            const elementName = child.name || "";

            // Legacy variable for any remaining references
            const ifcType = "";

            // Analyze geometry characteristics
            const vertexCount = geometry?.attributes?.position?.count || 0;
            const hasNormals = !!geometry?.attributes?.normal;
            const hasUVs = !!geometry?.attributes?.uv;

            // Analyze material characteristics
            const isTransparent = material?.transparent === true;
            const opacity = material?.opacity || 1.0;
            const isMetallic = (material?.metalness || 0) > 0.3;
            const materialColor = material?.color;

            let materialToApply = null;
            let elementType = "unknown";

            // Smart detection based on characteristics
            if (isTransparent || opacity < 0.9) {
              // Transparent materials are likely glazing
              materialToApply = ifcMaterials.ifcGlazing;
              elementType = "glazing";
            } else if (isMetallic && vertexCount < 500) {
              // Small metallic elements are likely frames/mullions
              materialToApply = ifcMaterials.curtainWallFrame;
              elementType = "frame";
            } else if (vertexCount > 100 && hasNormals && hasUVs) {
              // Larger elements with proper geometry are likely panels
              materialToApply = ifcMaterials.curtainWallFrame;
              elementType = "panel";
            } else {
              // Default to panel material for everything else
              materialToApply = ifcMaterials.ifcGlazing;
              elementType = "panel (default)";
            }

            // Apply the determined material
            child.material = materialToApply;

            if (elementType === "panel" || elementType === "glazing") {
              try {
                const edges = new THREE.EdgesGeometry(child.geometry);
                const edgeMaterial = new THREE.LineBasicMaterial({
                  color: 0xaaaaaa,
                  transparent: true,
                  opacity: 0.4,
                  depthTest: true,
                  depthWrite: false,
                });

                const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
                edgeLines.position.copy(child.position);
                edgeLines.rotation.copy(child.rotation);
                edgeLines.scale.copy(child.scale);

                // Optional: link to child or parent
                if (child.parent) {
                  child.parent.add(edgeLines);
                } else if (sceneRef.current) {
                  sceneRef.current.add(edgeLines);
                }
              } catch (error) {
                console.warn(
                  "Failed to generate edges for panel-type element:",
                  error
                );
              }
            }

            // Only log first few elements to avoid console spam
            if (child.userData.logCount === undefined) {
              child.userData.logCount = Math.random();
              if (Math.random() < 0.1) {
                // Log only 10% of elements
                console.log(`🎯 Applied ${elementType} material:`, {
                  vertexCount,
                  isTransparent,
                  opacity,
                  isMetallic,
                  elementName: elementName || "unnamed",
                });
              }
            }

            // Enable shadows for all elements
            child.castShadow = true;
            child.receiveShadow = true;

            // Add edge lines for better definition on structural elements
            if (elementType === "frame" || elementType === "panel") {
              try {
                const edges = new THREE.EdgesGeometry(child.geometry);
                const edgeMaterial = new THREE.LineBasicMaterial({
                  color: 0x666666,
                  transparent: true,
                  opacity: 0.4,
                  linewidth: 1,
                });
                const edgeLines = new THREE.LineSegments(edges, edgeMaterial);

                // Copy transform from the mesh
                edgeLines.position.copy(child.position);
                edgeLines.rotation.copy(child.rotation);
                edgeLines.scale.copy(child.scale);

                // Add to the same parent as the mesh
                if (child.parent) {
                  child.parent.add(edgeLines);
                }
              } catch (error) {
                // Some geometries might not support edge detection
                console.log("Could not add edges to element:", elementType);
              }
            }
          }
        });

        console.log(
          `🔥 IFC Model Summary: ${meshCount} meshes found out of ${totalChildren} total children`
        );

        sceneRef.current.add(ifcModel);
        console.log("🔥 IFC model loaded and enhanced with improved materials");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("🔥 Error loading IFC model:", error);
    }

    // Fallback to enhanced sample curtain wall
    console.log("🔥 Creating enhanced sample curtain wall");
    createCurtainWallSystem();
    setIsLoading(false);
  }, [model, createCurtainWallSystem, createMaterials]);

  // Handle element selection (unchanged)
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (
        !rendererRef.current ||
        !cameraRef.current ||
        !raycasterRef.current ||
        !mouseRef.current
      )
        return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        curtainWallElements,
        true
      );

      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        const intersectionPoint = intersects[0].point;

        let elementWithData = selectedObject;
        while (
          elementWithData &&
          !elementWithData.userData?.elementType &&
          elementWithData.parent
        ) {
          elementWithData = elementWithData.parent as THREE.Object3D;
        }

        if (elementWithData?.userData?.elementType) {
          const element: LocalBIMElement = {
            id: Math.random(),
            modelId: model.id,
            ifcId: `temp-${Math.random()}`,
            elementType: elementWithData.userData.elementType,
            elementName: elementWithData.userData.elementName,
            level: null,
            material: elementWithData.userData.material,
            properties: elementWithData.userData.properties,
            geometryData: elementWithData.userData.quantities,
            createdAt: new Date(),
          };

          setSelectedElement(element);
          setShowProperties(true);

          if (elementWithData instanceof THREE.Mesh) {
            curtainWallElements.forEach((el) => {
              if (el instanceof THREE.Mesh && el.userData.originalMaterial) {
                el.material = el.userData.originalMaterial;
              }
            });

            if (!elementWithData.userData.originalMaterial) {
              elementWithData.userData.originalMaterial =
                elementWithData.material;
            }
            elementWithData.material = new THREE.MeshPhysicalMaterial({
              color: 0xff4444,
              transparent: true,
              opacity: 0.8,
              emissive: 0x440000,
              emissiveIntensity: 0.2,
            });
          }

          onElementSelect?.(element, intersectionPoint);

          if (viewerMode.type === "comment" && viewerMode.active) {
            onAddComment?.(intersectionPoint, element);
            setViewerMode({ type: "view", active: false });
          }
        }
      } else if (viewerMode.type === "comment" && viewerMode.active) {
        const cameraDirection = new THREE.Vector3();
        cameraRef.current.getWorldDirection(cameraDirection);
        const commentPosition = cameraRef.current.position
          .clone()
          .add(cameraDirection.multiplyScalar(5));
        onAddComment?.(commentPosition);
        setViewerMode({ type: "view", active: false });
      }
    },
    [curtainWallElements, model?.id, onElementSelect, onAddComment, viewerMode]
  );

  // Add comment markers to scene (unchanged)
  const updateCommentMarkers = useCallback(() => {
    if (!sceneRef.current) return;

    const existingMarkers = sceneRef.current.children.filter(
      (child) => child.name === "commentMarker"
    );
    existingMarkers.forEach((marker) => sceneRef.current?.remove(marker));

    comments.forEach((comment) => {
      const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: comment.status === "resolved" ? 0x00ff00 : 0xff6600,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(comment.position);
      marker.name = "commentMarker";
      sceneRef.current?.add(marker);
    });
  }, [comments]);

  // Initialize scene
  useEffect(() => {
    const cleanup = initThreeJS();
    return cleanup;
  }, [initThreeJS]);

  // Load/create model
  useEffect(() => {
    loadIFCModel();
  }, [loadIFCModel]);

  // Add click listener
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (canvas) {
      canvas.addEventListener("click", handleClick);
      return () => canvas.removeEventListener("click", handleClick);
    }
  }, [handleClick]);

  // Update comment markers when comments change
  useEffect(() => {
    updateCommentMarkers();
  }, [updateCommentMarkers]);

  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(15, 10, 15);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleAddToTakeoff = () => {
    if (selectedElement) {
      onAddToTakeoff?.(selectedElement);
    }
  };

  const toggleCommentMode = () => {
    setViewerMode((prev) => ({
      type: "comment",
      active: prev.type !== "comment" || !prev.active,
    }));
  };

  return (
    <div className="flex h-full w-full">
      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-lg">Loading BIM Model...</div>
          </div>
        )}

        {/* Toolbar */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={resetView}
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={
              viewerMode.type === "comment" && viewerMode.active
                ? "default"
                : "outline"
            }
            onClick={toggleCommentMode}
            title="Add Comments"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          <Button size="sm" variant="outline" title="Measurement Tools">
            <Ruler className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode indicator */}
        {viewerMode.active && (
          <div className="absolute top-16 left-4 bg-blue-500 text-white px-3 py-1 rounded text-sm">
            {viewerMode.type === "comment" && "Click to add comment"}
            {viewerMode.type === "takeoff" && "Select elements for takeoff"}
          </div>
        )}

        {/* Model info */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 text-sm">
          <div className="font-semibold">{model?.name}</div>
          <div className="text-muted-foreground">
            Enhanced Curtain Wall System
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Elements: {curtainWallElements.length} | Enhanced Materials &
            Lighting
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {showProperties && selectedElement && (
        <div className="w-80 border-l bg-background">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Element Properties</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowProperties(false)}
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary">{selectedElement.elementType}</Badge>
                <h3 className="font-semibold mt-2">
                  {selectedElement.elementName}
                </h3>
                {selectedElement.material && (
                  <p className="text-sm text-muted-foreground">
                    Material: {selectedElement.material}
                  </p>
                )}
              </div>

              {/* Enhanced Properties Display */}
              {selectedElement.properties && (
                <div>
                  <h4 className="font-medium mb-2">Technical Properties</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedElement.properties).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="font-mono text-xs">
                            {typeof value === "number"
                              ? value.toFixed(2)
                              : String(value || "")}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Quantities Display */}
              {selectedElement.geometryData && (
                <div>
                  <h4 className="font-medium mb-2">Quantities</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedElement.geometryData).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key}:
                          </span>
                          <span className="font-mono text-xs">
                            {typeof value === "number"
                              ? value.toFixed(3)
                              : String(value || "")}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Takeoff Actions */}
              <div>
                <h4 className="font-medium mb-2">Takeoff Actions</h4>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleAddToTakeoff}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Add to Takeoff
                  </Button>
                  <Button size="sm" variant="outline" className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Measure Element
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
