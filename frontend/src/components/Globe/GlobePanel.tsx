import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
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
  globeSiteStatLine,
  latLonToUnit,
  samePad,
  shortestAngleDelta,
  type GlobeSite,
  type PadFocus,
  type PadSite,
} from "../../utils/globeFocus";
import { globeDrag } from "../../utils/globeInteraction";
import { GlobeSiteCopy } from "./GlobeSiteCopy";
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
/**
 * Horizontal drag: full canvas width ≈ half a turn (surface follows the finger).
 * Vertical motion is ignored — yaw only.
 */
const DRAG_TURN_PER_WIDTH = Math.PI;
/** Pixels before a press becomes a drag (keeps marker taps from spinning). */
const DRAG_THRESHOLD_PX = 4;
/** Exponential friction on fling velocity (higher = shorter coast). */
const INERTIA_FRICTION = 2.4;
/** Rad/s — below this, hand off to the idle spin. */
const INERTIA_STOP = 0.04;
/** Cap fling speed so a wild swipe can't blur the planet. */
const INERTIA_MAX = 3.2;
/** If the pointer sat still this long before release, drop momentum. */
const INERTIA_STALE_MS = 80;
/** Clamp rAF gaps so a hitch can't hurl the globe halfway around. */
const MAX_FRAME_DELTA = 1 / 20;
/**
 * Stay in the console cyan family (amber is already caution / provisional).
 * Selected = hot white core + bright cyan + beam;
 * queue pads = mid cyan; catalog sites = faintest (background geography).
 */
const MARKER_CORE = "#f8fafc";
const MARKER_GLOW = "#22d3ee";
const QUEUE_DOT = "#0891b2";
const CATALOG_DOT = "#155e75";
/** Invisible hit spheres — larger than the visible dots so hover is easy. */
const HIT_SCALE_CATALOG = 0.07;
const HIT_SCALE_QUEUE = 0.09;
const HIT_SCALE_FOCUS = 0.1;
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
      {/* Markers own pointer hits — earth/atmosphere must not block hover. */}
      <mesh material={materials.globeMaterial} raycast={() => {}}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <mesh material={materials.atmosphereMaterial} scale={1.04} raycast={() => {}}>
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
    // Slight margin past the atmosphere rim (scale 1.04) without letterboxing Earth.
    const distance = 1.1 / Math.tan(limit / 2);
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

function useMarkerMaterial(hex: string, opacity: number) {
  return useMemo(() => {
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
    });
    material.outputNode = vec4(color(hex), float(opacity));
    return material;
  }, [hex, opacity]);
}

