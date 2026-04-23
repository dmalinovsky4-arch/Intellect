import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { Mesh, Vector3 } from "three";
import { HotspotId, hotspotNotes, useGame } from "./store";
import { playerRef } from "./Player";

const INTERACT_RADIUS = 2.2;

export function Hotspot({
  id,
  position,
  label,
  children,
}: {
  id: HotspotId;
  position: [number, number, number];
  label: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<Mesh>(null!);
  const tmp = useRef(new Vector3());
  const wasNear = useRef(false);
  const setNearby = useGame((s) => s.setNearby);
  const visit = useGame((s) => s.visit);
  const showNote = useGame((s) => s.showNote);
  const visited = useGame((s) => s.visited[id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "e") return;
      if (!playerRef.current) return;
      const d = playerRef.current.position.distanceTo(tmp.current.setFromMatrixPosition(ref.current.matrixWorld));
      if (d <= INTERACT_RADIUS) {
        visit(id);
        showNote(hotspotNotes[id]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, visit, showNote]);

  useFrame(() => {
    if (!playerRef.current) return;
    tmp.current.setFromMatrixPosition(ref.current.matrixWorld);
    const d = playerRef.current.position.distanceTo(tmp.current);
    const near = d <= INTERACT_RADIUS;
    if (near !== wasNear.current) {
      wasNear.current = near;
      setNearby(near ? id : null);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref} position={[0, 0.9, 0]}>
        <boxGeometry args={[0.8, 1.8, 0.8]} />
        <meshStandardMaterial
          color={visited ? "#4a6a4a" : "#b89c5a"}
          emissive={visited ? "#1a2a1a" : "#3a2e10"}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.2, 32]} />
        <meshBasicMaterial color={visited ? "#2a5a2a" : "#b89c5a"} transparent opacity={0.35} />
      </mesh>
      {children}
      {/* Label billboard omitted for scaffold; shown via HUD prompt instead */}
      <HotspotLabel label={label} />
    </group>
  );
}

function HotspotLabel({ label }: { label: string }) {
  // Placeholder: real implementation will use Drei <Billboard><Text/></Billboard>
  return <group name={label} />;
}
