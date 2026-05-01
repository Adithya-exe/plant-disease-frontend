import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js";
import { createButtonFireflyLayer } from './fireflies.js';
import { createLeafSnowfall } from './snowfall.js';

/* ================= FIREBASE ================= */
firebase.initializeApp({
  apiKey: "YOUR_KEY",
  authDomain: "pdd-finalyear.firebaseapp.com",
});

const auth = firebase.auth();

/* ===== AUTH HELPER ===== */
function getUser() {
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      resolve(user);
    });
  });
}

/* ================= OVERLAY ================= */
const overlay = document.getElementById("welcomePanel");
const panel = document.getElementById("welcomePanel");
const closeBtn = document.getElementById("closePanel");
const startBtn = document.getElementById("startBtn");

/* ================= SCENE ================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 1.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* 🎬 cinematic start */
renderer.domElement.style.opacity = "0";
renderer.domElement.style.transition = "opacity 1.2s ease";

/* ================= CONTROLS ================= */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;

/* ================= EFFECTS ================= */
const snowfall = createLeafSnowfall(scene, camera);

/* ================= BACKGROUND ================= */
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
});

/* ================= PATH BUTTONS ================= */
const paths = [
  { label: "Login / Register", x: -6.2, y: 2, z: 5 },
  { label: "Upload Image", x: 0, y: 2.2, z: -3 },
  { label: "Access Camera", x: 3, y: 2.2, z: 2.8 }
];

const pathVectors = paths.map(p => new THREE.Vector3(p.x, p.y, p.z));
const projector = new THREE.Vector3();

const pathButtons = document.querySelectorAll(".path-btn");

/* ================= AUTH UI ================= */
auth.onAuthStateChanged(user => {
  const loginBtn = pathButtons[0];

  if (user) {
    loginBtn.textContent = "Logged In";
    loginBtn.disabled = true;
    loginBtn.style.opacity = "0.6";
  } else {
    loginBtn.textContent = "Login / Register";
    loginBtn.disabled = false;
    loginBtn.style.opacity = "1";
  }
});

/* ================= BUTTON LOGIC ================= */
pathButtons.forEach((btn, i) => {

  btn.textContent = paths[i].label;

  btn.addEventListener("click", async () => {

    const user = await getUser();

    // LOGIN
    if (i === 0) {
      if (!user) {
        await window.login();
      }
      return;
    }

    // UPLOAD
    if (i === 1) {
      if (!user) return alert("Please login first!");
      window.location.href = "/upload.html";
      return;
    }

    // CAMERA
    if (i === 2) {
      if (!user) return alert("Please login first!");
      window.location.href = "/camera.html";
      return;
    }
  });
});

/* ================= OVERLAY ================= */
function closePanel() {
  panel.classList.add("hide");

  setTimeout(() => {
    panel.style.display = "none";
    renderer.domElement.style.opacity = "1";
  }, 800);
}

closeBtn?.addEventListener("click", closePanel);
startBtn?.addEventListener("click", closePanel);

/* ================= FIREFLIES ================= */
const fireflyLayers = [];

pathButtons.forEach((btn, i) => {
  const layer = createButtonFireflyLayer(10);
  document.body.appendChild(layer);
  fireflyLayers[i] = layer;
});

/* ================= POSITION UPDATE ================= */
function updateButtonPositions() {

  camera.updateMatrixWorld(true);

  pathButtons.forEach((btn, i) => {

    const vec = pathVectors[i].clone();
    projector.copy(vec).project(camera);

    if (projector.z < 1 && projector.z > -1) {

      const x = projector.x * 0.5 + 0.5;
      const y = -projector.y * 0.5 + 0.5;

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {

        btn.style.display = "block";
        btn.style.left = `${x * window.innerWidth}px`;
        btn.style.top = `${y * window.innerHeight}px`;

        if (fireflyLayers[i]) {
          fireflyLayers[i].style.left = btn.style.left;
          fireflyLayers[i].style.top = btn.style.top;
          fireflyLayers[i].style.display = "block";
        }

      } else {
        btn.style.display = "none";
        if (fireflyLayers[i]) fireflyLayers[i].style.display = "none";
      }

    } else {
      btn.style.display = "none";
      if (fireflyLayers[i]) fireflyLayers[i].style.display = "none";
    }
  });
}

/* ================= ANIMATE ================= */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateButtonPositions();
  snowfall.update();
  renderer.render(scene, camera);
}
animate();

/* ================= RESIZE ================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
