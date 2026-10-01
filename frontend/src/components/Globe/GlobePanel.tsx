import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { PerspectiveCamera, type Group, type Texture } from "three";
import {
  BackSide,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  SRGBColorSpace,
  Vector3,
  WebGPURenderer,
} from "three/webgpu";
import {
  bumpMap,
  cameraPosition,
  color,
  max,
  mix,
  normalWorldGeometry,
  normalize,
  output,
  positionWorld,
  step,
  texture,
  uniform,
  uv,
  vec3,
  vec4,
} from "three/tsl";

/**
 * Day, night, and packed bump/roughness/clouds maps from the three.js earth
 * example. Textures by Solar System Scope, resized for this panel.
 */
const EARTH_DAY = "/textures/earth-day.jpg";
const EARTH_NIGHT = "/textures/earth-night.jpg";
const EARTH_PACKED = "/textures/earth-packed.jpg";

/** Fixed in view, so the earth rotates through a steady day/night line. */
const SUN_POSITION = new Vector3(1.8, 0.4, 1.1);

const ATMOSPHERE_DAY = "#3ec6ff";
const ATMOSPHERE_TWILIGHT = "#8d5a3c";

function prepareMap(map: Texture, srgb: boolean) {
  if (srgb) map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
}

function Earth() {
  const maps = useTexture({
    day: EARTH_DAY,
    night: EARTH_NIGHT,
    packed: EARTH_PACKED,
  });

  const materials = useMemo(() => {
    prepareMap(maps.day, true);
    prepareMap(maps.night, true);
    prepareMap(maps.packed, false);

    const atmosphereDayColor = uniform(color(ATMOSPHERE_DAY));
    const atmosphereTwilightColor = uniform(color(ATMOSPHERE_TWILIGHT));

    const viewDirection = positionWorld.sub(cameraPosition).normalize();
    const fresnel = viewDirection.dot(normalWorldGeometry).abs().oneMinus();
    const sunOrientation = normalWorldGeometry.dot(normalize(SUN_POSITION));
    const atmosphereColor = mix(
      atmosphereTwilightColor,
      atmosphereDayColor,
      sunOrientation.smoothstep(-0.25, 0.75),
    );

    const globeMaterial = new MeshStandardNodeMaterial();
    const cloudsStrength = texture(maps.packed, uv()).b.smoothstep(0.2, 1);
    globeMaterial.colorNode = mix(texture(maps.day), vec3(1), cloudsStrength.mul(2));

    const roughness = max(texture(maps.packed).g, step(0.01, cloudsStrength));
    globeMaterial.roughnessNode = roughness.remap(0, 1, 0.25, 0.35);

    const dayStrength = sunOrientation.smoothstep(-0.25, 0.5);
    const atmosphereMix = sunOrientation
      .smoothstep(-0.5, 1)
      .mul(fresnel.pow(2))
      .clamp(0, 1);

    const lit = mix(texture(maps.night).rgb, output.rgb, dayStrength);
    globeMaterial.outputNode = vec4(
      mix(lit, atmosphereColor, atmosphereMix),
      output.a,
    );

    const bumpElevation = max(texture(maps.packed).r, cloudsStrength);
    globeMaterial.normalNode = bumpMap(bumpElevation);

    const atmosphereMaterial = new MeshBasicNodeMaterial({
      side: BackSide,
      transparent: true,
      depthWrite: false,
    });
    const alpha = fresnel
      .remap(0.73, 1, 1, 0)
      .pow(3)
      .mul(sunOrientation.smoothstep(-0.5, 1));
    atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha);

    return { globeMaterial, atmosphereMaterial };
  }, [maps.day, maps.night, maps.packed]);

  return (
    <>
      <mesh material={materials.globeMaterial}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <mesh material={materials.atmosphereMaterial} scale={1.06}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </>
  );
}

/** Keep the whole sphere, including the rim, inside the panel on any aspect. */
function FrameCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = size.width / Math.max(size.height, 1);
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const limit = Math.min(vFov, hFov);
    const distance = 1.22 / Math.tan(limit / 2);
    camera.position.set(0, 0.06, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

function SpinningGlobe() {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.035;
  });

  return (
    <>
      <directionalLight position={SUN_POSITION.toArray()} intensity={2} />
      <group ref={group} rotation={[0.32, 0.6, 0]}>
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
      </group>
    </>
  );
}

/**
 * Desktop hero globe. Owns the only canvas.
 * Mounted from the shell, outside the launch-keyed card, so selection does not rebuild it.
 */
export default function GlobePanel() {
  return (
    <div className="pointer-events-none h-full min-h-0 w-full">
      <Canvas
        dpr={[1, 1.5]}
        frameloop="always"
        gl={async (props) => {
          const renderer = new WebGPURenderer({
            canvas: props.canvas,
            antialias: true,
            alpha: true,
          });
          await renderer.init();
          return renderer;
        }}
        camera={{ position: [0, 0.06, 3.4], fov: 34 }}
        style={{ width: "100%", height: "100%", display: "block" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <FrameCamera />
        <SpinningGlobe />
      </Canvas>
    </div>
  );
}
