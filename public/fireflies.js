import * as THREE from "three";


export function createLeafSnowfall(scene, count = 500) {
  const textureLoader = new THREE.TextureLoader();
  
  
  let leafTexture;
  try {
    leafTexture = textureLoader.load('./leaves.png');
    leafTexture.colorSpace = THREE.SRGBColorSpace;
  } catch (e) {
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64; 
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#90EE90';
    ctx.beginPath();
    ctx.ellipse(32, 32, 25, 15, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    leafTexture = new THREE.CanvasTexture(canvas);
  }

  
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const rotations = new Float32Array(count); 
  const rotationVelocities = new Float32Array(count); 

  for (let i = 0; i < count; i++) {
    
    positions[i * 3] = (Math.random() - 0.5) * 40; // x -20 to 20
    positions[i * 3 + 1] = Math.random() * 20; // y 0 to 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40; // z -20 to 20

    // Random falling velocity
    velocities[i * 3] = (Math.random() - 0.5) * 0.02; 
    velocities[i * 3 + 1] = -0.02 - Math.random() * 0.03; 
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02; 

    rotations[i] = Math.random() * Math.PI * 2;
    rotationVelocities[i] = (Math.random() - 0.5) * 0.05;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.userData.velocities = velocities;
  geometry.userData.rotations = rotations;
  geometry.userData.rotationVelocities = rotationVelocities;

  // Create material with the leaf texture
  const material = new THREE.PointsMaterial({
    map: leafTexture,
    transparent: true,
    size: 0.5,
    sizeAttenuation: true,
    depthWrite: false,
    alphaTest: 0.5,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  
  return {
    mesh: particles,
    update: function() {
      const positions = geometry.attributes.position.array;
      const velocities = geometry.userData.velocities;
      const rotations = geometry.userData.rotations;
      const rotationVelocities = geometry.userData.rotationVelocities;

      for (let i = 0; i < count; i++) {
       
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        
        rotations[i] += rotationVelocities[i];

       
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 20;
          positions[i * 3] = (Math.random() - 0.5) * 40;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }

       
        if (positions[i * 3] > 20) positions[i * 3] = -20;
        if (positions[i * 3] < -20) positions[i * 3] = 20;
        if (positions[i * 3 + 2] > 20) positions[i * 3 + 2] = -20;
        if (positions[i * 3 + 2] < -20) positions[i * 3 + 2] = 20;
      }

      geometry.attributes.position.needsUpdate = true;
    }
  };
}


export function createFireflies(count = 20) {
  const fireflies = [];
  
  for (let i = 0; i < count; i++) {
    
    const hue = Math.random(); 
    const saturation = 0.9 + Math.random() * 0.1; 
    const lightness = 0.5 + Math.random() * 0.2; 
    const color = new THREE.Color().setHSL(hue, saturation, lightness);
    const light = new THREE.PointLight(color, 0.8, 100);
    
    
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = 2 + Math.random() * 3;
    light.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
    
    
    light.userData.baseIntensity = 0.5;
    light.userData.maxIntensity = 1.5;
    light.userData.minIntensity = 0.1;
    light.userData.period = 4 + Math.random() * 4; 
    light.userData.offset = Math.random() * Math.PI * 2; 
    light.userData.elapsedTime = 0;
    
    light.userData.update = function() {
      this.elapsedTime += 1 / 60; 
      const cycle = (this.elapsedTime / this.period) * Math.PI * 2 + this.offset;
     
      const t = (Math.sin(cycle) + 1) / 2; 
      light.intensity = this.minIntensity + (this.maxIntensity - this.minIntensity) * t;
    };
    
    fireflies.push(light);
  }
  
  return fireflies;
}



export function createButtonFireflyLayer(count = 10) {
  // Return a harmless, hidden layer so callers can still set style properties
  // without triggering the visual firefly effects. This keeps callers' code
  // intact while disabling the effect.
  const layer = document.createElement('div');
  layer.className = 'btn-firefly-layer';
  layer.style.position = 'absolute';
  layer.style.pointerEvents = 'none';
  layer.style.width = '0px';
  layer.style.height = '0px';
  layer.style.zIndex = '9';
  layer.style.transformOrigin = 'center';
  layer.style.display = 'none';
  return layer;
}
