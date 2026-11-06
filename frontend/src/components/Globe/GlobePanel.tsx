import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Vector3,
  type Group,
  type Texture,
} from "three";
import { solarAttitude } from "../../utils/solarAttitude";
import {
  faceYawForLatLon,
  latLonToUnit,
  shortestAngleDelta,
  type PadFocus,
} from "../../utils/globeFocus";
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
  float,
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

/** One turn in about three minutes when no pad is focused. */
const SPIN_RATE = 0.035;
/** Look down a little so the globe reads as a planet, not a flat disc. */
const VIEW_TILT = 0.32;
/** How quickly yaw settles on a newly selected pad. */
const FLY_RATE = 3.2;
/** Radians — close enough to treat the fly-to as done and resume spin. */
const FLY_SETTLE = 0.002;
const MARKER_COLOR = "#22d3ee";
const UP = new Vector3(0, 1, 0);

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

/** Fires once Earth textures have resolved inside the Suspense boundary. */
function EarthReady({ onReady }: { onReady?: () => void }) {
  useLayoutEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

function useMarkerMaterial(opacity: number) {
  return useMemo(() => {
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
    });
    material.outputNode = vec4(color(MARKER_COLOR), float(opacity));
    return material;
  }, [opacity]);
}

/** Cyan pad pin + soft radial beam on the focused launch site. */
function PadMarker({ latitude, longitude }: PadFocus) {
  const point = useMemo(() => latLonToUnit(latitude, longitude), [latitude, longitude]);
  const quaternion = useMemo(() => {
    const next = new Quaternion();
    next.setFromUnitVectors(UP, point.clone().normalize());
    return next;
  }, [point]);
  const core = useMarkerMaterial(0.95);
  const beam = useMarkerMaterial(0.45);
  const halo = useMarkerMaterial(0.22);
  const coreMesh = useRef<Mesh>(null);
  const haloMesh = useRef<Mesh>(null);
  const pulse = useRef(0);

  useFrame((_, delta) => {
    pulse.current += delta * 2.2;
    const pulseScale = 1 + Math.sin(pulse.current) * 0.12;
    coreMesh.current?.scale.setScalar(0.026 * pulseScale);
    haloMesh.current?.scale.setScalar(0.048 * pulseScale);
  });

  return (
    <group>
      <mesh
        ref={coreMesh}
        position={point.clone().multiplyScalar(1.012)}
        scale={0.026}
        material={core}
      >
        <sphereGeometry args={[1, 16, 16]} />
      </mesh>
      <mesh
        ref={haloMesh}
        position={point.clone().multiplyScalar(1.012)}
        scale={0.048}
        material={halo}
      >
        <sphereGeometry args={[1, 16, 16]} />
      </mesh>
      <mesh
        position={point.clone().multiplyScalar(1.07)}
        quaternion={quaternion}
        material={beam}
      >
        <cylinderGeometry args={[0.007, 0.0015, 0.14, 10]} />
      </mesh>
    </group>
  );
}

function focusKeyOf(focus?: PadFocus | null): string | null {
  return focus ? `${focus.latitude},${focus.longitude}` : null;
}

function OrientedGlobe({
  onReady,
  focus,
}: {
  onReady?: () => void;
  focus?: PadFocus | null;
}) {
  const group = useRef<Group>(null);
  const light = useRef<DirectionalLight>(null);
  /** Continuous polar spin; yaw = -subsolarLongitude + spin when coasting. */
  const spin = useRef(0);
  const yaw = useRef(0);
  const focusKey = useRef<string | null>(null);
  const flying = useRef(false);
  const flyTarget = useRef(0);

  useLayoutEffect(() => {
    const { declination, subsolarLongitude } = solarAttitude(new Date());
    spin.current = 0;
    yaw.current = -subsolarLongitude;
    placeSun(declination, spin.current);
    if (group.current) group.current.rotation.y = yaw.current;
    // First focused frame starts a fly-to via the key change below.
    focusKey.current = null;
  }, []);

  useFrame((_, delta) => {
    const { declination, subsolarLongitude } = solarAttitude(new Date());
    const nextKey = focusKeyOf(focus);

    if (nextKey !== focusKey.current) {
      focusKey.current = nextKey;
      if (focus) {
        flyTarget.current = faceYawForLatLon(focus.latitude, focus.longitude);
        flying.current = true;
      } else {
        flying.current = false;
        // Resume coasting from wherever we are.
        spin.current = yaw.current + subsolarLongitude;
      }
    }

    if (flying.current) {
      const deltaYaw = shortestAngleDelta(yaw.current, flyTarget.current);
      const step = 1 - Math.exp(-delta * FLY_RATE);
      yaw.current += deltaYaw * step;

      if (Math.abs(shortestAngleDelta(yaw.current, flyTarget.current)) < FLY_SETTLE) {
        yaw.current = flyTarget.current;
        flying.current = false;
        // Rebase spin so free rotation continues from this attitude with no jump.
        spin.current = yaw.current + subsolarLongitude;
      }

      // Same earth/sun offset keeps the terminator geographically correct mid-fly.
      placeSun(declination, yaw.current + subsolarLongitude);
    } else {
      spin.current += delta * SPIN_RATE;
      yaw.current = -subsolarLongitude + spin.current;
      placeSun(declination, spin.current);
    }

    light.current?.position.copy(SUN_POSITION);
    if (group.current) group.current.rotation.y = yaw.current;
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
          <EarthReady onReady={onReady} />
        </Suspense>
        {focus ? (
          <PadMarker latitude={focus.latitude} longitude={focus.longitude} />
        ) : null}
      </group>
    </>
  );
}

/**
 * The one earth canvas. The desktop hero mounts it at up to 2x.
 * The phone band is small, so it always draws at 3x, even on a 2x screen.
 * Selection does not rebuild it, because the shell owns the mount.
 */
export default function GlobePanel({
  maxDpr = 2,
  onReady,
  focus = null,
}: {
  maxDpr?: number;
  onReady?: () => void;
  focus?: PadFocus | null;
}) {
  return (
    <div className="pointer-events-none h-full min-h-0 w-full">
      <Canvas
        dpr={maxDpr > 2 ? maxDpr : [1, maxDpr]}
        flat
        frameloop="always"
        // Layout size, not transformed getBoundingClientRect — keeps the
        // phone band centered if a parent ever animates with CSS transform.
        resize={{ offsetSize: true }}
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
        <OrientedGlobe onReady={onReady} focus={focus} />
      </Canvas>
    </div>
  );
}
