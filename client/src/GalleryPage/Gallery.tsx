import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";

import GalleryWorld from "./GalleryWorld";
import Light from "./mapObjects/Light";
import CollisionPlayerBody from "./mapObjects/CollisionPlayerBody";
import MovementController from "./components/MovementController";
import ViewRotateController from "./components/ViewRotateController";
import { BACKGROUND_COLORS } from "../@types/colors";
import { THEME } from "../@types/gallery";
import galleryStore from "../store/gallery.store";

export default function Gallery() {
  const { data, theme } = galleryStore();

  return (
    <Canvas
      shadows
      className="canvas-inner"
      camera={{ fov: 75, near: 0.1, far: 100, position: [0, 1.5, 5], rotation: [0.4, 0, 0] }}
      style={{ backgroundColor: (theme && BACKGROUND_COLORS[theme]) || THEME.DREAM }}
    >
      <Physics gravity={[0, -30, 0]}>
        <Light />
        <CollisionPlayerBody />
        <MovementController speed={5} />
        <ViewRotateController />
        <GalleryWorld data={data} />
      </Physics>
    </Canvas>
  );
}
