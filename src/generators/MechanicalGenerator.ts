/**
 * MechanicalGenerator - Procedural robot/mech generation
 * Generates robots, mechs, drones, and mechanical constructs
 */

import * as THREE from 'three';
import { BasePlugin } from '../plugins/BasePlugin.js';
import type {
  GeneratorPlugin,
  Character,
  CharacterType,
  GenerationParams,
  CharacterMetadata,
} from '../plugins/types.js';

interface MechProportions {
  coreSize: number;
  headSize: number;
  armCount: number;
  armLength: number;
  armWidth: number;
  legCount: number;
  legLength: number;
  legWidth: number;
  hasWheels: boolean;
  hasTreads: boolean;
  hasThrusters: boolean;
  antennaCount: number;
}

const MECH_PRESETS: Record<string, { proportions: Partial<MechProportions>; material: { color: number; roughness: number; metalness: number; emissive?: number } }> = {
  humanoid_robot: {
    proportions: {
      coreSize: 0.3,
      headSize: 0.12,
      armCount: 2,
      armLength: 0.5,
      armWidth: 0.06,
      legCount: 2,
      legLength: 0.6,
      legWidth: 0.08,
      antennaCount: 1,
    },
    material: { color: 0xc0c0c0, roughness: 0.3, metalness: 0.9 },
  },
  battle_mech: {
    proportions: {
      coreSize: 0.5,
      headSize: 0.15,
      armCount: 2,
      armLength: 0.7,
      armWidth: 0.12,
      legCount: 2,
      legLength: 0.8,
      legWidth: 0.15,
      hasThrusters: true,
    },
    material: { color: 0x2f4f4f, roughness: 0.5, metalness: 0.8 },
  },
  spider_bot: {
    proportions: {
      coreSize: 0.25,
      headSize: 0.1,
      armCount: 0,
      legCount: 8,
      legLength: 0.4,
      legWidth: 0.03,
    },
    material: { color: 0x1a1a1a, roughness: 0.4, metalness: 0.85, emissive: 0x001100 },
  },
  drone: {
    proportions: {
      coreSize: 0.2,
      headSize: 0,
      armCount: 4,
      armLength: 0.3,
      armWidth: 0.02,
      legCount: 0,
      hasThrusters: true,
    },
    material: { color: 0xffffff, roughness: 0.2, metalness: 0.7 },
  },
  tank_bot: {
    proportions: {
      coreSize: 0.4,
      headSize: 0.15,
      armCount: 1,
      armLength: 0.6,
      armWidth: 0.08,
      legCount: 0,
      hasTreads: true,
    },
    material: { color: 0x556b2f, roughness: 0.7, metalness: 0.6 },
  },
  wheeled_bot: {
    proportions: {
      coreSize: 0.25,
      headSize: 0.1,
      armCount: 2,
      armLength: 0.3,
      armWidth: 0.04,
      legCount: 0,
      hasWheels: true,
      antennaCount: 2,
    },
    material: { color: 0xff6600, roughness: 0.4, metalness: 0.7 },
  },
};

const DEFAULT_PROPORTIONS: MechProportions = {
  coreSize: 0.3,
  headSize: 0.12,
  armCount: 2,
  armLength: 0.5,
  armWidth: 0.06,
  legCount: 2,
  legLength: 0.5,
  legWidth: 0.08,
  hasWheels: false,
  hasTreads: false,
  hasThrusters: false,
  antennaCount: 0,
};

export class MechanicalGenerator extends BasePlugin implements GeneratorPlugin {
  readonly id = 'mechanical-generator';
  readonly name = 'Mechanical Generator';
  readonly version = '1.0.0';
  readonly type = 'generator' as const;

  private mechCount = 0;