function PadHoverTip({
  siteLabel,
  placeLabel = null,
  upcomingCount = 0,
  totalLaunchCount = 0,
}: {
  siteLabel: string;
  placeLabel?: string | null;
  upcomingCount?: number;
  totalLaunchCount?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 3, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-none select-none whitespace-nowrap rounded-sm border border-cyan-800/55 bg-[#020617]/92 px-2.5 py-1.5 font-mono shadow-[0_0_18px_rgba(8,145,178,0.18)] backdrop-blur-sm"
    >
      <GlobeSiteCopy
        siteLabel={siteLabel}
        placeLabel={placeLabel}
        statLine={globeSiteStatLine(upcomingCount, totalLaunchCount)}
        compact
      />
    </motion.div>
  );
}

/**
 * Invisible hover target + tip. Hit sphere is larger than the visible dot;
 * tip eases in/out and hides on the far side of the globe.
 */
function PadHoverTarget({
  point,
  siteLabel,
  placeLabel = null,
  upcomingCount = 0,
  totalLaunchCount = 0,
  hitScale = HIT_SCALE_QUEUE,
  onSelect,
}: {
  point: Vector3;
  siteLabel: string;
  placeLabel?: string | null;
  upcomingCount?: number;
  totalLaunchCount?: number;
  hitScale?: number;
  onSelect?: () => void;
}) {
  const hitRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [facing, setFacing] = useState(true);
  const { camera, gl } = useThree();
  const hit = useMarkerMaterial("#000000", 0);
  const world = useMemo(() => new Vector3(), []);
  const toCamera = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const mesh = hitRef.current;
    if (!mesh) return;
    mesh.getWorldPosition(world);
    toCamera.copy(camera.position).sub(world).normalize();
    const outward = world.clone().normalize();
    const nextFacing = outward.dot(toCamera) > 0.18;
    setFacing((prev) => (prev === nextFacing ? prev : nextFacing));
    if (globeDrag.active && hovered) setHovered(false);
  });

  const showTip = hovered && facing && !globeDrag.active && Boolean(siteLabel);

  return (
    <group>
      <mesh
        ref={hitRef}
        position={point.clone().multiplyScalar(1.016)}
        scale={hitScale}
        material={hit}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          if (!globeDrag.active) gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!globeDrag.active) gl.domElement.style.cursor = "grab";
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (globeDrag.suppressClick || globeDrag.active) return;
          onSelect?.();
        }}
      >
        <sphereGeometry args={[1, 10, 10]} />
      </mesh>
      <Html
        position={point.clone().multiplyScalar(1.08)}
        center
        style={{ pointerEvents: "none" }}
        zIndexRange={[20, 0]}
      >
        {/*
          Phone earth shell may CSS-scale the canvas; keep tip type at screen
          size via --earth-scale counter-scale (no-op when var is 1 / unset).
        */}
        <div className="globe-html-counter-scale">
          <AnimatePresence>
            {showTip ? (
              <PadHoverTip
                key="pad-tip"
                siteLabel={siteLabel}
                placeLabel={placeLabel}
                upcomingCount={upcomingCount}
                totalLaunchCount={totalLaunchCount}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </Html>
    </group>
  );
}

/** Active pad — white + cyan accent + beam (queue dots have none of that). */
function PadMarker({
  latitude,
  longitude,
  siteLabel = "Launch site",
  placeLabel = null,
  upcomingCount = 0,
  totalLaunchCount = 0,
  onSelect,
}: PadFocus & { onSelect?: () => void }) {
  const point = useMemo(() => latLonToUnit(latitude, longitude), [latitude, longitude]);
  const quaternion = useMemo(() => {
    const next = new Quaternion();
    next.setFromUnitVectors(UP, point.clone().normalize());
    return next;
  }, [point]);
  const core = useMarkerMaterial(MARKER_CORE, 1);
  const glow = useMarkerMaterial(MARKER_GLOW, 0.7);
  const beam = useMarkerMaterial(MARKER_GLOW, 0.65);
  const coreMesh = useRef<Mesh>(null);
  const glowMesh = useRef<Mesh>(null);
  const pulse = useRef(0);

  useFrame((_, delta) => {
    pulse.current += delta * 1.6;
    const pulseScale = 1 + Math.sin(pulse.current) * 0.06;
    coreMesh.current?.scale.setScalar(0.022 * pulseScale);
    glowMesh.current?.scale.setScalar(0.038 * pulseScale);
  });

  return (
    <group>
      <mesh
        ref={coreMesh}
        position={point.clone().multiplyScalar(1.014)}
        scale={0.022}
        material={core}
        raycast={() => {}}
      >
        <sphereGeometry args={[1, 16, 16]} />
      </mesh>
      <mesh
        ref={glowMesh}
        position={point.clone().multiplyScalar(1.014)}
        scale={0.038}
        material={glow}
        raycast={() => {}}
      >
        <sphereGeometry args={[1, 16, 16]} />
      </mesh>
      <mesh
        position={point.clone().multiplyScalar(1.055)}
        quaternion={quaternion}
        material={beam}
        raycast={() => {}}
      >
        <cylinderGeometry args={[0.0045, 0.001, 0.09, 8]} />
      </mesh>
      <PadHoverTarget
        point={point}
        siteLabel={siteLabel}
        placeLabel={placeLabel}
        upcomingCount={upcomingCount}
        totalLaunchCount={totalLaunchCount}
        hitScale={HIT_SCALE_FOCUS}
        onSelect={onSelect}
      />
    </group>
  );
}

