import { Group, Vector3 } from 'three';
import { FACE_NORMALS } from '../cube/state.js';

const easeInOut = (t) => t * t * (3 - 2 * t);

/** Ângulo do giro: horário olhando de fora é negativo; o anti-horário faz o caminho mais curto. */
export function angleOf(turns) {
  return (-Math.PI / 2) * (turns === 3 ? -1 : turns);
}

/** Anima o giro de uma camada, prendendo temporariamente suas peças a um grupo central. */
export function createLayerAnimator(cubeMesh) {
  const pivot = new Group();
  cubeMesh.root.add(pivot);
  let active = null;

  function settle() {
    const { cubies, targetState, resolve } = active;
    active = null;
    pivot.quaternion.identity();
    cubeMesh.root.add(...cubies);
    cubeMesh.setState(targetState);
    resolve();
  }

  return {
    /** Inicia o giro e devolve uma promessa cumprida ao terminar. */
    start({ face, turns }, targetState, durationMs) {
      if (active) settle();
      return new Promise((resolve) => {
        const cubies = cubeMesh.layerOf(face);
        pivot.add(...cubies);
        active = {
          cubies,
          targetState,
          resolve,
          durationMs,
          axis: new Vector3(...FACE_NORMALS[face]),
          angle: angleOf(turns),
          startedAt: performance.now(),
        };
      });
    },

    /** Avança a animação até o instante atual. Devolve true se ainda há giro em andamento. */
    update(now) {
      if (!active) return false;
      const elapsed = Math.max(0, now - active.startedAt);
      const progress = active.durationMs > 0 ? Math.min(1, elapsed / active.durationMs) : 1;
      pivot.setRotationFromAxisAngle(active.axis, active.angle * easeInOut(progress));
      if (progress >= 1) settle();
      return Boolean(active);
    },

    /** Encerra na hora o giro em andamento, se houver. */
    finish() {
      if (active) settle();
    },
  };
}
