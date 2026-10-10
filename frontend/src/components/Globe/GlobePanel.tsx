import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { DirectionalLight, PerspectiveCamera, Vector3, type Group, type Texture } from "three";
import { solarAttitude } from "../../utils/solarAttitude";
import {
  BackSide,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  SRGBColorSpace,
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
  renderGroup,
  texture,
  uniform,
  uv,
  vec3,
  vec4,
} from "three/tsl";

/**
 * Day, night, and packed bump/roughness/clouds maps from the three.js
 * WebGPU earth example, at their original 4096 size. Textures by Solar System Scope.
 */
const EARTH_DAY = "/textures/earth-day.jpg";
const EARTH_NIGHT = "/textures/earth-night.jpg";
const EARTH_PACKED = "/textures/earth-packed.jpg";

/** One turn in about three minutes, around the poles. The sun turns with the earth, so local time stays put. */
const SPIN_RATE = 0.035;
/** Look down a little so the globe reads as a planet, not a flat disc. */
const VIEW_TILT = 0.32;

/** World-space sun. Declination lifts it; spin is the same polar rotation as the globe. */
const SUN_POSITION = new Vector3(1, 0, 0);
// A plain vector becomes a shader constant and freezes the terminator.
// This uniform is uploaded every frame, same direction as the light.
const SUN_DIRECTION = uniform(SUN_POSITION).setGroup(renderGroup);

function placeSun(declination: number, spin: number) {
  const cosDeclination = Math.cos(declination);
  SUN_POSITION.set(
    cosDeclination * Math.cos(spin),
    Math.sin(declination),
    -cosDeclination * Math.sin(spin),
  );
}

{
  const initial = solarAttitude(new Date());
  placeSun(initial.declination, 0);
}

/** Same limb colors as the three.js earth example. */
const ATMOSPHERE_DAY = "#4db2ff";
const ATMOSPHERE_TWILIGHT = "#bc490b";

function prepareMap(map: Texture, srgb: boolean) {
  if (srgb) map.colorSpace = SRGBColorSpace;
  map.anisotropy = 16;
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
    const fresnel = viewDirection.dot(normalWorldGeometry).abs().oneMinus().toVar();
    const sunOrientation = normalWorldGeometry.dot(normalize(SUN_DIRECTION)).toVar();
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
    // Only the silhouette. A wide fresnel paints the whole day side blue as the planet turns.
    const atmosphereMix = sunOrientation
      .smoothstep(-0.5, 1)
      .mul(fresnel.smoothstep(0.65, 1).pow(2))
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
    // Rim only. The example's remap climbs above 1 across the disc and fogs the day side.
    const alpha = fresnel.smoothstep(0.8, 1).pow(3).mul(sunOrientation.smoothstep(-0.5, 1));
    atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha);

    return { globeMaterial, atmosphereMaterial };
  }, [maps.day, maps.night, maps.packed]);

  return (
    <>
      <mesh material={materials.globeMaterial}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <mesh material={materials.atmosphereMaterial} scale={1.04}>
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
    camera.position.set(0, Math.sin(VIEW_TILT) * distance, Math.cos(VIEW_TILT) * distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

function OrientedGlobe() {
  const group = useRef<Group>(null);
  const light = useRef<DirectionalLight>(null);
  const spin = useRef(0);

  useLayoutEffect(() => {
    const { declination, subsolarLongitude } = solarAttitude(new Date());
    placeSun(declination, 0);
    if (group.current) group.current.rotation.y = -subsolarLongitude;
  }, []);

  useFrame((_, delta) => {
    spin.current += delta * SPIN_RATE;
    const { declination, subsolarLongitude } = solarAttitude(new Date());
    placeSun(declination, spin.current);
    light.current?.position.copy(SUN_POSITION);
    if (group.current) group.current.rotation.y = -subsolarLongitude + spin.current;
  });

  return (
    <>
      <directionalLight ref={light} position={SUN_POSITION.toArray()} intensity={2} />
      {/*
        Spin is only around the poles. Yaw lines local noon up with the sun,
        and the same angle is added to both, so the surface turns while night
        stays on the real night side.
      */}
      <group ref={group}>
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
      </group>
    </>
  );
}

/**
 * The one earth canvas. The desktop hero mounts it at up to 2x.
 * The phone band is small, so it can mount the same canvas at up to 3x.
 * Selection does not rebuild it, because the shell owns the mount.
 */
export default function GlobePanel({ maxDpr = 2 }: { maxDpr?: number }) {
  return (
    <div className="pointer-events-none h-full min-h-0 w-full">
      <Canvas
        dpr={[1, maxDpr]}
        flat
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
        <OrientedGlobe />
      </Canvas>
    </div>
  );
}
