import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Group } from "three";

const SPEED = 3.2;

export const playerRef: { current: Group | null } = { current: null };

export function Player() {
  const ref = useRef<Group>(null!);
  const keys = useRef<Record<string, boolean>>({});
  const { camera } = useThree();

  useEffect(() => {
    playerRef.current = ref.current;
    const down = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, dt) => {
    const dir = new Vector3();
    if (keys.current["w"] || keys.current["arrowup"]) dir.z -= 1;
    if (keys.current["s"] || keys.current["arrowdown"]) dir.z += 1;
    if (keys.current["a"] || keys.current["arrowleft"]) dir.x -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) dir.x += 1;
    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(SPEED * dt);
      ref.current.position.add(dir);
      ref.current.position.x = Math.max(-8, Math.min(8, ref.current.position.x));
      ref.current.position.z = Math.max(-40, Math.min(40, ref.current.position.z));
    }
    const p = ref.current.position;
    camera.position.lerp(new Vector3(p.x, 2.2, p.z + 5), 0.15);
    camera.lookAt(p.x, 1.2, p.z);
  });

  return (
    <group ref={ref} position={[0, 0, 30]}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.35, 1, 4, 8]} />
        <meshStandardMaterial color="#3a4a6a" />
      </mesh>
    </group>
  );
}
