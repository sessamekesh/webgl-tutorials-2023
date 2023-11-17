import { glMatrix, mat4, quat, vec3 } from "gl-matrix";
import { CUBE_INDICES, CUBE_VERTICES, TABLE_SURFACE_INDICES, TABLE_SURFACE_VERTICES, create3dPosColorInterleavedVao } from "./geometry";
import { createProgram, createStaticIndexBuffer, createStaticVertexBuffer, getContext, showError } from "./gl-helpers";

const VERTEX_SHADER_SOURCE = `#version 300 es
precision mediump float;

uniform mat4 matViewProj;
uniform mat4 matWorld;

in vec3 vertexPosition;
in vec3 vertexColor;

out vec3 fragmentColor;

void main() {
  fragmentColor = vertexColor;
  gl_Position = matViewProj * matWorld * vec4(vertexPosition, 1.0);
}`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision mediump float;

in vec3 fragmentColor;

out vec4 outputColor;

void main() {
  outputColor = vec4(fragmentColor, 1.0);
}`;

class Cube {
  private matWorld = mat4.create();
  private defaultRotation = quat.create();

  constructor(
    private readonly pos: vec3,
    private readonly scale: vec3) {}

  draw(
      gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject,
      matWorldUniform: WebGLUniformLocation, numIndices: number) {
    mat4.identity(this.matWorld);
    quat.identity(this.defaultRotation);
    mat4.fromRotationTranslationScale(
      this.matWorld, this.defaultRotation, this.pos, this.scale);

    gl.uniformMatrix4fv(matWorldUniform, false, this.matWorld);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
}

function introTo3dDemo() {
  const canvas = document.getElementById('demo-canvas');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) throw new Error('Failed to get demo canvas');

  const gl = getContext(canvas);

  const tableGeoBuffer = createStaticVertexBuffer(gl, TABLE_SURFACE_VERTICES);
  const tableIndexBuffer = createStaticIndexBuffer(gl, TABLE_SURFACE_INDICES);
  const cubeGeoBuffer = createStaticVertexBuffer(gl, CUBE_VERTICES);
  const cubeIndexBuffer = createStaticIndexBuffer(gl, CUBE_INDICES);

  if (!tableGeoBuffer ||!tableIndexBuffer) {
    showError(`Failed to create table buffers (geo=${!!tableGeoBuffer}, index=${!!tableIndexBuffer})`);
    return;
  }
  if (!cubeGeoBuffer || !cubeIndexBuffer) {
    showError(`Failed to create cube buffers (geo=${!!cubeGeoBuffer}, index=${!!cubeIndexBuffer})`);
    return;
  }

  const demoProgram = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
  if (!demoProgram) {
    showError('Failed to create Intro to 3D WebGL program');
    return;
  }

  const posAttrib = gl.getAttribLocation(demoProgram, 'vertexPosition');
  const colorAttrib = gl.getAttribLocation(demoProgram, 'vertexColor');

  if (posAttrib < 0 || colorAttrib < 0) {
    showError(`Failed to get attrib locations: pos=${posAttrib}, color=${colorAttrib}`);
    return;
  }

  const matWorldUniform = gl.getUniformLocation(demoProgram, 'matWorld');
  const matViewProjUniform = gl.getUniformLocation(demoProgram, 'matViewProj');
  if (!matWorldUniform || !matViewProjUniform) {
    showError(`Failed to get uniform locations: matWorld=${!!matWorldUniform}, matViewProj=${!!matViewProjUniform}`);
    return;
  }

  const tableVao = create3dPosColorInterleavedVao(gl, tableGeoBuffer, tableIndexBuffer, posAttrib, colorAttrib);
  const cubeVao = create3dPosColorInterleavedVao(gl, cubeGeoBuffer, cubeIndexBuffer, posAttrib, colorAttrib);

  if (!tableVao || !cubeVao) {
    showError(`Failed to create VAOs: tableVao=${!!tableVao}, cubeVao=${!!cubeVao}`);
    return;
  }

  const matTableWorld = mat4.create();
  mat4.identity(matTableWorld);
  
  const cubes: Cube[] = [
    new Cube(vec3.fromValues(0, 0.4, 0), vec3.fromValues(0.4, 0.4, 0.4)),
    new Cube(vec3.fromValues(1, 0.05, 1), vec3.fromValues(0.05, 0.05, 0.05)),
    new Cube(vec3.fromValues(1, 0.1, -1), vec3.fromValues(0.1, 0.1, 0.1)),
    new Cube(vec3.fromValues(-1, 0.15, 1), vec3.fromValues(0.15, 0.15, 0.15)),
    new Cube(vec3.fromValues(-1, 0.2, -1), vec3.fromValues(0.2, 0.2, 0.2)),
  ];

  const matView = mat4.create();
  const matProj = mat4.create();
  const matViewProj = mat4.create();

  let cameraAngle = 0;

  let lastFrameTime = performance.now();
  const frame = function() {
    const thisFrameTime = performance.now();
    const dt = (thisFrameTime - lastFrameTime) / 1000;
    lastFrameTime = thisFrameTime;

    // Update
    cameraAngle += dt * glMatrix.toRadian(10);
    const cameraX = Math.sin(cameraAngle) * 3;
    const cameraZ = Math.cos(cameraAngle) * 3;
    mat4.lookAt(
      matView,
      /* cameraPos= */ vec3.fromValues(cameraX, 1, cameraZ),
      /* lookAt= */ vec3.fromValues(0, 0, 0),
      /* up= */ vec3.fromValues(0, 1, 0));

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    mat4.perspective(
      matProj,
      glMatrix.toRadian(85),
      canvas.width / canvas.height,
      0.1, 100.0);

    mat4.mul(matViewProj, matProj, matView);

    // Render
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(demoProgram);
    
    gl.uniformMatrix4fv(matViewProjUniform, false, matViewProj);
    
    // Draw cubes
    cubes.forEach((cube) => {
      cube.draw(gl, cubeVao, matWorldUniform, CUBE_INDICES.length);
    });

    // Draw table
    gl.uniformMatrix4fv(matWorldUniform, false, matTableWorld);
    gl.bindVertexArray(tableVao);
    gl.drawElements(gl.TRIANGLES, TABLE_SURFACE_INDICES.length, gl.UNSIGNED_SHORT, 0);

    // Clear bound VAO
    gl.bindVertexArray(null);

    // Loop
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

try {
  introTo3dDemo();
} catch (e) {
  showError(`Uncaught JavaScript exception: ${e}`);
}