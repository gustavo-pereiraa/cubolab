import { Group, Mesh, MeshLambertMaterial, MeshStandardMaterial, Quaternion, Shape, ShapeGeometry, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FACE_NORMALS, FACES, STICKERS } from '../cube/state.js';
import { FACE_COLORS } from '../cube/colors.js';

const CUBIE_SIZE = 0.97;
const STICKER_SIZE = 0.82;
const STICKER_RADIUS = 0.1;
const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.002;

function createStickerGeometry() {
  const half = STICKER_SIZE / 2;
  const r = STICKER_RADIUS;
  const shape = new Shape();
  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.quadraticCurveTo(half, -half, half, -half + r);
  shape.lineTo(half, half - r);
  shape.quadraticCurveTo(half, half, half - r, half);
  shape.lineTo(-half + r, half);
  shape.quadraticCurveTo(-half, half, -half, half - r);
  shape.lineTo(-half, -half + r);
  shape.quadraticCurveTo(-half, -half, -half + r, -half);
  return new ShapeGeometry(shape, 4);
}

/**
 * Cubo 3D com 26 peças. As peças só giram durante a animação: ao final, voltam ao lugar
 * e os adesivos são repintados, de modo que o modelo em src/cube continua sendo a única fonte da verdade.
 */
export function createCubeMesh() {
  const root = new Group();
  const cubies = new Map();
  const bodyGeometry = new RoundedBoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 3, 0.07);
  const bodyMaterial = new MeshStandardMaterial({ color: '#05080d', roughness: 0.6 });
  const stickerGeometry = createStickerGeometry();
  const materials = Object.fromEntries(
    FACES.map((face) => [face, new MeshLambertMaterial({ color: FACE_COLORS[face].hex })]),
  );
  const front = new Vector3(0, 0, 1);

  function getCubie(position) {
    const key = String(position);
    if (!cubies.has(key)) {
      const cubie = new Group();
      cubie.position.set(...position);
      cubie.userData.gridPosition = position;
      cubie.add(new Mesh(bodyGeometry, bodyMaterial));
      root.add(cubie);
      cubies.set(key, cubie);
    }
    return cubies.get(key);
  }

  const stickers = STICKERS.map(({ face, position, normal }) => {
    const mesh = new Mesh(stickerGeometry, materials[face]);
    const direction = new Vector3(...normal);
    mesh.position.copy(direction).multiplyScalar(STICKER_OFFSET);
    mesh.quaternion.copy(new Quaternion().setFromUnitVectors(front, direction));
    getCubie(position).add(mesh);
    return mesh;
  });

  return {
    root,

    /** Repinta os 54 adesivos conforme o estado. */
    setState(state) {
      stickers.forEach((mesh, index) => {
        mesh.material = materials[state[index]];
      });
    },

    /** Peças da camada de uma face, que giram juntas em um movimento. */
    layerOf(face) {
      const [x, y, z] = FACE_NORMALS[face];
      return [...cubies.values()].filter(({ userData: { gridPosition: p } }) => p[0] * x + p[1] * y + p[2] * z === 1);
    },
  };
}