/** Quiet catalog layer — active Earth sites without a queue pad marker. */
function SiteCatalog({
  sites,
  onSelectSite,
}: {
  sites: GlobeSite[];
  onSelectSite?: (site: GlobeSite) => void;
}) {
  const fill = useMarkerMaterial(CATALOG_DOT, 0.42);

  return (
    <group>
      {sites.map((site) => {
        const point = latLonToUnit(site.latitude, site.longitude);
        return (
          <group key={site.id}>
            <mesh
              position={point.clone().multiplyScalar(1.01)}
              scale={0.009}
              material={fill}
              raycast={() => {}}
            >
              <sphereGeometry args={[1, 8, 8]} />
            </mesh>
            <PadHoverTarget
              point={point}
              siteLabel={site.siteLabel}
              placeLabel={site.placeLabel}
              upcomingCount={site.upcomingCount}
              totalLaunchCount={site.totalLaunchCount}
              hitScale={HIT_SCALE_CATALOG}
              onSelect={onSelectSite ? () => onSelectSite(site) : undefined}
            />
          </group>
        );
      })}
    </group>
  );
}

/** Other upcoming pads — deeper cyan, no beam, smaller than the focus pin. */
function PadConstellation({
  pads,
  focus,
  onSelectPad,
}: {
  pads: PadSite[];
  focus?: PadFocus | null;
  onSelectPad?: (pad: PadSite) => void;
}) {
  const fill = useMarkerMaterial(QUEUE_DOT, 0.85);
  const sites = useMemo(
    () => pads.filter((pad) => !samePad(pad, focus)),
    [pads, focus],
  );

  return (
    <group>
      {sites.map((pad) => {
        const point = latLonToUnit(pad.latitude, pad.longitude);
        return (
          <group key={pad.id}>
            <mesh
              position={point.clone().multiplyScalar(1.012)}
              scale={0.015}
              material={fill}
              raycast={() => {}}
            >
              <sphereGeometry args={[1, 10, 10]} />
            </mesh>
            <PadHoverTarget
              point={point}
              siteLabel={pad.siteLabel}
              placeLabel={pad.placeLabel}
              upcomingCount={pad.upcomingCount}
              totalLaunchCount={pad.totalLaunchCount}
              hitScale={HIT_SCALE_QUEUE}
              onSelect={onSelectPad ? () => onSelectPad(pad) : undefined}
            />
          </group>
        );
      })}
    </group>
  );
}

function focusKeyOf(focus?: PadFocus | null): string | null {
  // Match constellation precision so feed jitter doesn't re-trigger fly-to.
  return focus
    ? `${focus.latitude.toFixed(3)},${focus.longitude.toFixed(3)}`
    : null;
}

/**
 * Globe yaw state machine.
 *
 * yaw is always authoritative for what you see.
 * spin only exists for idle sun-relative integration:
 *   yaw = -subsolarLongitude + spin  ⇔  spin = yaw + subsolarLongitude
 *
 * Modes: hold (pointer down) → drag → inertia → idle, plus fly-to.
 * Idle must never run while yaw has moved without rebasing spin — that
 * was the fling snap-back (stale spin rewrote yaw to an older attitude).
 */
