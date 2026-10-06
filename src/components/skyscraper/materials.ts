import {
  CanvasTexture,
  Color,
  DoubleSide,
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
} from "three";

/**
 * Injects a subtle world-space value noise into a standard material so large concrete
 * surfaces read as cast material rather than flat CG colour. Works with instancing.
 */
export function withSurfaceVariation<T extends MeshStandardMaterial>(material: T, strength: number, scale = 0.35): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNoiseStrength = { value: strength };
    shader.uniforms.uNoiseScale = { value: scale };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vNoisePos;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 aurelisWp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          aurelisWp = instanceMatrix * aurelisWp;
        #endif
        vNoisePos = (modelMatrix * aurelisWp).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vNoisePos;
        uniform float uNoiseStrength;
        uniform float uNoiseScale;
        float aHash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
        float aNoise(vec3 x){
          vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
          return mix(mix(mix(aHash(i+vec3(0,0,0)),aHash(i+vec3(1,0,0)),f.x),
                         mix(aHash(i+vec3(0,1,0)),aHash(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(aHash(i+vec3(0,0,1)),aHash(i+vec3(1,0,1)),f.x),
                         mix(aHash(i+vec3(0,1,1)),aHash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float aN = aNoise(vNoisePos * uNoiseScale) * 0.6 + aNoise(vNoisePos * uNoiseScale * 4.1) * 0.4;
        diffuseColor.rgb *= 1.0 + (aN - 0.5) * uNoiseStrength;`,
      );
  };
  material.customProgramCacheKey = () => `aurelis-noise-${strength}-${scale}`;
  return material;
}

export interface ArchitectureMaterials {
  slab: MeshStandardMaterial;
  concrete: MeshStandardMaterial;
  core: MeshStandardMaterial;
  raft: MeshStandardMaterial;
  frame: MeshStandardMaterial;
  glass: MeshPhysicalMaterial;
  balustrade: MeshPhysicalMaterial;
  planter: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  crane: MeshStandardMaterial;
  craneSolid: MeshStandardMaterial;
}

function latticeTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 9;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, size);
  ctx.moveTo(size, 0);
  ctx.lineTo(0, size);
  ctx.stroke();
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

export function createArchitectureMaterials(): ArchitectureMaterials {
  const lattice = latticeTexture();
  return {
    slab: withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#e4e2db"), roughness: 0.8 }), 0.06),
    concrete: withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#dad7cf"), roughness: 0.86 }), 0.1),
    core: withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#d0ccc3"), roughness: 0.9 }), 0.12, 0.22),
    raft: withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#c7c3b9"), roughness: 0.95 }), 0.14),
    frame: new MeshStandardMaterial({ color: new Color("#f8f7f3"), roughness: 0.38, metalness: 0.06 }),
    glass: new MeshPhysicalMaterial({
      color: new Color("#86999f"),
      metalness: 0.42,
      roughness: 0.035,
      envMapIntensity: 1.9,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      ior: 1.52,
      specularIntensity: 1,
    }),
    balustrade: new MeshPhysicalMaterial({
      color: new Color("#e3ecee"),
      metalness: 0.1,
      roughness: 0.08,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      envMapIntensity: 1.2,
      side: DoubleSide,
    }),
    planter: withSurfaceVariation(new MeshStandardMaterial({ color: new Color("#8f9a80"), roughness: 1 }), 0.35, 1.4),
    metal: new MeshStandardMaterial({ color: new Color("#b4b3ac"), metalness: 0.65, roughness: 0.38 }),
    crane: new MeshStandardMaterial({
      color: new Color("#c9bd9c"),
      metalness: 0.2,
      roughness: 0.6,
      alphaMap: lattice,
      alphaTest: 0.5,
      side: DoubleSide,
    }),
    craneSolid: new MeshStandardMaterial({ color: new Color("#d9cfb5"), metalness: 0.3, roughness: 0.55 }),
  };
}

export function disposeMaterials(materials: Record<string, Material>) {
  Object.values(materials).forEach((m) => {
    const anyM = m as MeshStandardMaterial;
    anyM.map?.dispose();
    anyM.alphaMap?.dispose();
    m.dispose();
  });
}

