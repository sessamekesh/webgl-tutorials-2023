/*
 * Vertex format:
 * 
 *  X  Y  Z   R  G  B
 */

import { showError } from "./gl-helpers";

export function create3dPosColorInterleavedVao(
    gl: WebGL2RenderingContext, vertexBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer,
    positionAttribLocation: number, colorAttribLocation: number) {
  const vao = gl.createVertexArray();
  if (!vao) {
    showError('Failed to allocate VAO for two buffers');
    return null;
  }

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);

  // Interleaved format (all float32):
  // (x, y, z, r, g, b) (x, y, z, r, g, b) (x, y, z, r, g, b)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(
    positionAttribLocation, 3, gl.FLOAT, false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    0);
  gl.vertexAttribPointer(
    colorAttribLocation, 3, gl.FLOAT, false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    3 * Float32Array.BYTES_PER_ELEMENT);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return vao;
}

//
// Table geometry
export const TABLE_SURFACE_VERTICES = new Float32Array([
  -10, 0, -10,  0.2, 0.2, 0.2,
  -10, 0, 10,  0.2, 0.2, 0.2,
  10, 0, 10,  0.2, 0.2, 0.2,
  10, 0, -10,  0.2, 0.2, 0.2,
]);

export const TABLE_SURFACE_INDICES = new Uint16Array([
  0, 1, 2,
  0, 2, 3
]);

//
// Cube geometry
// (adapted from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL)
export const CUBE_VERTICES = new Float32Array([
    // Front face
    -1.0, -1.0, 1.0,  1, 0, 0,
    1.0, -1.0, 1.0,  1, 0, 0,
    1.0, 1.0, 1.0,  1, 0, 0,
    -1.0, 1.0, 1.0,  1, 0, 0,

    // Back face
    -1.0, -1.0, -1.0,  1, 0, 0,
    -1.0, 1.0, -1.0,  1, 0, 0,
    1.0, 1.0, -1.0,  1, 0, 0,
    1.0, -1.0, -1.0,  1, 0, 0,
  
    // Top face
    -1.0, 1.0, -1.0,  0, 1, 0,
    -1.0, 1.0, 1.0,  0, 1, 0,
    1.0, 1.0, 1.0,  0, 1, 0,
    1.0, 1.0, -1.0,  0, 1, 0,
  
    // Bottom face
    -1.0, -1.0, -1.0,  0, 1, 0,
    1.0, -1.0, -1.0,  0, 1, 0,
    1.0, -1.0, 1.0,  0, 1, 0,
    -1.0, -1.0, 1.0,  0, 1, 0,
  
    // Right face
    1.0, -1.0, -1.0,  0, 0, 1,
    1.0, 1.0, -1.0,  0, 0, 1,
    1.0, 1.0, 1.0,  0, 0, 1,
    1.0, -1.0, 1.0,  0, 0, 1,
  
    // Left face
    -1.0, -1.0, -1.0,  0, 0, 1,
    -1.0, -1.0, 1.0,  0, 0, 1,
    -1.0, 1.0, 1.0,  0, 0, 1,
    -1.0, 1.0, -1.0,  0, 0, 1,
]);

export const CUBE_INDICES = new Uint16Array([
  // Front
  0, 1, 2, 0, 2, 3,
  // Back
  4, 5, 6, 4, 6, 7,
  // Top
  8, 9, 10, 8, 10, 11,
  // Bottom
  12, 13, 14, 12, 14, 15,
  // Right
  16, 17, 18, 16, 18, 19,
  // Left
  20, 21, 22, 20, 22, 23,
]);
