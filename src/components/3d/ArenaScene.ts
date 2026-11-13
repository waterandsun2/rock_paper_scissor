import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ProceduralHand, HandTheme } from './HandModel';
import { Choice, GameResult } from '../../types/game';

export type CameraView = 'duel' | 'action' | 'top';

// Pre-allocated math objects to prevent garbage collection in render loop
const _vec3 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

export class ArenaScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public playerHand: ProceduralHand;
  public cpuHand: ProceduralHand;

  // Particle & FX systems
  private sparkPoints: THREE.Points;
  private sparkVelocities: Float32Array;
  private sparkLifetimes: Float32Array;
  private shockwaveRing: THREE.Mesh;
  private shockwaveProgress = 1.0; // 0 to 1

  // Camera animation
  public currentCameraView: CameraView = 'duel';
  private targetCameraPos = new THREE.Vector3(0, 1.8, 5.5);
  private targetLookAt = new THREE.Vector3(0, 0.4, 0);
  private currentLookAt = new THREE.Vector3(0, 0.4, 0);
  private cameraShakeIntensity = 0;

  // Arena props
  private arenaBase: THREE.Group;
  private playerLight: THREE.PointLight;
  private cpuLight: THREE.PointLight;
  private clashLight: THREE.PointLight;

  // Timing & Defeat FX
  private elapsed = 0;
  private isDisposed = false;
  private dizzyStarsGroup: THREE.Group;
  public isDefeated = false;

  constructor(
    container: HTMLElement,
    isSoftwareGl: boolean,
    onPointerInteract?: (side: 'player' | 'cpu') => void
  ) {
    // 1. Scene & Horizon Fog (Bright vibrant arcade cosmic twilight)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1235);
    this.scene.fog = new THREE.FogExp2(0x1a1235, 0.04);

    // 2. Camera Setup (Expanded vertical FOV & distance so hands and fingers NEVER clip)
    const aspect = container.clientWidth / (container.clientHeight || 420);
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 50);
    this.camera.position.set(0, 1.9, 5.2);

    // 3. Renderer with PBR settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight || 420);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Bright & Youthful Lighting Rig (Warm sun key + cool neon fill + colorful rim)
    const hemiLight = new THREE.HemisphereLight(0xa5b4fc, 0x1e1b4b, 1.4);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.8);
    keyLight.position.set(3.5, 6.5, 4.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      const d = 4.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    this.scene.add(keyLight);

    // Fill Light with vivid cyan tone
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-4, 3, -2);
    this.scene.add(fillLight);

    // Dynamic Colored Accents for Player & CPU (Vibrant, high-energy)
    this.playerLight = new THREE.PointLight(0xf97316, 2.5, 7);
    this.playerLight.position.set(-2.0, 1.2, 0.8);
    this.scene.add(this.playerLight);

    this.cpuLight = new THREE.PointLight(0x06b6d4, 2.5, 7);
    this.cpuLight.position.set(2.0, 1.2, -0.4);
    this.scene.add(this.cpuLight);

    // Clash flash spotlight
    this.clashLight = new THREE.PointLight(0xffffff, 0, 10);
    this.clashLight.position.set(0, 1.2, 0);
    this.scene.add(this.clashLight);

    // 6. Cyber Arena Platform Dais
    this.arenaBase = this.createArenaPlatform();
    this.scene.add(this.arenaBase);

    // 7. Initialize Both 3D Hands
    this.playerHand = new ProceduralHand('player', 'classic');
    this.cpuHand = new ProceduralHand('cpu', 'classic');
    this.scene.add(this.playerHand.group);
    this.scene.add(this.cpuHand.group);

    // 8. Particle Sparks & Shockwave FX
    const { points, velocities, lifetimes } = this.createSparksSystem();
    this.sparkPoints = points;
    this.sparkVelocities = velocities;
    this.sparkLifetimes = lifetimes;
    this.scene.add(this.sparkPoints);

    this.shockwaveRing = this.createShockwaveRing();
    this.scene.add(this.shockwaveRing);

    // 9. Defeat dizzy stars halo FX
    this.dizzyStarsGroup = this.createDizzyStars();
    this.scene.add(this.dizzyStarsGroup);

    // Pre-warm shaders if not software GL
    if (!isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private createArenaPlatform(): THREE.Group {
    const group = new THREE.Group();

    // Stage 1: Main Platform Disk (Vibrant Neon Cyberpunk Stadium)
    const baseGeo = new THREE.CylinderGeometry(4.2, 4.6, 0.4, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x241a4a,
      metalness: 0.7,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.2;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Glowing Platform Edge Rim (Vibrant Neon Fuchsia Pink)
    const rimGeo = new THREE.TorusGeometry(4.22, 0.07, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.01;
    group.add(rimMesh);

    // Center Clash Grid Circle
    const gridCircleGeo = new THREE.CircleGeometry(2.2, 32);
    const gridCircleMat = new THREE.MeshStandardMaterial({
      color: 0x1c143d,
      roughness: 0.4,
      metalness: 0.5,
    });
    gridCircleMat.polygonOffset = true;
    gridCircleMat.polygonOffsetFactor = -1;
    gridCircleMat.polygonOffsetUnits = -1;
    const gridCircle = new THREE.Mesh(gridCircleGeo, gridCircleMat);
    gridCircle.rotation.x = -Math.PI / 2;
    gridCircle.position.y = 0.015;
    gridCircle.receiveShadow = true;
    group.add(gridCircle);

    // Inner Glowing Ring (Electric Cyber Cyan)
    const innerRingGeo = new THREE.RingGeometry(2.1, 2.18, 32);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.4,
      side: THREE.DoubleSide,
    });
    innerRingMat.polygonOffset = true;
    innerRingMat.polygonOffsetFactor = -1;
    innerRingMat.polygonOffsetUnits = -1;
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.02;
    group.add(innerRing);

    // Soft Radial Contact Grounding Shadow
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.41;
    group.add(shadowMesh);

    // Decorative Holographic Side Pillars
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const px = Math.cos(angle) * 3.8;
      const pz = Math.sin(angle) * 3.8;

      const pGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.2, 12);
      const pMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.9,
        roughness: 0.2,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(px, 0.6, pz);
      pMesh.castShadow = true;
      group.add(pMesh);

      // Glowing Beacon Top
      const bGeo = new THREE.SphereGeometry(0.1, 10, 8);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.5,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(px, 1.25, pz);
      group.add(bMesh);
    }

    return group;
  }

  private createSparksSystem() {
    const sparkCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities = new Float32Array(sparkCount * 3);
    const lifetimes = new Float32Array(sparkCount);

    for (let i = 0; i < sparkCount; i++) {
      // Hide all sparks below ground initially
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -50;
      positions[i * 3 + 2] = 0;
      lifetimes[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle sprite using procedural canvas texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(254, 240, 138, 0.8)');
      grad.addColorStop(0.8, 'rgba(245, 158, 11, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const pTex = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.25,
      map: pTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    return { points, velocities, lifetimes };
  }

  private createShockwaveRing(): THREE.Mesh {
    const geo = new THREE.RingGeometry(0.1, 0.3, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    return mesh;
  }

  private createDizzyStars(): THREE.Group {
    const group = new THREE.Group();
    group.visible = false;

    // Golden cartoon halo ring
    const ringGeo = new THREE.TorusGeometry(0.35, 0.016, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    group.add(ringMesh);

    // Orbiting Golden 3D Cartoon Stars
    const starGeo = new THREE.OctahedronGeometry(0.075, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffa200,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.2,
    });

    const starCount = 4;
    for (let i = 0; i < starCount; i++) {
      const angle = (i * Math.PI * 2) / starCount;
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(Math.cos(angle) * 0.35, Math.sin(angle) * 0.1, Math.sin(angle) * 0.35);
      group.add(star);
    }

    return group;
  }

  public setHandTheme(theme: HandTheme) {
    this.playerHand.setTheme(theme);
    this.cpuHand.setTheme(theme);
  }

  public setCameraView(view: CameraView) {
    this.currentCameraView = view;
    if (view === 'duel') {
      this.targetCameraPos.set(0, 1.85, 5.2);
      this.targetLookAt.set(0, 0.35, 0);
    } else if (view === 'action') {
      this.targetCameraPos.set(-0.6, 1.1, 4.0);
      this.targetLookAt.set(0.3, 0.5, 0);
    } else if (view === 'top') {
      this.targetCameraPos.set(0, 5.2, 2.2);
      this.targetLookAt.set(0, 0, 0);
    }
  }

  public triggerClashFX(result: GameResult, playerChoice: Choice, cpuChoice: Choice) {
    // 1. Camera Shake (Extra punchy screen shake on defeat)
    this.cameraShakeIntensity = result === 'lose' ? 0.36 : 0.18;

    // 2. Center flash light
    this.clashLight.intensity = result === 'lose' ? 6.0 : 4.5;
    if (result === 'win') this.clashLight.color.setHex(0x34d399); // Emerald flash
    else if (result === 'lose') this.clashLight.color.setHex(0xf43f5e); // Crimson flash
    else this.clashLight.color.setHex(0xf59e0b); // Amber flash

    // 3. Shockwave Ring
    this.shockwaveProgress = 0.0;
    this.shockwaveRing.scale.set(1, 1, 1);
    if (result === 'win') {
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
    } else if (result === 'lose') {
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
    } else {
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
    }

    // 4. Emit Sparks Burst
    const posAttr = this.sparkPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = this.sparkLifetimes.length;

    for (let i = 0; i < count; i++) {
      posAttr.setXYZ(i, 0, 0.6 + Math.random() * 0.4, 0.2);
      // Explode outward radially
      const angle = Math.random() * Math.PI * 2;
      const speed = result === 'lose' ? 2.5 + Math.random() * 5.5 : 2.0 + Math.random() * 4.5;
      this.sparkVelocities[i * 3] = Math.cos(angle) * speed;
      this.sparkVelocities[i * 3 + 1] = 1.5 + Math.random() * 4.0;
      this.sparkVelocities[i * 3 + 2] = Math.sin(angle) * speed;
      this.sparkLifetimes[i] = 1.0;
    }
    posAttr.needsUpdate = true;
  }

  public animateCountdownStep(step: number, playerChoice: Choice, cpuTempChoice: Choice) {
    // Jan-Ken-Pon rhythmic hand pump!
    // Step 1: Raise up
    // Step 2: Pump down & up
    // Step 3: Slam forward
    if (step === 1) {
      this.playerHand.targetPosition.set(-1.15, 0.55, 0.35);
      this.playerHand.targetRotation.set(-0.25, 0.5, -0.15);
      this.playerHand.setPose('ready');

      this.cpuHand.targetPosition.set(1.15, 0.55, -0.2);
      this.cpuHand.targetRotation.set(-0.25, -2.4, 0.15);
      this.cpuHand.setPose(cpuTempChoice);
    } else if (step === 2) {
      this.playerHand.targetPosition.set(-1.05, 0.05, 0.4);
      this.playerHand.targetRotation.set(0.08, 0.6, -0.08);
      this.playerHand.setPose('ready');

      this.cpuHand.targetPosition.set(1.05, 0.05, -0.2);
      this.cpuHand.targetRotation.set(0.08, -2.5, 0.08);
      this.cpuHand.setPose(cpuTempChoice);
    } else if (step === 3) {
      this.playerHand.targetPosition.set(-0.95, 0.65, 0.4);
      this.playerHand.targetRotation.set(-0.3, 0.5, -0.12);

      this.cpuHand.targetPosition.set(0.95, 0.65, -0.2);
      this.cpuHand.targetRotation.set(-0.3, -2.4, 0.12);
      this.cpuHand.setPose(cpuTempChoice);
    }
  }

  public animateReveal(playerChoice: Choice, cpuChoice: Choice, result: GameResult) {
    // Both hands surge forward into center stage!
    this.playerHand.setPose(playerChoice);
    this.cpuHand.setPose(cpuChoice);

    if (result === 'win') {
      this.isDefeated = false;
      this.dizzyStarsGroup.visible = false;
      // Player hand dominates center forward; CPU hand knocked back slightly
      this.playerHand.targetPosition.set(-0.35, 0.15, 0.3);
      this.playerHand.targetRotation.set(0.25, 0.75, -0.08);

      this.cpuHand.targetPosition.set(0.95, 0.2, -0.35);
      this.cpuHand.targetRotation.set(-0.35, -2.2, 0.35);
    } else if (result === 'lose') {
      // Defeat! Player knocked back & woozy, dizzy stars active
      this.isDefeated = true;
      this.dizzyStarsGroup.visible = true;

      this.playerHand.targetPosition.set(-1.05, 0.05, 0.45);
      this.playerHand.targetRotation.set(-0.55, 0.3, -0.4);

      this.cpuHand.targetPosition.set(0.35, 0.2, -0.15);
      this.cpuHand.targetRotation.set(0.25, -2.1, 0.1);
    } else {
      this.isDefeated = false;
      this.dizzyStarsGroup.visible = false;
      // Draw: symmetrical face-off in center
      this.playerHand.targetPosition.set(-0.5, 0.12, 0.25);
      this.playerHand.targetRotation.set(0.08, 0.7, 0);

      this.cpuHand.targetPosition.set(0.5, 0.12, -0.15);
      this.cpuHand.targetRotation.set(0.08, -2.3, 0);
    }

    this.triggerClashFX(result, playerChoice, cpuChoice);
  }

  public resetToIdle() {
    this.isDefeated = false;
    this.dizzyStarsGroup.visible = false;
    this.playerHand.setPose('idle');
    this.cpuHand.setPose('idle');
    this.playerHand.targetPosition.copy(this.playerHand.basePosition);
    this.playerHand.targetRotation.copy(this.playerHand.baseRotation);
    this.cpuHand.targetPosition.copy(this.cpuHand.basePosition);
    this.cpuHand.targetRotation.copy(this.cpuHand.baseRotation);
    this.shockwaveProgress = 1.0;
  }

  public update(delta: number) {
    if (this.isDisposed) return;
    this.elapsed += delta;

    // 1. Hands update
    this.playerHand.update(delta, this.elapsed);
    this.cpuHand.update(delta, this.elapsed);

    // Dizzy Stars halo & player comical defeat stagger
    if (this.isDefeated && this.dizzyStarsGroup.visible) {
      this.dizzyStarsGroup.position.set(
        this.playerHand.group.position.x,
        this.playerHand.group.position.y + 0.62,
        this.playerHand.group.position.z
      );
      this.dizzyStarsGroup.rotation.y += delta * 4.5;
      this.dizzyStarsGroup.position.y += Math.sin(this.elapsed * 6) * 0.035;

      // Spin child stars locally
      for (let i = 1; i < this.dizzyStarsGroup.children.length; i++) {
        this.dizzyStarsGroup.children[i].rotation.x += delta * 3;
        this.dizzyStarsGroup.children[i].rotation.y += delta * 4;
      }

      // Wobble / tremor on defeated player hand
      this.playerHand.group.rotation.z += Math.sin(this.elapsed * 12) * 0.045;
      this.playerHand.group.rotation.x += Math.cos(this.elapsed * 10) * 0.03;
    }

    // 2. Platform subtle glow pulsation
    this.playerLight.intensity = 1.8 + Math.sin(this.elapsed * 3) * 0.4;
    this.cpuLight.intensity = 1.8 + Math.cos(this.elapsed * 3) * 0.4;
    this.clashLight.intensity = THREE.MathUtils.damp(this.clashLight.intensity, 0, 8, delta);

    // 3. Shockwave Ring update
    if (this.shockwaveProgress < 1.0) {
      this.shockwaveProgress += delta * 2.2;
      const scale = 1.0 + this.shockwaveProgress * 12.0;
      this.shockwaveRing.scale.set(scale, scale, scale);
      const ringMat = this.shockwaveRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = Math.max(0, (1.0 - this.shockwaveProgress) * 0.85);
    } else {
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    // 4. Spark particles simulation
    const posAttr = this.sparkPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = this.sparkLifetimes.length;
    let anyAlive = false;

    for (let i = 0; i < count; i++) {
      if (this.sparkLifetimes[i] > 0) {
        anyAlive = true;
        this.sparkLifetimes[i] -= delta * 2.0;

        // Apply velocity & gravity
        const px = posAttr.getX(i) + this.sparkVelocities[i * 3] * delta;
        const py = posAttr.getY(i) + this.sparkVelocities[i * 3 + 1] * delta;
        const pz = posAttr.getZ(i) + this.sparkVelocities[i * 3 + 2] * delta;

        // Gravity pull
        this.sparkVelocities[i * 3 + 1] -= 9.8 * delta;

        posAttr.setXYZ(i, px, py, pz);
      } else {
        posAttr.setY(i, -50);
      }
    }
    if (anyAlive) posAttr.needsUpdate = true;

    // 5. Camera Interpolation with Exponential Damping
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.damp(this.cameraShakeIntensity, 0, 10, delta);
    }

    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      this.targetCameraPos.x + shakeX,
      6,
      delta
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      this.targetCameraPos.y + shakeY,
      6,
      delta
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      this.targetCameraPos.z,
      6,
      delta
    );

    this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, this.targetLookAt.x, 8, delta);
    this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, this.targetLookAt.y, 8, delta);
    this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, this.targetLookAt.z, 8, delta);
    this.camera.lookAt(this.currentLookAt);

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize(width: number, height: number) {
    if (this.isDisposed || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.isDisposed = true;
    this.playerHand.dispose();
    this.cpuHand.dispose();
    this.sparkPoints.geometry.dispose();
    (this.sparkPoints.material as THREE.Material).dispose();
    this.shockwaveRing.geometry.dispose();
    (this.shockwaveRing.material as THREE.Material).dispose();

    this.dizzyStarsGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.arenaBase.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
