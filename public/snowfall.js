import * as THREE from "three";

// Create leaf snowfall effect that integrates with existing scene and camera
export function createLeafSnowfall(scene, camera, count = 50) {
  const textureLoader = new THREE.TextureLoader();
  
  const geometry = new THREE.BufferGeometry();
  
  // Create particle positions - centered near camera view
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const rotationSpeeds = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15; // x: small spread
    positions[i * 3 + 1] = 5 + Math.random() * 8; // y: start from 5-13 (near camera at 1.6)
    positions[i * 3 + 2] = (Math.random() - 0.5) * 15; // z: small spread
    
    velocities[i * 3] = (Math.random() - 0.5) * 0.015; // x drift
    velocities[i * 3 + 1] = -0.015 - Math.random() * 0.01; // y falling down
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.015; // z drift
    
    rotationSpeeds[i] = Math.random() * 0.1; // Individual rotation speed per particle
  }
  
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.userData.velocities = velocities;
  geometry.userData.rotationSpeeds = rotationSpeeds;
  
  // Load leaves texture from models folder
  const leafTexture = textureLoader.load("./models/leaves.png");
  leafTexture.colorSpace = THREE.SRGBColorSpace;
  
  const mat = new THREE.PointsMaterial({
    map: leafTexture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true,
    alphaTest: 0.1,
    color: 0xffffff
  });
  mat.size = 2.0;
  
  const mesh = new THREE.Points(geometry, mat);
  scene.add(mesh);
  
  let elapsedTime = 0;
  
  return {
    mesh: mesh,
    update: function() {
      elapsedTime += 0.016; // ~60fps
      const positions = geometry.attributes.position.array;
      const velocities = geometry.userData.velocities;
      const rotationSpeeds = geometry.userData.rotationSpeeds;
      
      for (let i = 0; i < count; i++) {
        positions[i * 3] += velocities[i * 3] + Math.sin(elapsedTime * rotationSpeeds[i] + i) * 0.005; // Individual wobble
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2] + Math.cos(elapsedTime * rotationSpeeds[i] + i) * 0.005; // Individual wobble
        
        // Reset particle if fallen too low
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 5 + Math.random() * 8; // Reset to top
          positions[i * 3] = (Math.random() - 0.5) * 15;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
          rotationSpeeds[i] = Math.random() * 0.1; // Randomize for new particle
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
    }
  };
}