  async generate(params: GenerationParams): Promise<Character> {
    this.assertReady();

    const presetKey = params.style || 'humanoid_robot';
    const preset = MECH_PRESETS[presetKey] ?? MECH_PRESETS['humanoid_robot'];
    if (!preset) {
      throw new Error(`Mech preset not found: ${presetKey}`);
    }

    const proportions: MechProportions = {
      ...DEFAULT_PROPORTIONS,
      ...preset.proportions,
    };

    const scale = params.options.detailLevel >= 0.5 ? 2.0 : 1.5;

    const primaryMaterial = new THREE.MeshStandardMaterial({
      color: preset.material.color,
      roughness: preset.material.roughness,
      metalness: preset.material.metalness,
      emissive: preset.material.emissive ?? 0x000000,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.9,
    });

    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
    });

    const mechRoot = this.buildMech(proportions, scale, primaryMaterial, accentMaterial, glowMaterial, presetKey);
    mechRoot.name = `mech-${++this.mechCount}`;

    const metadata = this.calculateMetadata(mechRoot);

    const character: Character = {
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: mechRoot.name,
      type: 'mechanical',
      model: mechRoot,
      metadata: {
        ...metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        plugins_used: [this.id],
      },
      generationParams: params,
    };

    return character;
  }

  private buildMech(
    props: MechProportions,
    scale: number,
    primaryMat: THREE.Material,
    accentMat: THREE.Material,
    glowMat: THREE.Material,
    style: string
  ): THREE.Group {
    const root = new THREE.Group();

    // Calculate base height based on mobility type
    let baseY = 0;
    if (props.legCount > 0) {
      baseY = props.legLength * scale;
    } else if (props.hasWheels) {
      baseY = 0.15 * scale;
    } else if (props.hasTreads) {
      baseY = 0.1 * scale;
    } else if (props.hasThrusters && style === 'drone') {
      baseY = 0.5 * scale;
    }

    // Core body
    const coreGeom = style === 'drone'
      ? new THREE.CylinderGeometry(props.coreSize * scale * 0.5, props.coreSize * scale * 0.5, props.coreSize * scale * 0.3, 8)
      : new THREE.BoxGeometry(props.coreSize * scale, props.coreSize * scale * 1.2, props.coreSize * scale * 0.8);
    const core = new THREE.Mesh(coreGeom, primaryMat);
    core.position.y = baseY + props.coreSize * scale * 0.6;
    core.name = 'core';
    root.add(core);

    // Add panel details
    this.addPanelDetails(root, core.position, props.coreSize * scale, accentMat);

    // Head
    if (props.headSize > 0) {
      const headGeom = new THREE.BoxGeometry(
        props.headSize * scale * 1.2,
        props.headSize * scale,
        props.headSize * scale
      );
      const head = new THREE.Mesh(headGeom, primaryMat);
      head.position.set(0, baseY + props.coreSize * scale * 1.3 + props.headSize * scale * 0.5, 0);
      head.name = 'head';
      root.add(head);

      // Visor/eyes
      this.addVisor(root, head.position, props.headSize * scale, glowMat);

      // Antennas
      for (let i = 0; i < props.antennaCount; i++) {
        this.addAntenna(root, head.position, props.headSize * scale, i, props.antennaCount, accentMat);
      }
    }

    // Arms
    for (let i = 0; i < props.armCount; i++) {
      if (style === 'drone') {
        this.addDroneArm(root, props, scale, i, primaryMat, glowMat);
      } else {
        this.addMechArm(root, props, scale, baseY, i, primaryMat, accentMat);
      }
    }

    // Legs
    for (let i = 0; i < props.legCount; i++) {
      if (style === 'spider_bot') {
        this.addSpiderLeg(root, props, scale, i, primaryMat);
      } else {
        this.addMechLeg(root, props, scale, i, primaryMat, accentMat);
      }
    }

    // Wheels
    if (props.hasWheels) {
      this.addWheels(root, props.coreSize * scale, accentMat);
    }

    // Treads
    if (props.hasTreads) {
      this.addTreads(root, props.coreSize * scale, accentMat);
    }

    // Thrusters
    if (props.hasThrusters) {
      this.addThrusters(root, props, scale, baseY, accentMat, glowMat, style);
    }

    return root;
  }

  private addPanelDetails(root: THREE.Group, corePos: THREE.Vector3, coreSize: number, material: THREE.Material): void {
    // Add some panel lines/details
    const panelGeom = new THREE.BoxGeometry(coreSize * 0.8, coreSize * 0.02, coreSize * 0.6);
    for (let i = 0; i < 3; i++) {
      const panel = new THREE.Mesh(panelGeom, material);
      panel.position.set(corePos.x, corePos.y - coreSize * 0.3 + i * coreSize * 0.3, corePos.z + coreSize * 0.35);
      panel.name = `panel_${i}`;
      root.add(panel);
    }
  }

  private addVisor(root: THREE.Group, headPos: THREE.Vector3, headSize: number, material: THREE.Material): void {
    const visorGeom = new THREE.BoxGeometry(headSize * 1.0, headSize * 0.3, headSize * 0.1);
    const visor = new THREE.Mesh(visorGeom, material);
    visor.position.set(headPos.x, headPos.y, headPos.z + headSize * 0.5);
    visor.name = 'visor';
    root.add(visor);
  }

  private addAntenna(
    root: THREE.Group,
    headPos: THREE.Vector3,
    headSize: number,
    index: number,
    total: number,
    material: THREE.Material
  ): void {
    const xOffset = total > 1 ? (index === 0 ? -1 : 1) * headSize * 0.4 : 0;
    const antennaGeom = new THREE.CylinderGeometry(headSize * 0.03, headSize * 0.02, headSize * 0.5, 6);
    const antenna = new THREE.Mesh(antennaGeom, material);
    antenna.position.set(headPos.x + xOffset, headPos.y + headSize * 0.7, headPos.z);
    antenna.name = `antenna_${index}`;
    root.add(antenna);
  }

  private addMechArm(
    root: THREE.Group,
    props: MechProportions,
    scale: number,
    baseY: number,
    index: number,
    primaryMat: THREE.Material,
    accentMat: THREE.Material
  ): void {
    const side = index % 2 === 0 ? 1 : -1;

    // Upper arm
    const upperGeom = new THREE.BoxGeometry(props.armWidth * scale, props.armLength * scale * 0.5, props.armWidth * scale * 0.8);
    const upper = new THREE.Mesh(upperGeom, primaryMat);
    const shoulderX = side * (props.coreSize * scale * 0.5 + props.armWidth * scale * 0.6);
    const shoulderY = baseY + props.coreSize * scale * 0.9;
    upper.position.set(shoulderX, shoulderY - props.armLength * scale * 0.25, 0);
    upper.name = `arm_upper_${index}`;
    root.add(upper);

    // Joint
    const jointGeom = new THREE.SphereGeometry(props.armWidth * scale * 0.6, 8, 6);
    const joint = new THREE.Mesh(jointGeom, accentMat);
    joint.position.set(shoulderX, shoulderY - props.armLength * scale * 0.5, 0);
    joint.name = `arm_joint_${index}`;
    root.add(joint);

    // Lower arm
    const lowerGeom = new THREE.BoxGeometry(props.armWidth * scale * 0.9, props.armLength * scale * 0.5, props.armWidth * scale * 0.7);
    const lower = new THREE.Mesh(lowerGeom, primaryMat);
    lower.position.set(shoulderX, shoulderY - props.armLength * scale * 0.75, 0);
    lower.name = `arm_lower_${index}`;
    root.add(lower);

    // Hand/gripper
    const handGeom = new THREE.BoxGeometry(props.armWidth * scale * 1.2, props.armWidth * scale * 0.8, props.armWidth * scale * 0.6);
    const hand = new THREE.Mesh(handGeom, accentMat);
    hand.position.set(shoulderX, shoulderY - props.armLength * scale, 0);
    hand.name = `arm_hand_${index}`;
    root.add(hand);
  }

  private addDroneArm(
    root: THREE.Group,
    props: MechProportions,
    scale: number,
    index: number,
    primaryMat: THREE.Material,
    glowMat: THREE.Material
  ): void {
    const angle = (index / props.armCount) * Math.PI * 2 + Math.PI / 4;

    // Arm strut
    const armGeom = new THREE.CylinderGeometry(props.armWidth * scale, props.armWidth * scale, props.armLength * scale, 6);
    const arm = new THREE.Mesh(armGeom, primaryMat);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = angle;
    arm.position.set(
      Math.cos(angle) * props.armLength * scale * 0.5,
      0.5 * scale,
      Math.sin(angle) * props.armLength * scale * 0.5
    );
    arm.name = `drone_arm_${index}`;
    root.add(arm);

    // Rotor housing
    const rotorHousingGeom = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.05 * scale, 8);
    const rotorHousing = new THREE.Mesh(rotorHousingGeom, primaryMat);
    rotorHousing.position.set(
      Math.cos(angle) * props.armLength * scale,
      0.5 * scale + 0.03 * scale,
      Math.sin(angle) * props.armLength * scale
    );
    rotorHousing.name = `rotor_housing_${index}`;
    root.add(rotorHousing);

    // Rotor (simplified as disc)
    const rotorGeom = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.01 * scale, 16);
    const rotor = new THREE.Mesh(rotorGeom, glowMat);
    rotor.position.copy(rotorHousing.position);
    rotor.position.y += 0.04 * scale;
    rotor.name = `rotor_${index}`;
    root.add(rotor);
  }

  private addMechLeg(
    root: THREE.Group,
    props: MechProportions,
    scale: number,
    index: number,
    primaryMat: THREE.Material,
    accentMat: THREE.Material
  ): void {
    const side = index % 2 === 0 ? 1 : -1;
    const zOffset = Math.floor(index / 2) * props.legWidth * scale * 2;

    // Hip joint
    const hipGeom = new THREE.SphereGeometry(props.legWidth * scale * 0.8, 8, 6);
    const hip = new THREE.Mesh(hipGeom, accentMat);
    const hipX = side * props.coreSize * scale * 0.3;
    const hipY = props.legLength * scale;
    hip.position.set(hipX, hipY, zOffset);
    hip.name = `leg_hip_${index}`;
    root.add(hip);

    // Upper leg
    const upperGeom = new THREE.BoxGeometry(props.legWidth * scale, props.legLength * scale * 0.5, props.legWidth * scale * 0.8);
    const upper = new THREE.Mesh(upperGeom, primaryMat);
    upper.position.set(hipX, hipY - props.legLength * scale * 0.25, zOffset);
    upper.name = `leg_upper_${index}`;
    root.add(upper);

    // Knee joint
    const kneeGeom = new THREE.SphereGeometry(props.legWidth * scale * 0.7, 8, 6);
    const knee = new THREE.Mesh(kneeGeom, accentMat);
    knee.position.set(hipX, hipY - props.legLength * scale * 0.5, zOffset);
    knee.name = `leg_knee_${index}`;
    root.add(knee);

    // Lower leg
    const lowerGeom = new THREE.BoxGeometry(props.legWidth * scale * 0.9, props.legLength * scale * 0.5, props.legWidth * scale * 0.7);
    const lower = new THREE.Mesh(lowerGeom, primaryMat);
    lower.position.set(hipX, hipY - props.legLength * scale * 0.75, zOffset);
    lower.name = `leg_lower_${index}`;
    root.add(lower);

    // Foot
    const footGeom = new THREE.BoxGeometry(props.legWidth * scale * 1.5, props.legWidth * scale * 0.3, props.legWidth * scale * 1.2);
    const foot = new THREE.Mesh(footGeom, accentMat);
    foot.position.set(hipX, props.legWidth * scale * 0.15, zOffset + props.legWidth * scale * 0.2);
    foot.name = `leg_foot_${index}`;
    root.add(foot);
  }

  private addSpiderLeg(
    root: THREE.Group,
    props: MechProportions,
    scale: number,
    index: number,
    material: THREE.Material
  ): void {
    const angle = (index / props.legCount) * Math.PI * 2;
    const segments = 3;
    const segmentLength = props.legLength * scale / segments;

    let prevPos = new THREE.Vector3(
      Math.cos(angle) * props.coreSize * scale * 0.4,
      props.coreSize * scale * 0.3,
      Math.sin(angle) * props.coreSize * scale * 0.4
    );

    for (let i = 0; i < segments; i++) {
      const segGeom = new THREE.CylinderGeometry(
        props.legWidth * scale * (1 - i * 0.2),
        props.legWidth * scale * (1 - (i + 1) * 0.2),
        segmentLength,
        6
      );
      const seg = new THREE.Mesh(segGeom, material);

      // Calculate next position with outward and downward movement
      const outward = 0.15 + i * 0.1;
      const downward = i < segments - 1 ? 0.1 : 0.3;
      const nextPos = new THREE.Vector3(
        prevPos.x + Math.cos(angle) * outward * scale,
        prevPos.y - downward * scale,
        prevPos.z + Math.sin(angle) * outward * scale
      );

      // Position at midpoint
      seg.position.set(
        (prevPos.x + nextPos.x) / 2,
        (prevPos.y + nextPos.y) / 2,
        (prevPos.z + nextPos.z) / 2
      );

      // Orient toward next segment
      seg.lookAt(nextPos);
      seg.rotateX(Math.PI / 2);

      seg.name = `spider_leg_${index}_seg_${i}`;
      root.add(seg);

      prevPos = nextPos;
    }
  }

  private addWheels(root: THREE.Group, coreSize: number, material: THREE.Material): void {
    const wheelRadius = coreSize * 0.3;
    const wheelWidth = coreSize * 0.15;
    const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);

    const positions = [
      { x: coreSize * 0.5, z: coreSize * 0.4 },
      { x: coreSize * 0.5, z: -coreSize * 0.4 },
      { x: -coreSize * 0.5, z: coreSize * 0.4 },
      { x: -coreSize * 0.5, z: -coreSize * 0.4 },
    ];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      if (pos) {
        const wheel = new THREE.Mesh(wheelGeom, material);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(pos.x, wheelRadius, pos.z);
        wheel.name = `wheel_${i}`;
        root.add(wheel);
      }
    }
  }

  private addTreads(root: THREE.Group, coreSize: number, material: THREE.Material): void {
    const treadGeom = new THREE.BoxGeometry(coreSize * 1.2, coreSize * 0.2, coreSize * 0.3);

    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? 1 : -1;
      const tread = new THREE.Mesh(treadGeom, material);
      tread.position.set(0, coreSize * 0.1, side * coreSize * 0.5);
      tread.name = `tread_${i}`;
      root.add(tread);
    }
  }

  private addThrusters(
    root: THREE.Group,
    props: MechProportions,
    scale: number,
    baseY: number,
    accentMat: THREE.Material,
    glowMat: THREE.Material,
    style: string
  ): void {
    const thrusterCount = style === 'drone' ? 0 : 2;

    for (let i = 0; i < thrusterCount; i++) {
      const side = i === 0 ? 1 : -1;
      const thrusterGeom = new THREE.CylinderGeometry(0.05 * scale, 0.08 * scale, 0.15 * scale, 8);
      const thruster = new THREE.Mesh(thrusterGeom, accentMat);
      thruster.position.set(
        side * props.coreSize * scale * 0.3,
        baseY + props.coreSize * scale * 0.2,
        -props.coreSize * scale * 0.4
      );
      thruster.name = `thruster_${i}`;
      root.add(thruster);

      // Glow effect
      const glowGeom = new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 0.05 * scale, 8);
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.copy(thruster.position);
      glow.position.y -= 0.1 * scale;
      glow.name = `thruster_glow_${i}`;
      root.add(glow);
    }
  }

  private calculateMetadata(model: THREE.Group): Omit<CharacterMetadata, 'createdAt' | 'updatedAt' | 'plugins_used'> {
    let vertices = 0;
    let faces = 0;
    const materials = new Set<THREE.Material>();

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
          const position = geometry.getAttribute('position');
          if (position) vertices += position.count;
          const index = geometry.getIndex();
          if (index) faces += index.count / 3;
          else if (position) faces += position.count / 3;
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => materials.add(m));
        } else {
          materials.add(child.material);
        }
      }
    });

    return { vertices, faces: Math.floor(faces), bones: 0, materials: materials.size };
  }

  getSupportedTypes(): CharacterType[] {
    return ['mechanical'];
  }

  getAvailableStyles(): string[] {
    return Object.keys(MECH_PRESETS);
  }
}
