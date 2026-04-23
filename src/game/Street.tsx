import { useMemo } from "react";

function Building({
  x,
  z,
  w,
  d,
  h,
  color,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}) {
  return (
    <mesh position={[x, h / 2, z]} receiveShadow castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function Street() {
  const facades = useMemo(() => {
    const rows: Array<{ x: number; z: number; w: number; d: number; h: number; color: string }> = [];
    const palette = ["#6b5a48", "#7a6a54", "#5a5040", "#82705a"];
    for (let z = -36; z <= 36; z += 9) {
      const h = 6 + ((z * 7) % 5);
      rows.push({ x: -11, z, w: 6, d: 8, h, color: palette[(z + 36) % 4] });
      rows.push({ x: 11, z: z + 4, w: 6, d: 8, h: h + 1, color: palette[(z + 40) % 4] });
    }
    return rows;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[6, 90]} />
        <meshStandardMaterial color="#3a3836" />
      </mesh>
      {facades.map((b, i) => (
        <Building key={i} {...b} />
      ))}
    </group>
  );
}
