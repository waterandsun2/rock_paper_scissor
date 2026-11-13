import * as THREE from 'three';
import { Choice } from '../../types/game';

export type HandTheme = 'classic' | 'pastel' | 'dark';

interface FingerJoints {
  base: THREE.Group;
  mid: THREE.Group;
  tip: THREE.Mesh;
}

export class ProceduralHand {
  public group: THREE.Group;
  public side: 'player' | 'cpu';
  public currentTheme: HandTheme = 'classic';

  // Kinematic components
  private wristGroup: THREE.Group;
  private sleeveMesh: THREE.Mesh;
  private shirtCuffMesh: THREE.Mesh;
  private wristMesh: THREE.Mesh;
  private palmMesh: THREE.Mesh;

  private thumb: FingerJoints;
  private index: FingerJoints;
  private middle: FingerJoints;
  private ring: FingerJoints;
  private pinky: FingerJoints;

  // Target poses
  private targetPose: Choice | 'idle' | 'ready' = 'idle';
  private currentPoseValues = {
    thumb: { rotX: 0.2, rotY: 0, rotZ: 0, midX: 0.2 },
    index: { rotX: 0.1, rotZ: 0.05, midX: 0.1 },
    middle: { rotX: 0.1, rotZ: 0, midX: 0.1 },
    ring: { rotX: 0.1, rotZ: -0.05, midX: 0.1 },
    pinky: { rotX: 0.1, rotZ: -0.1, midX: 0.1 },
  };

  // Base transforms
  public basePosition = new THREE.Vector3();
  public baseRotation = new THREE.Euler();
  public targetPosition = new THREE.Vector3();
  public targetRotation = new THREE.Euler();

  // Animation helpers
  private floatOffset = Math.random() * 10;
  private materials: {
    skin: THREE.MeshStandardMaterial;
    sleeve: THREE.MeshStandardMaterial;
    cuff: THREE.MeshStandardMaterial;
  };

