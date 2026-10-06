import { Color, Vector3 } from "three";

/** Direction *toward* the sun. Low afternoon light from the west-north-west, ~23° high,
 * so long shadows reach toward the viewer and the west elevation glows. */
export const SUN_DIRECTION = new Vector3(-0.78, 0.4, -0.48).normalize();
export const SUN_DISTANCE = 420;
export const SUN_COLOR = new Color("#ffecd2");

/** Sky palette — layered ivories and soft greys, never saturated. */
export const SKY = {
  zenith: new Color("#8fa5b6"),
  upper: new Color("#cdd7dc"),
  horizon: new Color("#efe9df"),
  ground: new Color("#8f897e"),
  sunGlow: new Color("#fff1d9"),
};

/** Fog matches the sky horizon so the land melts into the atmosphere. */
export const FOG_COLOR = new Color("#ebe6dc");
