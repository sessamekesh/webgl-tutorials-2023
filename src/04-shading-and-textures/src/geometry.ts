// Vertex buffer format: XYZ RGB (interleaved)

import { showError } from "./gl-utils";

export const TABLE_POSITIONS = new Float32Array([
  // Top face
  -10.0, 0.0, -10.0,
  -10.0, 0.0, 10.0,
  10.0, 0.0, 10.0,
  10.0, 0.0, -10.0,
]);
export const TABLE_NORMALS = new Float32Array([
  0.0, 1.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 1.0, 0.0,
]);
export const TABLE_INDICES = new Uint16Array([
  0, 1, 2,
  0, 2, 3, // top
]);

// If you're a nerd you can put in more digits but just a few is fine.
const PI = 3.14159;

interface GeneratedGeometryBuffers {
  positions: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
  uv: Float32Array;
}

/**
 * TODO (sessamekesh): You'll want to explain how this one works with Manim...
 * TODO (sessamekesh): You'll also want to mention triangle strips as a better primitive assembly here.
 * 
 * @param numRings How many vertical segments on this sphere?
 * @param numSlices How many horizontal segments on this sphere? (like slices of an orange)
 */
export function createSphereBuffers(numRings: number, numSlices: number): GeneratedGeometryBuffers {
  const positions = [];
  const uvs = [];
  const normals = [];
  const indices = [];

  for (let slice = 0; slice <= numSlices; slice++) {
    for (let ring = 0; ring <= numRings; ring++) {
      const pctX = slice / numSlices;
      const pctY = ring / numRings;

      const x = Math.cos(pctX * 2 * PI) * Math.sin(pctY * PI);
      const y = Math.cos(pctY * PI);
      const z = Math.sin(pctX * 2 * PI) * Math.sin(pctY * PI);

      positions.push(x, y, z);
      uvs.push(pctX, pctY);
      normals.push(x, y, z);
    }
  }

  // Arrangement of squares starting at any (slice, ring) spot:
  //
  // s,r ----- s+1,r 
  // | \       |       wrap around back to starting s=0
  // |   \     |
  // |     \   |       rings don't wrap back around obviously
  // |       \ |
  // s,r+1 --- s+1,r+1
  //
  // Labeling those points 0, 1, 2, 3 going left-to-right then
  //  top-to-bottom, to get a counter-clockwise winding order
  //  the faces should be (0, 2, 3), (0, 3, 1)
  for (let slice = 0; slice < (numSlices - 1); slice++) {
    for (let ring = 0; ring < numRings; ring++) {
      const _0 = slice * numRings + ring;
      const _1 = (slice + 1) * numRings + ring;
      const _2 = slice * numRings + ring + 1;
      const _3 = (slice + 1) * numRings + ring + 1;

      indices.push(_0, _2, _3, _0, _3, _1);
    }
  }

  return{
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uv: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

export function createSolidColorVao(
  gl: WebGL2RenderingContext,
  vertexBuffer: WebGLBuffer, normalBuffer: WebGLBuffer, indexBuffer: WebGLBuffer,
  posAttrib: number, normalAttrib: number
) {
  const vao = gl.createVertexArray();
  if (!vao) {
    showError('Failed to create VAO');
    return null;
  }

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(posAttrib);
  gl.enableVertexAttribArray(normalAttrib);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindVertexArray(null);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);  // Not sure if necessary, but not a bad idea.

  return vao;
}

export function createTexturedVao(
  gl: WebGL2RenderingContext,
  vertexBuffer: WebGLBuffer, normalBuffer: WebGLBuffer,
  uvBuffer: WebGLBuffer, indexBuffer: WebGLBuffer,
  posAttrib: number, normalAttrib: number, uvAttrib: number
) {
  const vao = gl.createVertexArray();
  if (!vao) {
    showError('Failed to create VAO');
    return null;
  }

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(posAttrib);
  gl.enableVertexAttribArray(normalAttrib);
  gl.enableVertexAttribArray(uvAttrib);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.vertexAttribPointer(normalAttrib, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindVertexArray(null);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);  // Not sure if necessary, but not a bad idea.

  return vao;
}