  constructor(side: 'player' | 'cpu', theme: HandTheme = 'classic') {
    this.side = side;
    this.currentTheme = theme;
    this.group = new THREE.Group();

    // 1. Setup smooth cartoon clay materials matching reference photo
    this.materials = this.createMaterials(theme, side);

    // 2. Build Hierarchy
    this.wristGroup = new THREE.Group();
    this.group.add(this.wristGroup);

    // (A) Colored Suit Sleeve (Like in the reference photo)
    const sleeveGeo = new THREE.CylinderGeometry(0.56, 0.58, 0.75, 32);
    this.sleeveMesh = new THREE.Mesh(sleeveGeo, this.materials.sleeve);
    this.sleeveMesh.position.y = -0.9;
    this.sleeveMesh.castShadow = true;
    this.sleeveMesh.receiveShadow = true;
    this.wristGroup.add(this.sleeveMesh);

    // (B) White Shirt Collar / Cuff Ring
    const cuffGeo = new THREE.CylinderGeometry(0.57, 0.57, 0.2, 32);
    this.shirtCuffMesh = new THREE.Mesh(cuffGeo, this.materials.cuff);
    this.shirtCuffMesh.position.y = -0.45;
    this.shirtCuffMesh.castShadow = true;
    this.wristGroup.add(this.shirtCuffMesh);

    // (C) Soft Rounded Wrist
    const wristGeo = new THREE.CylinderGeometry(0.44, 0.48, 0.35, 32);
    this.wristMesh = new THREE.Mesh(wristGeo, this.materials.skin);
    this.wristMesh.position.y = -0.2;
    this.wristMesh.castShadow = true;
    this.wristGroup.add(this.wristMesh);

    // (D) Soft Cartoon Rounded Palm
    const palmGeo = new THREE.BoxGeometry(1.28, 1.25, 0.52);
    this.palmMesh = new THREE.Mesh(palmGeo, this.materials.skin);
    this.palmMesh.position.y = 0.55;
    this.palmMesh.castShadow = true;
    this.palmMesh.receiveShadow = true;
    this.wristGroup.add(this.palmMesh);

    // Rounded flesh smoothing for palm sides
    const palmSideLeftGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const palmSideLeft = new THREE.Mesh(palmSideLeftGeo, this.materials.skin);
    palmSideLeft.position.set(-0.55, 0.4, 0.05);
    palmSideLeft.scale.set(0.8, 1.3, 0.9);
    this.wristGroup.add(palmSideLeft);

    const palmSideRightGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const palmSideRight = new THREE.Mesh(palmSideRightGeo, this.materials.skin);
    palmSideRight.position.set(0.55, 0.4, 0.05);
    palmSideRight.scale.set(0.8, 1.3, 0.9);
    this.wristGroup.add(palmSideRight);

    // (E) Build 5 Smooth Cartoon Fingers matching photo
    const isPlayer = side === 'player';
    const thumbX = isPlayer ? -0.68 : 0.68;
    this.thumb = this.createFinger(0.18, 0.55, 0.48, new THREE.Vector3(thumbX, 0.28, 0.15), isPlayer ? 0.4 : -0.4);

    this.index = this.createFinger(0.16, 0.65, 0.52, new THREE.Vector3(isPlayer ? -0.42 : 0.42, 1.15, 0), 0.04);
    this.middle = this.createFinger(0.165, 0.72, 0.58, new THREE.Vector3(isPlayer ? -0.14 : 0.14, 1.18, 0), 0.0);
    this.ring = this.createFinger(0.155, 0.66, 0.54, new THREE.Vector3(isPlayer ? 0.14 : -0.14, 1.15, 0), -0.04);
    this.pinky = this.createFinger(0.14, 0.52, 0.44, new THREE.Vector3(isPlayer ? 0.42 : -0.42, 1.05, 0), -0.08);

    // Overall scale (substantially reduced so fingers never clip out of screen)
    this.group.scale.set(0.45, 0.45, 0.45);

    // Initial position based on side (grounded height so fingertips have ample headroom)
    if (side === 'player') {
      this.basePosition.set(-1.35, 0.05, 0.4);
      this.baseRotation.set(0.12, 0.55, -0.06);
    } else {
      this.basePosition.set(1.35, 0.05, -0.2);
      this.baseRotation.set(0.12, -2.5, 0.06);
    }

    this.group.position.copy(this.basePosition);
    this.group.rotation.copy(this.baseRotation);
    this.targetPosition.copy(this.basePosition);
    this.targetRotation.copy(this.baseRotation);
  }

