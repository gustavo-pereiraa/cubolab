export const HOLD_MS = 300;

/** Quantas etapas uma resolução tem; a última termina junto com o cronômetro. */
const STAGE_COUNT = 4;

const STAGE_KEYS = ['cross', 'firstLayer', 'secondLayer', 'lastLayer'];

/**
 * Máquina de estados do cronômetro, sem interface: idle → holding → ready → running → idle.
 * Segurar por HOLD_MS deixa pronto, soltar inicia e apertar de novo para.
 * Soltar antes do tempo volta ao início, evitando largadas acidentais.
 */
export function createTimer({ now = () => performance.now() } = {}) {
  let state = 'idle';
  let heldAt = 0;
  let startedAt = 0;
  let trackStages = false;
  let marks = [];

  function buildSplits(totalMs) {
    if (!trackStages || marks.length !== STAGE_COUNT - 1) return null;
    const boundaries = [0, ...marks, totalMs];
    return Object.fromEntries(STAGE_KEYS.map((key, i) => [key, Math.round(boundaries[i + 1] - boundaries[i])]));
  }

  function stop() {
    const totalMs = Math.round(now() - startedAt);
    const result = { totalMs, splits: buildSplits(totalMs) };
    state = 'idle';
    return result;
  }

  return {
    getState: () => state,
    getElapsed: () => (state === 'running' ? now() - startedAt : 0),
    getMarkCount: () => marks.length,

    /** Tecla ou dedo para baixo. Devolve o resultado se isso parou o cronômetro. */
    press() {
      if (state === 'running') return stop();
      if (state === 'idle') {
        state = 'holding';
        heldAt = now();
      }
      return null;
    },

    /** Chamado a cada quadro: promove de holding para ready depois do tempo de espera. */
    update() {
      if (state === 'holding' && now() - heldAt >= HOLD_MS) state = 'ready';
    },

    /** Tecla ou dedo para cima. `withStages` define se esta resolução marca etapas. */
    release({ withStages = false } = {}) {
      this.update();
      if (state === 'ready') {
        state = 'running';
        startedAt = now();
        trackStages = withStages;
        marks = [];
      } else if (state === 'holding') {
        state = 'idle';
      }
    },

    /** Marca o fim da etapa atual; a marca da última etapa para o cronômetro e devolve o resultado. */
    mark() {
      if (state !== 'running' || !trackStages) return null;
      if (marks.length === STAGE_COUNT - 1) return stop();
      marks.push(now() - startedAt);
      return null;
    },

    /** Abandona o que estiver em andamento, sem gerar resultado. */
    cancel() {
      state = 'idle';
    },
  };
}
