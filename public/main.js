import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createButtonFireflyLayer } from './fireflies.js';
import { createLeafSnowfall } from './snowfall.js';

/* ===== OVERLAY ===== */
const overlay = document.getElementById("welcomePanel");
const panel = document.getElementById("welcomePanel");
const closeBtn = document.getElementById("closePanel");
const startBtn = document.getElementById("startBtn");

/* ===== SCENE ===== */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const fixedPosition = new THREE.Vector3(0, 1.6, 0);
camera.position.copy(fixedPosition);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* 🎬 START HIDDEN (cinematic) */
renderer.domElement.style.opacity = "0";
renderer.domElement.style.transition = "opacity 1.2s ease";

/* ===== CONTROLS ===== */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;
controls.minDistance = 0.001;
controls.maxDistance = 0.001;

/* ===== EFFECTS ===== */
const snowfall = createLeafSnowfall(scene, camera);

/* ===== BACKGROUND ===== */
const textureLoader = new THREE.TextureLoader();
textureLoader.load('./models/Material_diffuse.jpeg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromEquirectangular(texture).texture;

    scene.background = envMap;
    scene.environment = envMap;

    texture.dispose();
    pmrem.dispose();
}, undefined, (error) => {
    console.error('Error loading texture', error);
    scene.background = new THREE.Color(0x87ceeb);
});

/* ===== PATH BUTTONS ===== */
const paths = [
  { x: -6.2, y: 2, z: 5, label: 'Login / Register' },
  { x: 0, y: 2.2, z: -3, label: 'Upload Image' },
  { x: 3, y: 2.2, z: 2.8, label: 'Access Camera' },
];

const lookUpTarget = { x: 0, y: 2.5, z: 0 };
const pathVectors = paths.map((p) => new THREE.Vector3(p.x, p.y, p.z));
const projector = new THREE.Vector3();

controls.target.set(lookUpTarget.x, lookUpTarget.y, lookUpTarget.z);

const pathButtons = document.querySelectorAll('.path-btn');

/* ===== BUTTON LOGIC ===== */
pathButtons.forEach((btn, i) => {
  btn.textContent = paths[i].label;

  btn.addEventListener('click', async () => {

    // ❌ Block clicks if overlay is visible
    if (overlay && !overlay.classList.contains("hide")) {
      return;
    }

    // LOGIN
    if (i === 0) {
      if (!localStorage.getItem("token")) {
        await window.login();
        updateAuthButton();
      }
      return;
    }

    // UPLOAD
    if (i === 1) {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first!");
        return;
      }

      window.location.href = "/upload.html";
      return;
    }

    // CAMERA
    if (i === 2) {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first!");
        return;
      }

      window.location.href = "/camera.html";
      return;
    }

  });
});

/* ===== AUTH UI ===== */
function updateAuthButton() {
  const loginBtn = pathButtons[0];

  const token = localStorage.getItem("token");

  if (token) {
    loginBtn.textContent = "Logged In";
    loginBtn.disabled = true;
    loginBtn.style.opacity = "0.6";
    loginBtn.style.cursor = "not-allowed";
  } else {
    loginBtn.textContent = "Login / Register";
    loginBtn.disabled = false;
    loginBtn.style.opacity = "1";
    loginBtn.style.cursor = "pointer";
  }
}

updateAuthButton();

/* ===== OVERLAY CLOSE ===== */
function closePanel() {
  panel.classList.add("hide");

  setTimeout(() => {
    panel.style.display = "none";

    // 🎬 Fade in 3D scene
    renderer.domElement.style.opacity = "1";

  }, 800);
}

closeBtn?.addEventListener("click", closePanel);
startBtn?.addEventListener("click", closePanel);

/* ===== FIREFLY EFFECT ===== */
const fireflyLayers = [];
pathButtons.forEach((btn, i) => {
  const layer = createButtonFireflyLayer(10);
  document.body.appendChild(layer);
  fireflyLayers[i] = layer;
});

/* ===== POSITION UPDATE ===== */
function updateButtonPositions() {
  camera.updateMatrixWorld(true);

  pathButtons.forEach((btn, i) => {
    const vec = pathVectors[i].clone();
    projector.copy(vec).project(camera);

    if (projector.z < 1 && projector.z > -1) {
      const x = projector.x * 0.5 + 0.5;
      const y = -projector.y * 0.5 + 0.5;

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        btn.style.display = 'block';
        btn.style.left = `${x * window.innerWidth}px`;
        btn.style.top = `${y * window.innerHeight}px`;

        const layer = fireflyLayers[i];
        if (layer) {
          layer.style.left = btn.style.left;
          layer.style.top = btn.style.top;
          layer.style.display = 'block';
        }

      } else {
        btn.style.display = 'none';
        if (fireflyLayers[i]) fireflyLayers[i].style.display = 'none';
      }

    } else {
      btn.style.display = 'none';
      if (fireflyLayers[i]) fireflyLayers[i].style.display = 'none';
    }
  });
}

/* ===== LOOP ===== */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateButtonPositions();
  snowfall.update();
  renderer.render(scene, camera);
}
animate();

/* ===== RESIZE ===== */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});