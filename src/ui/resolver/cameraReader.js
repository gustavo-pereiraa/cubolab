import { FACES } from '../../cube/state.js';
import { guideRect, sampleGrid } from '../../vision/sampling.js';
import { h } from '../dom.js';

const SAMPLE_SIZE = 150;

/** Ordem de leitura: as quatro laterais girando o cubo, depois o topo e a base. */
const READING_STEPS = [
  { face: 'F', name: 'Verde', instruction: 'Mostre a face verde, com o amarelo para cima.' },
  { face: 'R', name: 'Laranja', instruction: 'Gire o cubo e mostre a face laranja, com o amarelo para cima.' },
  { face: 'B', name: 'Azul', instruction: 'Gire de novo e mostre a face azul, com o amarelo para cima.' },
  { face: 'L', name: 'Vermelha', instruction: 'Gire de novo e mostre a face vermelha, com o amarelo para cima.' },
  { face: 'U', name: 'Amarela', instruction: 'Mostre a face amarela, com o azul para cima.' },
  { face: 'D', name: 'Branca', instruction: 'Mostre a face branca, com o verde para cima.' },
];

const READING_DONE = 'Todas as faces foram lidas. Refaça alguma, se precisar, ou conclua a leitura.';

function cameraErrorMessage(error) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Este navegador não dá acesso à câmera nesta página. Pinte as cores manualmente.';
  }
  if (error?.name === 'NotAllowedError') {
    return 'O acesso à câmera foi negado. Libere a permissão no navegador ou pinte as cores manualmente.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
    return 'Nenhuma câmera foi encontrada. Pinte as cores manualmente.';
  }
  return 'Não foi possível abrir a câmera. Verifique se outro programa a está usando ou pinte as cores manualmente.';
}

/**
 * Janela de leitura pela câmera. As imagens ficam só no navegador: cada captura vira 9 cores
 * e nada é enviado ou salvo. Ao concluir, chama onComplete com as 54 cores na ordem do estado.
 */
export function createCameraReader({ elements, onComplete }) {
  const { dialog, video, viewer, instruction, status, faces, capture, finish, cancel } = elements;
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  let stream = null;
  let openId = 0;
  let readings = [];
  let currentStep = 0;

  const faceButtons = READING_STEPS.map((step, index) => {
    const preview = h('span', { className: 'read-face__grid', 'aria-hidden': 'true' });
    const state = h('span', { className: 'sr-only' });
    const button = h('button', { type: 'button', className: 'read-face' }, preview, step.name, state);
    button.addEventListener('click', () => {
      currentStep = index;
      render();
    });
    faces.append(h('li', {}, button));
    return { button, preview, state };
  });

  const isComplete = () => readings.every(Boolean);
  const isVideoReady = () => stream && video.videoWidth > 0;

  function render() {
    const isChoosing = currentStep === null;
    instruction.textContent = isChoosing ? READING_DONE : READING_STEPS[currentStep].instruction;
    capture.disabled = isChoosing || !isVideoReady();
    finish.hidden = !isComplete();
    capture.classList.toggle('btn--primary', !isChoosing);
    capture.classList.toggle('btn--secondary', isChoosing);

    faceButtons.forEach(({ button, preview, state }, index) => {
      const reading = readings[index];
      button.classList.toggle('is-current', index === currentStep);
      state.textContent = reading ? ', lida' : ', pendente';
      preview.replaceChildren(
        ...(reading ?? Array(9).fill(null)).map((rgb) =>
          h('i', rgb ? { style: `background: rgb(${rgb.join(' ')})` } : {}),
        ),
      );
    });
  }

  function stopCamera() {
    openId += 1;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
  }

  async function startCamera() {
    const id = openId;
    status.textContent = '';
    status.hidden = true;
    try {
      const opened = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (id !== openId) {
        opened.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = opened;
      // A câmera frontal aparece espelhada, como um espelho. Só a imagem exibida muda, não a lida.
      const facing = stream.getVideoTracks()[0]?.getSettings().facingMode;
      viewer.classList.toggle('is-mirrored', facing !== 'environment');
      video.srcObject = stream;
      await video.play();
    } catch (error) {
      if (id !== openId) return;
      status.textContent = cameraErrorMessage(error);
      status.hidden = false;
    }
    render();
  }

  function captureFace() {
    const { x, y, size } = guideRect(video.videoWidth, video.videoHeight);
    context.drawImage(video, x, y, size, size, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    readings[currentStep] = sampleGrid(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE));

    const next = readings.findIndex((reading) => !reading);
    currentStep = next === -1 ? null : next;
    render();
  }

  function finishReading() {
    const samples = new Array(54);
    READING_STEPS.forEach(({ face }, index) => {
      const start = FACES.indexOf(face) * 9;
      readings[index].forEach((rgb, offset) => {
        samples[start + offset] = rgb;
      });
    });
    dialog.close();
    onComplete(samples);
  }

  capture.addEventListener('click', captureFace);
  finish.addEventListener('click', finishReading);
  cancel.addEventListener('click', () => dialog.close());
  video.addEventListener('loadedmetadata', render);
  dialog.addEventListener('close', stopCamera);

  return {
    open() {
      readings = Array(READING_STEPS.length).fill(null);
      currentStep = 0;
      render();
      dialog.showModal();
      startCamera();
    },
  };
}
