"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Eye, EyeOff, Grid3x3, Box } from "lucide-react";
import type { BIMModel, BIMElement, ElementSelectionEvent } from "../../types";

interface SimpleBIMViewerProps {
  model: BIMModel;
  onElementSelect?: (event: ElementSelectionEvent) => void;
  className?: string;
}

export default function SimpleBIMViewer({
  model,
  onElementSelect,
  className = "",
}: SimpleBIMViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef<THREE.Vector2>();
  const ifcModelRef = useRef<THREE.Group>();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<BIMElement | null>(
    null
  );
  const [showProperties, setShowProperties] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Initialize Three.js scene
  const initThreeJS = useCallback(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xcccccc);
    gridHelper.name = "grid";
    scene.add(gridHelper);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Raycaster for selection
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
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
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Replace your loadIFCModel function with this enhanced version

  const loadIFCModel = useCallback(async () => {
    if (!sceneRef.current) return;

    try {
      setIsLoading(true);
      setLoadingError(null);

      if (!model?.filePath || !model.filePath.endsWith(".ifc")) {
        throw new Error("Invalid IFC file path");
      }

      console.log("Loading IFC file:", model.filePath);

      // Initialize OpenBIM Components
      const components = new OBC.Components();
      const fragments = components.get(OBC.FragmentsManager);
      const ifcLoader = components.get(OBC.IfcLoader);

      // Get the properties manager for IFC property extraction
      const properties = components.get(OBC.IfcPropertiesManager);

      await ifcLoader.setup();

      // Configure loader settings for enhanced property extraction
      ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
      ifcLoader.settings.includeProperties = true;
      // Remove the OPTIMIZE_PROFILES line as it doesn't exist

      // Fetch and load the IFC file
      const response = await fetch(model.filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch IFC file: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const ifcModel = await ifcLoader.load(new Uint8Array(buffer));

      console.log("IFC Model loaded:", ifcModel);
      console.log("Model children count:", ifcModel.children.length);

      // IMPORTANT: After loading, we need to process the IFC data
      // The properties manager needs to be populated with data from the loaded model
      console.log("Fragments after loading:", fragments);
      console.log(
        "Available fragment models:",
        Object.keys(fragments.groups || {})
      );

      // Try to access fragments data which should contain the IFC properties
      let ifcEntities: any = {};
      console.log("Fragments list:", fragments.list);
      console.log("Fragments groups:", fragments.groups);

      // Explore the fragments structure to find IFC data
      for (const [key, value] of Object.entries(fragments.list || {})) {
        console.log(`Fragment ${key}:`, value);
        if (value && typeof value === "object" && "fragments" in value) {
          console.log(`Fragment ${key} fragments:`, (value as any).fragments);
        }
      }

      // Try to get IFC data from loaded model using the components system
      try {
        // Look for IFC data in the components
        const ifcAPI = components.get(OBC.IfcLoader).webIfc;
        console.log("IFC API from components:", ifcAPI);

        // Check if there are any loaded models
        console.log(
          "Loaded models in webIfc:",
          (ifcAPI as any)?.GetModelList
            ? (ifcAPI as any).GetModelList()
            : "No GetModelList method"
        );

        // Try a different approach - look at the ifcModel itself for embedded data
        console.log("ifcModel userData:", ifcModel.userData);
        console.log(
          "ifcModel properties:",
          Object.getOwnPropertyNames(ifcModel)
        );

        // JACKPOT! The ifcModel has these properties that should contain IFC data:
        console.log(
          "ifcModel.globalToExpressIDs:",
          (ifcModel as any).globalToExpressIDs
        );
        console.log("ifcModel.ifcMetadata:", (ifcModel as any).ifcMetadata);
        console.log("ifcModel._properties:", (ifcModel as any)._properties);
        console.log("ifcModel.data:", (ifcModel as any).data);
        console.log("ifcModel.geometryIDs:", (ifcModel as any).geometryIDs);

        // Store the IFC data for later use
        const globalToExpressIDs = (ifcModel as any).globalToExpressIDs;
        const ifcMetadata = (ifcModel as any).ifcMetadata;
        const ifcProperties = (ifcModel as any)._properties;
        const ifcData = (ifcModel as any).data;

        // Store these for use in element processing
        ifcEntities = {
          globalToExpressIDs,
          ifcMetadata,
          ifcProperties,
          ifcData,
        };

        // Check if fragments have the model ID we need
        if (fragments.groups && fragments.groups.size > 0) {
          const firstGroupKey = Array.from(fragments.groups.keys())[0];
          const firstGroup = fragments.groups.get(firstGroupKey);
          console.log("First fragment group:", firstGroup);

          // Try to access fragment data
          if (firstGroup && typeof firstGroup === "object") {
            console.log(
              "Fragment group properties:",
              Object.getOwnPropertyNames(firstGroup)
            );
          }
        }
      } catch (error) {
        console.warn("Error exploring IFC data:", error);
      }

      // Store model reference
      ifcModelRef.current = ifcModel;

      // Basic material for all elements
      const defaultMaterial = new THREE.MeshLambertMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide,
      });

      // Get all property sets from the IFC file
      console.log("Properties manager:", properties);

      // Try different ways to access properties with proper type checking
      console.log(
        "Properties getAll():",
        (properties as any).getAll
          ? (properties as any).getAll()
          : "getAll method not available"
      );
      console.log(
        "Properties list:",
        (properties as any).list
          ? (properties as any).list()
          : "list method not available"
      );
      console.log(
        "Properties methods:",
        Object.getOwnPropertyNames(properties)
      );
      console.log(
        "Properties methods (prototype):",
        Object.getOwnPropertyNames(Object.getPrototypeOf(properties))
      );

      // Process all meshes in the model with enhanced property extraction
      let elementCount = 0;
      const processedElements: any[] = [];

      ifcModel.traverse((child: any) => {
        if (child.isMesh) {
          elementCount++;

          // Apply default material
          child.material = defaultMaterial;

          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;

          // Store original material for selection highlighting
          child.userData.originalMaterial = defaultMaterial;

          // Try to extract IFC properties for this element
          let ifcProperties: any = {};
          let elementType = "Unknown";
          let elementName = `Element ${elementCount}`;
          let level = null;
          let materialName = "Standard Material";

          // Look for IFC data in the mesh - try multiple approaches
          const expressId =
            child.userData?.expressId ||
            child.expressId ||
            child.userData?.ifcExpressId ||
            child.userData?.expressID ||
            child.userData?.id;

          // Also check if the mesh name contains useful IFC information
          const meshName = child.name || "Unnamed";

          // Look for fragment information that might link to IFC data
          const fragmentMap = child.userData?.fragmentMap;
          const geometryID = child.userData?.geometryID;
          const fragmentID = child.userData?.fragmentID;

          console.log(
            `Element ${elementCount} - ExpressID: ${expressId}, Name: "${meshName}", FragmentMap: ${fragmentMap}, GeometryID: ${geometryID}, FragmentID: ${fragmentID}`
          );
          console.log(
            `Element ${elementCount} - UUID: ${child.uuid}, UserData:`,
            child.userData
          );

          // NEW: Try to find IFC data using the ifcModel's built-in properties
          let foundIfcData = false;

          // Method 1: Check if this mesh UUID exists in globalToExpressIDs
          if (ifcEntities.globalToExpressIDs && child.uuid) {
            const meshExpressId = ifcEntities.globalToExpressIDs.get(
              child.uuid
            );
            if (meshExpressId) {
              console.log(
                `🎯 Found ExpressID ${meshExpressId} for mesh UUID ${child.uuid}`
              );

              // Now try to get the actual IFC properties for this ExpressID
              if (
                ifcEntities.ifcProperties &&
                ifcEntities.ifcProperties[meshExpressId]
              ) {
                const elementIfcProps =
                  ifcEntities.ifcProperties[meshExpressId];
                console.log(
                  `🔥 Found IFC properties for ExpressID ${meshExpressId}:`,
                  elementIfcProps
                );

                // Extract IFC type and name
                if (elementIfcProps.type) {
                  elementType = elementIfcProps.type;
                }
                if (elementIfcProps.Name?.value) {
                  elementName = elementIfcProps.Name.value;
                }

                ifcProperties = {
                  expressId: meshExpressId,
                  ifcType: elementType,
                  globalId: elementIfcProps.GlobalId?.value,
                  name: elementName,
                  description: elementIfcProps.Description?.value,
                  objectType: elementIfcProps.ObjectType?.value,
                  _fullIfcProperties: elementIfcProps,
                  _source: "ifcModel_properties",
                };

                foundIfcData = true;
              }
            }
          }

          // Method 2: Try to search through globalToExpressIDs for any UUID patterns
          if (!foundIfcData && ifcEntities.globalToExpressIDs) {
            // Log a few entries to see the pattern
            const globalEntries = Array.from(
              ifcEntities.globalToExpressIDs.entries()
            ).slice(0, 5);
            console.log(`Sample globalToExpressIDs entries:`, globalEntries);

            // Look for the mesh UUID in various forms
            const searchPatterns = [
              child.uuid,
              child.uuid.replace(/-/g, ""), // Remove dashes
              child.uuid.toLowerCase(),
              child.uuid.toUpperCase(),
              child.name,
            ].filter(Boolean);

            for (const pattern of searchPatterns) {
              const foundExpressId =
                ifcEntities.globalToExpressIDs.get(pattern);
              if (foundExpressId) {
                console.log(
                  `🎯 Found ExpressID ${foundExpressId} using pattern "${pattern}"`
                );

                if (
                  ifcEntities.ifcProperties &&
                  ifcEntities.ifcProperties[foundExpressId]
                ) {
                  const elementIfcProps =
                    ifcEntities.ifcProperties[foundExpressId];
                  console.log(
                    `🔥 Found IFC properties using pattern:`,
                    elementIfcProps
                  );

                  elementType = elementIfcProps.type || elementType;
                  elementName = elementIfcProps.Name?.value || elementName;
                  foundIfcData = true;
                  break;
                }
              }
            }
          }

          // Method 3: Check fragments list for this specific mesh UUID
          if (!foundIfcData && fragments.list) {
            const fragmentEntry = fragments.list.get(child.uuid);
            if (fragmentEntry) {
              console.log(
                `🎯 Found fragment entry for mesh UUID ${child.uuid}:`,
                fragmentEntry
              );

              // Deep dive into the fragment structure to find ExpressID
              const fragData = fragmentEntry as any;

              // Log all properties of the fragment to understand its structure
              console.log(
                `Fragment properties:`,
                Object.getOwnPropertyNames(fragData)
              );
              console.log(`Fragment ids:`, fragData.ids);
              console.log(
                `Fragment itemToInstances:`,
                fragData.itemToInstances
              );
              console.log(`Fragment instanceToItem:`, fragData.instanceToItem);

              // Try different ways to get ExpressID from fragment
              let fragExpressId = null;

              // Method 3a: Check if ids Set contains ExpressIDs
              if (fragData.ids && fragData.ids.size > 0) {
                const firstId = Array.from(fragData.ids)[0];
                console.log(`🔍 Fragment first ID: ${firstId}`);

                // Check if this ID exists in ifcProperties
                if (
                  ifcEntities.ifcProperties &&
                  typeof firstId === "string" &&
                  ifcEntities.ifcProperties[firstId]
                ) {
                  fragExpressId = firstId;
                  console.log(
                    `🔥 Fragment ID ${firstId} found in ifcProperties!`
                  );
                }
              }

              // Method 3b: Check itemToInstances for ExpressIDs
              if (!fragExpressId && fragData.itemToInstances) {
                for (const [key, value] of fragData.itemToInstances.entries()) {
                  console.log(
                    `🔍 ItemToInstances - Key: ${key}, Value:`,
                    value
                  );

                  // Check if key is an ExpressID
                  if (
                    ifcEntities.ifcProperties &&
                    ifcEntities.ifcProperties[key]
                  ) {
                    fragExpressId = key;
                    console.log(
                      `🔥 Found ExpressID ${key} in itemToInstances!`
                    );
                    break;
                  }
                }
              }

              // Method 3c: Check instanceToItem for ExpressIDs
              if (!fragExpressId && fragData.instanceToItem) {
                for (const [key, value] of fragData.instanceToItem.entries()) {
                  console.log(
                    `🔍 InstanceToItem - Key: ${key}, Value: ${value}`
                  );

                  // Check if value is an ExpressID
                  if (
                    ifcEntities.ifcProperties &&
                    ifcEntities.ifcProperties[value]
                  ) {
                    fragExpressId = value;
                    console.log(
                      `🔥 Found ExpressID ${value} in instanceToItem!`
                    );
                    break;
                  }
                }
              }

              // If we found an ExpressID, get the IFC properties
              if (
                fragExpressId &&
                ifcEntities.ifcProperties &&
                ifcEntities.ifcProperties[fragExpressId]
              ) {
                const elementIfcProps =
                  ifcEntities.ifcProperties[fragExpressId];
                console.log(
                  `🔥 SUCCESS! Found IFC properties from fragment ExpressID ${fragExpressId}:`,
                  elementIfcProps
                );

                // Extract IFC type properly - the constructor name contains the IFC type
                const ifcTypeName =
                  elementIfcProps.constructor?.name ||
                  elementIfcProps.type ||
                  "Unknown";
                elementType = ifcTypeName;

                // Extract element name
                elementName =
                  elementIfcProps.Name?.value ||
                  elementIfcProps.name?.value ||
                  elementName;

                ifcProperties = {
                  expressId: fragExpressId, // Make sure this is set
                  ifcType: elementType,
                  globalId: elementIfcProps.GlobalId?.value,
                  name: elementName,
                  description: elementIfcProps.Description?.value,
                  objectType: elementIfcProps.ObjectType?.value,
                  tag: elementIfcProps.Tag?.value,
                  _fullIfcProperties: elementIfcProps,
                  _source: "fragment_lookup",
                };

                foundIfcData = true;
              }
            }
          }

          // Alternative: check if we can find data in ifcData using geometry or other IDs
          if (!foundIfcData && ifcEntities.ifcData) {
            console.log(`Searching ifcData for element ${elementCount}...`);
            // Try to match using various IDs
            const searchIds = [
              child.uuid,
              geometryID,
              fragmentID,
              child.id,
            ].filter(Boolean);

            for (const searchId of searchIds) {
              const elementIfcData = ifcEntities.ifcData.get(searchId);
              if (elementIfcData) {
                console.log(
                  `🎯 Found IFC data for ${searchId}:`,
                  elementIfcData
                );

                ifcProperties = {
                  ...ifcProperties,
                  searchId: searchId,
                  ifcData: elementIfcData,
                  _source: "ifcModel_data",
                };

                foundIfcData = true;
                break;
              }
            }
          }

          // Try to find IFC data through fragment mapping
          if (!foundIfcData && (fragmentMap || geometryID || fragmentID)) {
            console.log(
              `Element ${elementCount} has fragment data - exploring...`
            );

            // Try to use fragment data to get IFC properties
            try {
              // Look through fragments for matching IDs
              for (const [fragKey, fragValue] of Object.entries(
                fragments.list || {}
              )) {
                if (
                  fragKey === fragmentID ||
                  fragKey.includes(String(geometryID))
                ) {
                  console.log(
                    `Found matching fragment for element ${elementCount}:`,
                    fragValue
                  );

                  // Try to extract IFC data from fragment
                  if (fragValue && typeof fragValue === "object") {
                    const fragData = fragValue as any;
                    if (
                      fragData.properties ||
                      fragData.ifcData ||
                      fragData.items
                    ) {
                      console.log(`Fragment has IFC data:`, fragData);

                      // Extract basic info from fragment
                      if (fragData.type) {
                        elementType = fragData.type;
                      }
                      if (fragData.name) {
                        elementName = fragData.name;
                      }

                      ifcProperties = {
                        fragmentID: fragmentID,
                        geometryID: geometryID,
                        fragmentData: fragData,
                        _source: "fragment",
                      };
                    }
                  }
                }
              }
            } catch (error) {
              console.warn(
                `Error exploring fragment data for element ${elementCount}:`,
                error
              );
            }
          }

          // Alternative approach: try to infer element type from mesh name patterns
          if (elementType === "Unknown" && meshName && meshName !== "Unnamed") {
            // Look for IFC type patterns in the name
            if (meshName.toLowerCase().includes("wall")) {
              elementType = "IfcWall";
              elementName = meshName;
            } else if (meshName.toLowerCase().includes("window")) {
              elementType = "IfcWindow";
              elementName = meshName;
            } else if (meshName.toLowerCase().includes("door")) {
              elementType = "IfcDoor";
              elementName = meshName;
            } else if (
              meshName.toLowerCase().includes("slab") ||
              meshName.toLowerCase().includes("floor")
            ) {
              elementType = "IfcSlab";
              elementName = meshName;
            } else if (meshName.toLowerCase().includes("roof")) {
              elementType = "IfcRoof";
              elementName = meshName;
            } else if (meshName.toLowerCase().includes("beam")) {
              elementType = "IfcBeam";
              elementName = meshName;
            } else if (meshName.toLowerCase().includes("column")) {
              elementType = "IfcColumn";
              elementName = meshName;
            } else {
              // Try to extract from structured names like "Type:Name" or "Type-Name"
              const nameParts = meshName.split(/[:_-]/);
              if (nameParts.length > 1) {
                elementType = nameParts[0];
                elementName = nameParts.slice(1).join(" ");
              } else {
                elementName = meshName;
              }
            }

            if (elementType !== "Unknown") {
              console.log(
                `Inferred element type "${elementType}" from name "${meshName}"`
              );
              ifcProperties = {
                ...ifcProperties,
                inferredFromName: true,
                originalName: meshName,
                _source: "name_inference",
              };
            }
          }

          // Try to get properties using different methods
          if (expressId) {
            try {
              // Try getAll method with type assertion
              if ((properties as any).getAll) {
                const allProperties = (properties as any).getAll();
                console.log("All properties from getAll():", allProperties);

                // Look for this element's properties
                if (allProperties && typeof allProperties === "object") {
                  for (const [modelKey, modelProps] of Object.entries(
                    allProperties
                  )) {
                    if (
                      modelProps &&
                      typeof modelProps === "object" &&
                      expressId in modelProps
                    ) {
                      const elementProps = (modelProps as any)[expressId];
                      console.log(
                        `Found properties for element ${expressId}:`,
                        elementProps
                      );

                      // Extract basic IFC information
                      if (elementProps.type) {
                        elementType = elementProps.type;
                      }
                      if (elementProps.Name?.value) {
                        elementName = elementProps.Name.value;
                      } else if (elementProps.name?.value) {
                        elementName = elementProps.name.value;
                      }

                      // Extract more properties
                      ifcProperties = {
                        expressId: expressId,
                        ifcType: elementType,
                        globalId: elementProps.GlobalId?.value,
                        name: elementName,
                        description: elementProps.Description?.value,
                        objectType: elementProps.ObjectType?.value,
                        tag: elementProps.Tag?.value,
                        _rawProperties: elementProps,
                      };

                      break;
                    }
                  }
                }
              }

              // Try alternative methods if getAll doesn't work
              if (Object.keys(ifcProperties).length === 0) {
                // Try direct property access methods
                if ((properties as any).get) {
                  const elementProps = (properties as any).get(expressId);
                  console.log(
                    `Direct get properties for ${expressId}:`,
                    elementProps
                  );
                  if (elementProps) {
                    ifcProperties = { expressId, _directProps: elementProps };
                  }
                }
              }
            } catch (error) {
              console.warn(
                `Error extracting properties for element ${expressId}:`,
                error
              );
            }
          }

          // Use IFC entity data if we found it (remove this section since ifcEntityData is not defined)
          // This was from an earlier approach that we removed

          // If no expressId or properties found, try to extract from the fragment system
          if (!expressId || Object.keys(ifcProperties).length === 0) {
            // Try to get data from fragments
            const fragmentId = child.userData?.fragmentId;
            if (fragmentId && fragments) {
              console.log(`Trying to get data from fragment ${fragmentId}`);
              // Explore fragments API
              try {
                const fragmentsData = (fragments as any).list;
                console.log("Available fragments:", fragmentsData);
              } catch (e) {
                console.log("Could not access fragments data");
              }
            }

            // Fallback to basic mesh analysis
            if (child.name && child.name !== "Unnamed") {
              const nameParts = child.name.split(":");
              if (nameParts.length > 1) {
                elementType = nameParts[0];
                elementName = nameParts[1] || elementName;
              }
            }
          }

          // Enhanced element data with IFC properties
          const elementData = {
            id: elementCount,
            modelId: model.id,
            ifcId: child.uuid || `element-${elementCount}`,
            elementType: elementType,
            elementName: elementName,
            level: level,
            material: materialName,
            properties: {
              // Include both basic mesh properties and IFC properties
              uuid: child.uuid,
              type: child.type,
              visible: child.visible,
              name: child.name || "Unnamed",
              ...ifcProperties,
              // Make sure expressId is properly set
              expressId: ifcProperties.expressId || expressId,
            },
            geometryData: child.geometry
              ? {
                  vertices: child.geometry.attributes?.position?.count || 0,
                  faces: child.geometry.index
                    ? child.geometry.index.count / 3
                    : 0,
                  type: child.geometry.type,
                  expressId: ifcProperties.expressId || expressId,
                }
              : null,
            createdAt: new Date(),
          };

          child.userData.elementData = elementData;
          processedElements.push(elementData);

          console.log(`Enhanced Element ${elementCount}:`, {
            name: elementName,
            type: elementType,
            expressId: expressId,
            hasIfcProperties: Object.keys(ifcProperties).length > 0,
            userData: child.userData,
          });
        }
      });

      console.log(
        `Processed ${elementCount} elements with enhanced properties`
      );
      console.log("Sample processed elements:", processedElements.slice(0, 3));

      // Add model to scene
      sceneRef.current.add(ifcModel);

      // Center camera on model
      const box = new THREE.Box3().setFromObject(ifcModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      if (cameraRef.current && controlsRef.current) {
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5;

        cameraRef.current.position.set(
          center.x + distance,
          center.y + distance * 0.7,
          center.z + distance
        );

        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading IFC model:", error);
      setLoadingError(
        error instanceof Error ? error.message : "Failed to load model"
      );
      setIsLoading(false);
    }
  }, [model]);

  // Handle element selection
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (
        !rendererRef.current ||
        !cameraRef.current ||
        !raycasterRef.current ||
        !mouseRef.current ||
        !ifcModelRef.current
      ) {
        return;
      }

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(
        ifcModelRef.current,
        true
      );

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const intersectionPoint = intersects[0].point;

        // Find the mesh with element data
        let elementMesh = intersectedObject;
        while (
          elementMesh &&
          !elementMesh.userData.elementData &&
          elementMesh.parent
        ) {
          elementMesh = elementMesh.parent;
        }

        if (elementMesh.userData.elementData) {
          const elementData = elementMesh.userData.elementData as BIMElement;

          console.log("Selected element:", elementData);

          // Clear previous selection
          if (ifcModelRef.current) {
            ifcModelRef.current.traverse((child: any) => {
              if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
              }
            });
          }

          // Highlight selected element
          if (elementMesh instanceof THREE.Mesh) {
            elementMesh.material = new THREE.MeshLambertMaterial({
              color: 0xff4444,
              transparent: true,
              opacity: 0.8,
            });
          }

          setSelectedElement(elementData);
          setShowProperties(true);

          // Call selection callback
          if (onElementSelect) {
            onElementSelect({
              element: elementData,
              position: intersectionPoint,
              mesh: elementMesh,
            });
          }
        }
      }
    },
    [onElementSelect]
  );

  // Control functions
  const resetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current && ifcModelRef.current) {
      const box = new THREE.Box3().setFromObject(ifcModelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 1.5;

      cameraRef.current.position.set(
        center.x + distance,
        center.y + distance * 0.7,
        center.z + distance
      );

      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, []);

  const toggleGrid = useCallback(() => {
    if (sceneRef.current) {
      const grid = sceneRef.current.getObjectByName("grid");
      if (grid) {
        grid.visible = !grid.visible;
        setShowGrid(grid.visible);
      }
    }
  }, []);

  const toggleWireframe = useCallback(() => {
    if (ifcModelRef.current) {
      ifcModelRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.wireframe = !wireframeMode;
        }
      });
      setWireframeMode(!wireframeMode);
    }
  }, [wireframeMode]);

  // Initialize scene
  useEffect(() => {
    const cleanup = initThreeJS();
    return cleanup;
  }, [initThreeJS]);

  // Load model
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

  return (
    <div className={`flex h-full w-full ${className}`}>
      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-lg">Loading BIM Model...</div>
          </div>
        )}

        {/* Error overlay */}
        {loadingError && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-10 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-md">
              <h3 className="text-red-600 font-semibold mb-2">Loading Error</h3>
              <p className="text-sm text-gray-600">{loadingError}</p>
            </div>
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
            variant={showGrid ? "default" : "outline"}
            onClick={toggleGrid}
            title="Toggle Grid"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={wireframeMode ? "default" : "outline"}
            onClick={toggleWireframe}
            title="Toggle Wireframe"
          >
            <Box className="w-4 h-4" />
          </Button>
        </div>

        {/* Model info */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 text-sm">
          <div className="font-semibold">{model?.name}</div>
          <div className="text-muted-foreground">{model?.fileName}</div>
          {model?.ifcSchema && (
            <div className="text-xs text-muted-foreground">
              Schema: {model.ifcSchema}
            </div>
          )}
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
            <CardContent className="space-y-4 overflow-y-auto">
              <div>
                <Badge variant="secondary">{selectedElement.elementType}</Badge>
                <h3 className="font-semibold mt-2">
                  {selectedElement.elementName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  IFC ID: {selectedElement.ifcId}
                </p>
              </div>

              {/* Basic Properties */}
              {selectedElement.properties && (
                <div>
                  <h4 className="font-medium mb-2">Properties</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(selectedElement.properties).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="font-mono text-xs text-right">
                            {typeof value === "object"
                              ? JSON.stringify(value).slice(0, 50) + "..."
                              : String(value || "N/A")}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Geometry Data */}
              {selectedElement.geometryData && (
                <div>
                  <h4 className="font-medium mb-2">Geometry</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(selectedElement.geometryData).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="font-mono text-xs">
                            {typeof value === "number"
                              ? value.toLocaleString()
                              : String(value || "N/A")}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Raw Data (for debugging) */}
              <div>
                <h4 className="font-medium mb-2">Debug Info</h4>
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedElement, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