  private createMaterials(theme: HandTheme, side: 'player' | 'cpu') {
    const isPlayer = side === 'player';

    // 1 Darker Hand (Player: Rich warm bronze-caramel) & 1 Much Darker Hand (CPU: Deep rich espresso-chocolate)
    const skinColor = isPlayer ? 0x8a4d2b : 0x381e11;

    // Sleeve Color (vibrant cyan suit cuff matching reference photo)
    let sleeveColor = isPlayer ? 0x00b4d8 : 0x8b5cf6; // Vibrant Sky Cyan (Player) vs Royal Violet (CPU)
    if (theme === 'pastel') {
      sleeveColor = isPlayer ? 0xf43f5e : 0x10b981; // Pastel Coral vs Emerald
    } else if (theme === 'dark') {
      sleeveColor = isPlayer ? 0x0f172a : 0x312e81; // Slate Suit vs Indigo Suit
    }

    return {
      skin: new THREE.MeshStandardMaterial({
        color: skinColor,
        roughness: 0.44,
        metalness: 0.02,
      }),
      sleeve: new THREE.MeshStandardMaterial({
        color: sleeveColor,
        roughness: 0.45,
        metalness: 0.05,
      }),
      cuff: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.25,
        metalness: 0.05,
      }),
    };
  }

  private createFinger(
    radius: number,
    len1: number,
    len2: number,
    pos: THREE.Vector3,
    rotZ: number
  ): FingerJoints {
    const baseGroup = new THREE.Group();
    baseGroup.position.copy(pos);
    baseGroup.rotation.z = rotZ;
    this.wristGroup.add(baseGroup);

    // Base knuckle (rounded cartoon joint)
    const knuckleGeo = new THREE.SphereGeometry(radius * 1.05, 16, 16);
    const knuckleMesh = new THREE.Mesh(knuckleGeo, this.materials.skin);
    knuckleMesh.castShadow = true;
    baseGroup.add(knuckleMesh);

    // Proximal segment (smooth cylinder)
    const p1Geo = new THREE.CylinderGeometry(radius * 0.98, radius * 1.02, len1, 20);
    const p1Mesh = new THREE.Mesh(p1Geo, this.materials.skin);
    p1Mesh.position.y = len1 / 2;
    p1Mesh.castShadow = true;
    p1Mesh.receiveShadow = true;
    baseGroup.add(p1Mesh);

    // Mid joint group
    const midGroup = new THREE.Group();
    midGroup.position.y = len1;
    baseGroup.add(midGroup);

    const midKnuckleGeo = new THREE.SphereGeometry(radius * 0.96, 16, 16);
    const midKnuckle = new THREE.Mesh(midKnuckleGeo, this.materials.skin);
    midKnuckle.castShadow = true;
    midGroup.add(midKnuckle);

    // Distal segment (phalanx)
    const p2Geo = new THREE.CylinderGeometry(radius * 0.9, radius * 0.96, len2, 20);
    const p2Mesh = new THREE.Mesh(p2Geo, this.materials.skin);
    p2Mesh.position.y = len2 / 2;
    p2Mesh.castShadow = true;
    p2Mesh.receiveShadow = true;
    midGroup.add(p2Mesh);

    // Smooth rounded fingertip dome (exactly like the rounded fingertips in the photo)
    const tipGeo = new THREE.SphereGeometry(radius * 0.92, 16, 16);
    const tipMesh = new THREE.Mesh(tipGeo, this.materials.skin);
    tipMesh.position.y = len2;
    tipMesh.castShadow = true;
    midGroup.add(tipMesh);

    return { base: baseGroup, mid: midGroup, tip: tipMesh };
  }

  public setTheme(theme: HandTheme) {
    this.currentTheme = theme;
    const newMats = this.createMaterials(theme, this.side);

    // Dispose old
    Object.values(this.materials).forEach((m) => m.dispose());
    this.materials = newMats;

    // Update meshes
    this.sleeveMesh.material = this.materials.sleeve;
    this.shirtCuffMesh.material = this.materials.cuff;
    this.wristMesh.material = this.materials.skin;
    this.palmMesh.material = this.materials.skin;

    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child === this.sleeveMesh) child.material = this.materials.sleeve;
        else if (child === this.shirtCuffMesh) child.material = this.materials.cuff;
        else child.material = this.materials.skin;
      }
    });
  }

  public setPose(pose: Choice | 'idle' | 'ready') {
    this.targetPose = pose;
  }

  public update(delta: number, elapsed: number) {
    // Gentle floating breathing motion
    this.floatOffset += delta * 2;
    const hoverY = Math.sin(this.floatOffset) * 0.05;

    // Target finger angles
    const targets = this.getPoseAngles(this.targetPose);

    // Smooth exponential damping on joint rotations
    const dampSpeed = 16;
    this.currentPoseValues.thumb.rotX = THREE.MathUtils.damp(this.currentPoseValues.thumb.rotX, targets.thumb.rotX, dampSpeed, delta);
    this.currentPoseValues.thumb.rotY = THREE.MathUtils.damp(this.currentPoseValues.thumb.rotY, targets.thumb.rotY, dampSpeed, delta);
    this.currentPoseValues.thumb.rotZ = THREE.MathUtils.damp(this.currentPoseValues.thumb.rotZ, targets.thumb.rotZ, dampSpeed, delta);
    this.currentPoseValues.thumb.midX = THREE.MathUtils.damp(this.currentPoseValues.thumb.midX, targets.thumb.midX, dampSpeed, delta);

    this.currentPoseValues.index.rotX = THREE.MathUtils.damp(this.currentPoseValues.index.rotX, targets.index.rotX, dampSpeed, delta);
    this.currentPoseValues.index.rotZ = THREE.MathUtils.damp(this.currentPoseValues.index.rotZ, targets.index.rotZ, dampSpeed, delta);
    this.currentPoseValues.index.midX = THREE.MathUtils.damp(this.currentPoseValues.index.midX, targets.index.midX, dampSpeed, delta);

    this.currentPoseValues.middle.rotX = THREE.MathUtils.damp(this.currentPoseValues.middle.rotX, targets.middle.rotX, dampSpeed, delta);
    this.currentPoseValues.middle.rotZ = THREE.MathUtils.damp(this.currentPoseValues.middle.rotZ, targets.middle.rotZ, dampSpeed, delta);
    this.currentPoseValues.middle.midX = THREE.MathUtils.damp(this.currentPoseValues.middle.midX, targets.middle.midX, dampSpeed, delta);

    this.currentPoseValues.ring.rotX = THREE.MathUtils.damp(this.currentPoseValues.ring.rotX, targets.ring.rotX, dampSpeed, delta);
    this.currentPoseValues.ring.rotZ = THREE.MathUtils.damp(this.currentPoseValues.ring.rotZ, targets.ring.rotZ, dampSpeed, delta);
    this.currentPoseValues.ring.midX = THREE.MathUtils.damp(this.currentPoseValues.ring.midX, targets.ring.midX, dampSpeed, delta);

    this.currentPoseValues.pinky.rotX = THREE.MathUtils.damp(this.currentPoseValues.pinky.rotX, targets.pinky.rotX, dampSpeed, delta);
    this.currentPoseValues.pinky.rotZ = THREE.MathUtils.damp(this.currentPoseValues.pinky.rotZ, targets.pinky.rotZ, dampSpeed, delta);
    this.currentPoseValues.pinky.midX = THREE.MathUtils.damp(this.currentPoseValues.pinky.midX, targets.pinky.midX, dampSpeed, delta);

    // Apply rotations
    this.thumb.base.rotation.x = this.currentPoseValues.thumb.rotX;
    this.thumb.base.rotation.y = this.currentPoseValues.thumb.rotY;
    this.thumb.base.rotation.z = this.currentPoseValues.thumb.rotZ;
    this.thumb.mid.rotation.x = this.currentPoseValues.thumb.midX;

    this.index.base.rotation.x = this.currentPoseValues.index.rotX;
    this.index.base.rotation.z = this.currentPoseValues.index.rotZ;
    this.index.mid.rotation.x = this.currentPoseValues.index.midX;

    this.middle.base.rotation.x = this.currentPoseValues.middle.rotX;
    this.middle.base.rotation.z = this.currentPoseValues.middle.rotZ;
    this.middle.mid.rotation.x = this.currentPoseValues.middle.midX;

    this.ring.base.rotation.x = this.currentPoseValues.ring.rotX;
    this.ring.base.rotation.z = this.currentPoseValues.ring.rotZ;
    this.ring.mid.rotation.x = this.currentPoseValues.ring.midX;

    this.pinky.base.rotation.x = this.currentPoseValues.pinky.rotX;
    this.pinky.base.rotation.z = this.currentPoseValues.pinky.rotZ;
    this.pinky.mid.rotation.x = this.currentPoseValues.pinky.midX;

    // Group position damping
    this.group.position.x = THREE.MathUtils.damp(this.group.position.x, this.targetPosition.x, 14, delta);
    this.group.position.y = THREE.MathUtils.damp(this.group.position.y, this.targetPosition.y + hoverY, 14, delta);
    this.group.position.z = THREE.MathUtils.damp(this.group.position.z, this.targetPosition.z, 14, delta);

    this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, this.targetRotation.x, 12, delta);
    this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, this.targetRotation.y, 12, delta);
    this.group.rotation.z = THREE.MathUtils.damp(this.group.rotation.z, this.targetRotation.z, 12, delta);
  }

  private getPoseAngles(pose: Choice | 'idle' | 'ready') {
    const isPlayer = this.side === 'player';

    if (pose === 'rock') {
      // Clenched cartoon fist (like the fist in the bottom center of the photo)
      return {
        thumb: { rotX: 1.25, rotY: isPlayer ? 0.8 : -0.8, rotZ: isPlayer ? -0.35 : 0.35, midX: 1.15 },
        index: { rotX: 1.62, rotZ: 0.04, midX: 1.5 },
        middle: { rotX: 1.66, rotZ: 0, midX: 1.55 },
        ring: { rotX: 1.66, rotZ: -0.04, midX: 1.55 },
        pinky: { rotX: 1.62, rotZ: -0.08, midX: 1.5 },
      };
    }

    if (pose === 'scissors') {
      // V-sign gesture: index & middle pointing straight up, ring & pinky curled in
      return {
        thumb: { rotX: 1.35, rotY: isPlayer ? 0.75 : -0.75, rotZ: isPlayer ? -0.45 : 0.45, midX: 1.15 },
        index: { rotX: -0.02, rotZ: isPlayer ? 0.22 : -0.22, midX: 0.0 },
        middle: { rotX: -0.02, rotZ: isPlayer ? -0.22 : 0.22, midX: 0.0 },
        ring: { rotX: 1.66, rotZ: -0.04, midX: 1.55 },
        pinky: { rotX: 1.62, rotZ: -0.08, midX: 1.5 },
      };
    }

    if (pose === 'paper') {
      // Open hand (exactly like the open hand on the bottom left of the photo!)
      return {
        thumb: { rotX: 0.1, rotY: isPlayer ? -0.45 : 0.45, rotZ: isPlayer ? 0.38 : -0.38, midX: 0.1 },
        index: { rotX: -0.02, rotZ: isPlayer ? 0.08 : -0.08, midX: 0.0 },
        middle: { rotX: 0.0, rotZ: 0, midX: 0.0 },
        ring: { rotX: -0.02, rotZ: isPlayer ? -0.08 : 0.08, midX: 0.0 },
        pinky: { rotX: -0.04, rotZ: isPlayer ? -0.16 : 0.16, midX: 0.0 },
      };
    }

    if (pose === 'ready') {
      // Pumping ready fist
      return {
        thumb: { rotX: 1.15, rotY: isPlayer ? 0.7 : -0.7, rotZ: isPlayer ? -0.3 : 0.3, midX: 1.0 },
        index: { rotX: 1.45, rotZ: 0.04, midX: 1.4 },
        middle: { rotX: 1.5, rotZ: 0, midX: 1.4 },
        ring: { rotX: 1.5, rotZ: -0.04, midX: 1.4 },
        pinky: { rotX: 1.45, rotZ: -0.08, midX: 1.4 },
      };
    }

    // Idle: relaxed, slightly curved natural fingers
    return {
      thumb: { rotX: 0.3, rotY: isPlayer ? 0.2 : -0.2, rotZ: isPlayer ? 0.15 : -0.15, midX: 0.2 },
      index: { rotX: 0.25, rotZ: isPlayer ? 0.08 : -0.08, midX: 0.2 },
      middle: { rotX: 0.25, rotZ: 0, midX: 0.2 },
      ring: { rotX: 0.25, rotZ: isPlayer ? -0.08 : 0.08, midX: 0.2 },
      pinky: { rotX: 0.28, rotZ: isPlayer ? -0.14 : 0.14, midX: 0.22 },
    };
  }

  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    Object.values(this.materials).forEach((m) => m.dispose());
  }
}
