import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Color,
  NoToneMapping,
  PerspectiveCamera,
  SRGBColorSpace,
  type Group,
} from "three";

/**
 * Blue-marble map shipped with the three.js examples (NASA imagery, resized).
 * Served from /textures so the globe chunk can load it after first paint.
 */
const EARTH_MAP = "/textures/earth.jpg";

const ATMOSPHERE_COLOR = new Color("#67e8f9");

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform vec3 glowColor;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 2.6);
    gl_FragColor = vec4(glowColor, fresnel * 0.9);
  }
`;

function Earth() {
  const texture = useTexture(EARTH_MAP);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      {/* Tint cools the daylight map toward the console cyan. */}
      <meshBasicMaterial map={texture} color="#c5d8e6" />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.14}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        uniforms={{ glowColor: { value: ATMOSPHERE_COLOR } }}
        side={BackSide}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
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
    const distance = 1.32 / Math.tan(limit / 2);
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
    group.current.rotation.y += delta * 0.055;
  });

  return (
    <group ref={group} rotation={[0.32, 0.6, 0]}>
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <Atmosphere />
    </group>
  );
}

/**
 * Desktop hero globe. Owns the only WebGL canvas.
 * Mounted from the shell, outside the launch-keyed card, so selection does not rebuild it.
 */
export default function GlobePanel() {
  return (
    <div className="pointer-events-none h-full min-h-0 w-full">
      <Canvas
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.06, 4.2], fov: 34 }}
        style={{ width: "100%", height: "100%", display: "block" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = NoToneMapping;
        }}
      >
        <FrameCamera />
        <SpinningGlobe />
      </Canvas>
    </div>
  );
}
