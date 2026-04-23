import { Canvas } from "@react-three/fiber";
import { Scene } from "./game/Scene";
import { HUD } from "./game/HUD";

export default function App() {
  return (
    <>
      <Canvas shadows camera={{ fov: 60, position: [0, 2.2, 35] }}>
        <Scene />
      </Canvas>
      <HUD />
    </>
  );
}
