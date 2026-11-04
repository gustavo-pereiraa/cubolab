import { AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCubeMesh } from './cubeMesh.js';
import { createLayerAnimator } from './animator.js';

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Monta a cena dentro do elemento recebido. Só redesenha quando algo muda
 * (giro da câmera, animação ou novo estado), para não gastar bateria à toa.
 * Lança um erro se o navegador não oferecer WebGL.
 */
export function createCubeView(container, { label }) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', label);
  container.append(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(5.6, 5.2, 8.6);

  // A luz acompanha a câmera, então as faces mudam de tom ao girar o cubo e ganham profundidade.
  const light = new DirectionalLight('#ffffff', 0.9);
  light.position.set(-2, 3, 4);
  camera.add(light);
  scene.add(camera, new AmbientLight('#ffffff', 2.5));

  const cubeMesh = createCubeMesh();
  scene.add(cubeMesh.root);
  const animator = createLayerAnimator(cubeMesh);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false; // a rolagem do mouse continua rolando a página
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;

  let frameRequest = 0;

  function invalidate() {
    if (!frameRequest) frameRequest = requestAnimationFrame(renderFrame);
  }

  function renderFrame(now) {
    frameRequest = 0;
    controls.update();
    const isAnimating = animator.update(now);
    renderer.render(scene, camera);
    if (isAnimating) invalidate();
  }

  controls.addEventListener('change', invalidate);

  new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = container;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  }).observe(container);

  return {
    setState(state) {
      animator.finish();
      cubeMesh.setState(state);
      invalidate();
    },

    /** Anima um movimento até o estado final e devolve uma promessa cumprida ao terminar. */
    animateMove(move, targetState, durationMs) {
      const finished = animator.start(move, targetState, prefersReducedMotion() ? 0 : durationMs);
      invalidate();
      return finished;
    },
  };
}
