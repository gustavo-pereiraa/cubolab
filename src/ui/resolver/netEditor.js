import { FACES, createSolvedState } from '../../cube/state.js';
import { FACE_COLORS, FACE_NAMES } from '../../cube/colors.js';
import { h } from '../dom.js';

/** Ordem de desenho da cruz; a posição de cada face vem do CSS (.net__face--U etc.). */
const NET_ORDER = ['U', 'L', 'F', 'R', 'B', 'D'];

const faceLabel = { U: 'Cima', L: 'Esquerda', F: 'Frente', R: 'Direita', B: 'Trás', D: 'Baixo' };

/** Cubo aberto em cruz, com paleta. Avisa cada mudança por onChange(state). */
export function createNetEditor({ netRoot, paletteRoot, onChange }) {
  let state = createSolvedState();
  let selectedColor = FACES[0];
  const stickerButtons = new Map();
  const paletteButtons = new Map();

  function stickerLabel(index) {
    const face = FACES[Math.floor(index / 9)];
    const position = index % 9;
    const place = `Face ${FACE_NAMES[face]}, linha ${Math.floor(position / 3) + 1}, coluna ${(position % 3) + 1}`;
    const suffix = position === 4 ? ', centro fixo' : '';
    return `${place}${suffix}: ${FACE_COLORS[state[index]].name}`;
  }

  function renderSticker(index) {
    const button = stickerButtons.get(index);
    button.style.setProperty('--c', FACE_COLORS[state[index]].hex);
    button.setAttribute('aria-label', stickerLabel(index));
  }

  function renderPalette() {
    for (const [color, button] of paletteButtons) {
      const count = state.filter((value) => value === color).length;
      button.setAttribute('aria-pressed', String(color === selectedColor));
      button.classList.toggle('is-off-count', count !== 9);
      button.querySelector('.swatch__count').textContent = `${count}/9`;
    }
  }

  function highlight(indices) {
    for (const [index, button] of stickerButtons) {
      button.classList.toggle('is-invalid', indices.includes(index));
    }
  }

  /** Marca adesivos com leitura duvidosa; a marca some quando a pessoa pinta o adesivo. */
  function markUncertain(indices) {
    for (const [index, button] of stickerButtons) {
      button.classList.toggle('is-uncertain', indices.includes(index));
    }
  }

  function paint(index) {
    stickerButtons.get(index).classList.remove('is-uncertain');
    if (state[index] === selectedColor) return;
    state = state.with(index, selectedColor);
    renderSticker(index);
    renderPalette();
    onChange(state);
  }

  for (const face of NET_ORDER) {
    const faceStart = FACES.indexOf(face) * 9;
    const buttons = Array.from({ length: 9 }, (_, offset) => {
      const index = faceStart + offset;
      const isCenter = offset === 4;
      const button = h('button', {
        type: 'button',
        className: isCenter ? 'sticker sticker--center' : 'sticker',
        disabled: isCenter,
      });
      if (!isCenter) button.addEventListener('click', () => paint(index));
      stickerButtons.set(index, button);
      return button;
    });

    netRoot.append(
      h(
        'div',
        { className: `net__face net__face--${face}`, role: 'group', 'aria-label': `Face ${FACE_NAMES[face]}` },
        h('span', { className: 'net__label', 'aria-hidden': 'true' }, faceLabel[face]),
        h('div', { className: 'net__grid' }, ...buttons),
      ),
    );
  }

  for (const color of FACES) {
    const button = h(
      'button',
      { type: 'button', className: 'swatch' },
      h('span', { className: 'swatch__color', style: `--c: ${FACE_COLORS[color].hex}` }),
      h(
        'span',
        { className: 'swatch__text' },
        h('span', { className: 'swatch__name' }, FACE_COLORS[color].name),
        h('span', { className: 'swatch__count' }),
      ),
    );
    button.addEventListener('click', () => {
      selectedColor = color;
      renderPalette();
    });
    paletteButtons.set(color, button);
    paletteRoot.append(button);
  }

  function setState(next) {
    state = next;
    state.forEach((_, index) => renderSticker(index));
    renderPalette();
    highlight([]);
    markUncertain([]);
  }

  setState(state);

  return { getState: () => state, setState, highlight, markUncertain };
}
