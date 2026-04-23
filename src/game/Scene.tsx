import { Sky } from "@react-three/drei";
import { Player } from "./Player";
import { Street } from "./Street";
import { Hotspot } from "./Hotspot";

export function Scene() {
  return (
    <>
      <Sky sunPosition={[50, 20, -100]} turbidity={6} rayleigh={2} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <fog attach="fog" args={["#8a8578", 20, 90]} />

      <Street />

      <Hotspot id="chalk" position={[-4.2, 0, 10]} label="Lamppost" />
      <Hotspot id="reflection" position={[4.2, 0, -2]} label="Shop window" />
      <Hotspot id="newsstand" position={[-3.8, 0, -14]} label="Newsstand" />

      <Player />
    </>
  );
}
