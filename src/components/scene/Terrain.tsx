"use client";

import { useEffect, useMemo } from "react";
import { BufferAttribute, Color, MeshStandardMaterial, PlaneGeometry } from "three";
import { fbm, smoothstep } from "@/lib/math";
import { RIVER_LEVEL, riverZ, terrainHeight } from "@/lib/site";
import { PIT } from "@/lib/tower";
import { SITE_GROUND_COLOR, SITE_NOISE } from "./palette";

const SIZE = 5200;

/**
 * Large-scale landform: a perfectly graded development plateau that eases into dry,
 * muted meadow and a distant, hazy ridge. The excavation footprint is cut out in the
 * shader so the foundation can be dug into it.
 */
export function Terrain({ segments = 260 }: { segments?: number }) {
  const { geometry, material } = useMemo(() => {
    const geometry = new PlaneGeometry(SIZE, SIZE, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    const site = SITE_GROUND_COLOR;
    const meadowA = new Color("#c2bc9b"); // dry, sun-bleached grass
    const meadowB = new Color("#a9ac8c"); // sage
    const meadowC = new Color("#d3cbb2"); // pale limestone patches
    const far = new Color("#cfccbf");
    const riverBank = new Color("#9ea487");
    const c = new Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, terrainHeight(x, z));

      const r = Math.hypot(x, z - 10);
      const n = fbm(x * 0.0025, z * 0.0025, 3);
      const n2 = fbm(x * 0.009 + 40, z * 0.009 - 12, 2);
      c.copy(meadowA).lerp(meadowB, smoothstep(-0.25, 0.35, n));
      c.lerp(meadowC, smoothstep(0.1, 0.5, n2) * 0.35);
      // Lusher, slightly darker banks along the river
      const bank = 1 - smoothstep(20, 90, Math.abs(z - riverZ(x)));
      c.lerp(riverBank, bank * 0.7);
      c.lerp(far, smoothstep(700, 1800, r));
      // Graded development pad: a softened rectangle that reads as a prepared site.
      const pad = Math.max(Math.abs(x) / 118, Math.abs(z - 14) / 98);
      c.lerp(site, 1 - smoothstep(0.96, 1.06, pad));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uPit = { value: [PIT.cx - PIT.w / 2, PIT.cx + PIT.w / 2, PIT.cz - PIT.d / 2, PIT.cz + PIT.d / 2] };
      shader.uniforms.uNoise = { value: [SITE_NOISE.strength, SITE_NOISE.scale] };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vTerrainPos;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvTerrainPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          varying vec3 vTerrainPos;
          uniform vec4 uPit;
          uniform vec2 uNoise;
          float tHash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
          float tNoise(vec3 x){
            vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
            return mix(mix(mix(tHash(i+vec3(0,0,0)),tHash(i+vec3(1,0,0)),f.x),
                           mix(tHash(i+vec3(0,1,0)),tHash(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(tHash(i+vec3(0,0,1)),tHash(i+vec3(1,0,1)),f.x),
                           mix(tHash(i+vec3(0,1,1)),tHash(i+vec3(1,1,1)),f.x),f.y),f.z);
          }`,
        )
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>
          if (vTerrainPos.x > uPit.x && vTerrainPos.x < uPit.y && vTerrainPos.z > uPit.z && vTerrainPos.z < uPit.w) discard;`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float tn = tNoise(vTerrainPos * uNoise.y) * 0.6 + tNoise(vTerrainPos * uNoise.y * 4.1) * 0.4;
          diffuseColor.rgb *= 1.0 + (tn - 0.5) * uNoise.x;`,
        );
    };
    material.customProgramCacheKey = () => "aurelis-terrain";
    return { geometry, material };
  }, [segments]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <>
      <mesh geometry={geometry} material={material} receiveShadow name="terrain" />
      <River />
    </>
  );
}

/**
 * One calm water plane at river level. The carved terrain hides it everywhere except
 * the valley, so the river's outline is defined entirely by the landform.
 */
function River() {
  const { geometry, material } = useMemo(() => {
    const geometry = new PlaneGeometry(5200, 560, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new MeshStandardMaterial({ color: new Color("#d2dbde"), metalness: 0.9, roughness: 0.08, envMapIntensity: 2.1 });
    return { geometry, material };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return <mesh geometry={geometry} material={material} position={[0, RIVER_LEVEL, -430]} receiveShadow name="river" />;
}