function OrientedGlobe({
  onReady,
  focus,
  pads,
  sites,
  onSelectPad,
  onSelectSite,
}: {
  onReady?: () => void;
  focus?: PadFocus | null;
  pads: PadSite[];
  sites: GlobeSite[];
  onSelectPad?: (pad: PadSite) => void;
  onSelectSite?: (site: GlobeSite) => void;
}) {
  const group = useRef<Group>(null);
  const light = useRef<DirectionalLight>(null);
  const { gl, size } = useThree();
  /** Idle integrator; always rebound from yaw when leaving manual modes. */
  const spin = useRef(0);
  const yaw = useRef(0);
  const focusKey = useRef<string | null>(null);
  const flying = useRef(false);
  const flyTarget = useRef(0);
  /** Release fling velocity in rad/s; decays with friction until idle spin. */
  const inertiaVel = useRef(0);
  /** Press tracking — drag engages only after a small horizontal threshold. */
  const press = useRef<{
    pointerId: number;
    startX: number;
    lastX: number;
    lastAt: number;
    dragging: boolean;
  } | null>(null);
  const sizeWidth = useRef(size.width);
  sizeWidth.current = size.width;

  const syncSpinFromYaw = (subsolarLongitude: number) => {
    spin.current = yaw.current + subsolarLongitude;
  };

  useLayoutEffect(() => {
    const { declination, subsolarLongitude } = solarAttitude(new Date());
    spin.current = 0;
    yaw.current = -subsolarLongitude;
    inertiaVel.current = 0;
    placeSun(declination, yaw.current + subsolarLongitude);
    if (group.current) group.current.rotation.y = yaw.current;
    // First focused frame starts a fly-to via the key change below.
    focusKey.current = null;
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    el.style.cursor = "grab";

    const finishPointer = (pointerId: number) => {
      const state = press.current;
      if (!state || state.pointerId !== pointerId) return;

      if (state.dragging) {
        const stale = performance.now() - state.lastAt > INERTIA_STALE_MS;
        let vel = stale ? 0 : inertiaVel.current;
        vel = Math.max(-INERTIA_MAX, Math.min(INERTIA_MAX, vel));
        if (Math.abs(vel) < INERTIA_STOP) vel = 0;
        inertiaVel.current = vel;

        // Soft stop — lock spin to the view we actually have now.
        if (vel === 0) {
          const { subsolarLongitude } = solarAttitude(new Date());
          syncSpinFromYaw(subsolarLongitude);
        }

        globeDrag.active = false;
        el.style.cursor = "grab";
      } else {
        // Tap without drag — keep the held attitude, resume idle from here.
        inertiaVel.current = 0;
        const { subsolarLongitude } = solarAttitude(new Date());
        syncSpinFromYaw(subsolarLongitude);
      }

      press.current = null;
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      // Catch mid-fling / mid-idle: freeze the CURRENT view (not stale spin).
      const { subsolarLongitude } = solarAttitude(new Date());
      inertiaVel.current = 0;
      flying.current = false;
      globeDrag.suppressClick = false;
      syncSpinFromYaw(subsolarLongitude);

      press.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastAt: performance.now(),
        dragging: false,
      };
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const state = press.current;
      if (!state || state.pointerId !== event.pointerId) return;

      if (!state.dragging) {
        if (Math.abs(event.clientX - state.startX) < DRAG_THRESHOLD_PX) return;
        state.dragging = true;
        globeDrag.active = true;
        globeDrag.suppressClick = true;
        flying.current = false;
        inertiaVel.current = 0;
        el.style.cursor = "grabbing";
      }

      const now = performance.now();
      const dx = event.clientX - state.lastX;
      const dtSec = (now - state.lastAt) / 1000;
      state.lastX = event.clientX;
      state.lastAt = now;

      const width = Math.max(sizeWidth.current, 1);
      const dYaw = (dx / width) * DRAG_TURN_PER_WIDTH;
      // Surface follows the finger: drag right → front face moves right.
      yaw.current += dYaw;

      // Ignore hitchy gaps so a paused tab can't mint a huge fling velocity.
      if (dtSec > 0 && dtSec < 0.08) {
        const instant = dYaw / dtSec;
        inertiaVel.current = inertiaVel.current * 0.65 + instant * 0.35;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      finishPointer(event.pointerId);
    };

    const onPointerCancel = (event: PointerEvent) => {
      finishPointer(event.pointerId);
    };

    const onLostCapture = (event: PointerEvent) => {
      // pointerup already cleared press; only handle orphaned capture loss.
      if (!press.current || press.current.pointerId !== event.pointerId) return;
      finishPointer(event.pointerId);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("lostpointercapture", onLostCapture);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("lostpointercapture", onLostCapture);
      globeDrag.active = false;
      globeDrag.suppressClick = false;
      press.current = null;
      inertiaVel.current = 0;
      el.style.cursor = "";
      el.style.touchAction = "";
    };
  }, [gl]);

  const focusPad = useMemo(
    () => (focus ? pads.find((pad) => samePad(pad, focus)) ?? null : null),
    [focus, pads],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(Math.max(rawDelta, 0), MAX_FRAME_DELTA);
    const { declination, subsolarLongitude } = solarAttitude(new Date());
    const nextKey = focusKeyOf(focus);

    if (nextKey !== focusKey.current) {
      focusKey.current = nextKey;
      // Queue selection wins over press / fling.
      inertiaVel.current = 0;
      if (press.current) {
        const pointerId = press.current.pointerId;
        if (press.current.dragging) {
          globeDrag.active = false;
          gl.domElement.style.cursor = "grab";
        }
        press.current = null;
        try {
          gl.domElement.releasePointerCapture(pointerId);
        } catch {
          /* already released */
        }
      }
      if (focus) {
        flyTarget.current = faceYawForLatLon(focus.latitude, focus.longitude);
        flying.current = true;
      } else {
        flying.current = false;
        syncSpinFromYaw(subsolarLongitude);
      }
    }

    const holding = Boolean(press.current);
    const dragging = Boolean(press.current?.dragging);

    if (dragging) {
      // Yaw written by pointer handlers; keep terminator geographically locked.
      placeSun(declination, yaw.current + subsolarLongitude);
    } else if (holding) {
      // Finger down, not yet past threshold — freeze under the cursor.
      placeSun(declination, yaw.current + subsolarLongitude);
    } else if (flying.current) {
      inertiaVel.current = 0;
      const deltaYaw = shortestAngleDelta(yaw.current, flyTarget.current);
      const step = 1 - Math.exp(-delta * FLY_RATE);
      yaw.current += deltaYaw * step;

      if (Math.abs(shortestAngleDelta(yaw.current, flyTarget.current)) < FLY_SETTLE) {
        yaw.current = flyTarget.current;
        flying.current = false;
        syncSpinFromYaw(subsolarLongitude);
      }

      placeSun(declination, yaw.current + subsolarLongitude);
    } else if (Math.abs(inertiaVel.current) >= INERTIA_STOP) {
      yaw.current += inertiaVel.current * delta;
      inertiaVel.current *= Math.exp(-INERTIA_FRICTION * delta);
      if (Math.abs(inertiaVel.current) < INERTIA_STOP) {
        inertiaVel.current = 0;
        syncSpinFromYaw(subsolarLongitude);
      }
      placeSun(declination, yaw.current + subsolarLongitude);
    } else {
      // Idle — sun-relative coast. spin was synced whenever we entered idle.
      inertiaVel.current = 0;
      spin.current += delta * SPIN_RATE;
      yaw.current = -subsolarLongitude + spin.current;
      placeSun(declination, yaw.current + subsolarLongitude);
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
        stays on the real night side. Horizontal drag writes yaw the same way.
      */}
      <group ref={group}>
        <Suspense fallback={null}>
          <Earth />
          <EarthReady onReady={onReady} />
        </Suspense>
        <SiteCatalog sites={sites} onSelectSite={onSelectSite} />
        <PadConstellation pads={pads} focus={focus} onSelectPad={onSelectPad} />
        {focus ? (
          <PadMarker
            latitude={focus.latitude}
            longitude={focus.longitude}
            siteLabel={focus.siteLabel}
            placeLabel={focus.placeLabel}
            upcomingCount={focus.upcomingCount}
            totalLaunchCount={focus.totalLaunchCount}
            onSelect={
              focusPad && onSelectPad
                ? () => onSelectPad(focusPad)
                : undefined
            }
          />
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
  pads = [],
  sites = [],
  onSelectPad,
  onSelectSite,
}: {
  maxDpr?: number;
  onReady?: () => void;
  focus?: PadFocus | null;
  pads?: PadSite[];
  sites?: GlobeSite[];
  onSelectPad?: (pad: PadSite) => void;
  onSelectSite?: (site: GlobeSite) => void;
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
        // Parent is pointer-events-none; canvas must opt in for marker hover.
        style={{ width: "100%", height: "100%", display: "block", pointerEvents: "auto" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <FrameCamera />
        <OrientedGlobe
          onReady={onReady}
          focus={focus}
          pads={pads}
          sites={sites}
          onSelectPad={onSelectPad}
          onSelectSite={onSelectSite}
        />
      </Canvas>
    </div>
  );
}
