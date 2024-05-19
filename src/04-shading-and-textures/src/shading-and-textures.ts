import { CUBE_INDICES, CUBE_VERTICES, TABLE_INDICES, TABLE_VERTICES, create3dPosColorInterleavedVao } from "./geometry";
import { createProgram, createStaticIndexBuffer, createStaticVertexBuffer, getContext, showError } from "./gl-utils";
import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';

const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec3 vertexColor;

out vec3 fragmentColor;

uniform mat4 matWorld;
uniform mat4 matViewProj;

void main() {
  fragmentColor = vertexColor;

  gl_Position = matViewProj * matWorld * vec4(vertexPosition, 1.0);
}`;

const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentColor;
out vec4 outputColor;

void main() {
  outputColor = vec4(fragmentColor, 1.0);
}`;

class Shape {
  private matWorld = mat4.create();
  private scaleVec = vec3.create();
  private rotation = quat.create();

  constructor(
    private pos: vec3,
    private scale: number,
    private rotationAxis: vec3,
    private rotationAngle: number,
    public readonly vao: WebGLVertexArrayObject,
    public readonly numIndices: number) { }

  draw(gl: WebGL2RenderingContext, matWorldUniform: WebGLUniformLocation) {
    quat.setAxisAngle(this.rotation, this.rotationAxis, this.rotationAngle);
    vec3.set(this.scaleVec, this.scale, this.scale, this.scale);

    mat4.fromRotationTranslationScale(
      this.matWorld,
      /* rotation= */ this.rotation,
      /* position= */ this.pos,
      /* scale= */ this.scaleVec);

    gl.uniformMatrix4fv(matWorldUniform, false, this.matWorld);
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
}

function introTo3DDemo() {
  const canvas = document.getElementById('demo-canvas');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    showError('Could not get Canvas reference');
    return;
  }

  const gl = getContext(canvas);

  const cubeVertices = createStaticVertexBuffer(gl, CUBE_VERTICES);
  const cubeIndices = createStaticIndexBuffer(gl, CUBE_INDICES);
  const tableVertices = createStaticVertexBuffer(gl, TABLE_VERTICES);
  const tableIndices = createStaticIndexBuffer(gl, TABLE_INDICES);

  if (!cubeVertices || !cubeIndices || !tableVertices || !tableIndices) {
    showError(`Failed to create geo: cube: (v=${!!cubeVertices} i=${cubeIndices}), table=(v=${!!tableVertices} i=${!!tableIndices})`);
    return;
  }

  const demoProgram = createProgram(gl, vertexShaderSourceCode, fragmentShaderSourceCode);
  if (!demoProgram) {
    showError('Failed to compile WebGL program');
    return;
  }

  const posAttrib = gl.getAttribLocation(demoProgram, 'vertexPosition');
  const colorAttrib = gl.getAttribLocation(demoProgram, 'vertexColor');

  const matWorldUniform = gl.getUniformLocation(demoProgram, 'matWorld');
  const matViewProjUniform = gl.getUniformLocation(demoProgram, 'matViewProj');

  if (posAttrib < 0 || colorAttrib < 0 || !matWorldUniform || !matViewProjUniform) {
    showError(`Failed to get attribs/uniforms: ` +
      `pos=${posAttrib}, color=${colorAttrib} ` +
      `matWorld=${!!matWorldUniform} matViewProj=${!!matViewProjUniform}`);
    return;
  }

  const cubeVao = create3dPosColorInterleavedVao(
    gl, cubeVertices, cubeIndices, posAttrib, colorAttrib);
  const tableVao = create3dPosColorInterleavedVao(
    gl, tableVertices, tableIndices, posAttrib, colorAttrib);

  if (!cubeVao || !tableVao) {
    showError(`Failed to create VAOs: cube=${!!cubeVao} table=${!!tableVao}`);
    return;
  }

  const UP_VEC = vec3.fromValues(0, 1, 0);
  const shapes = [
    new Shape(vec3.fromValues(0, 0, 0), 1, UP_VEC, 0, tableVao, TABLE_INDICES.length),   // Ground
    new Shape(vec3.fromValues(0, 0.4, 0), 0.4, UP_VEC, 0, cubeVao, CUBE_INDICES.length), // Center
    new Shape(vec3.fromValues(1, 0.05, 1), 0.05, UP_VEC, glMatrix.toRadian(20), cubeVao, CUBE_INDICES.length),
    new Shape(vec3.fromValues(1, 0.1, -1), 0.1, UP_VEC, glMatrix.toRadian(40), cubeVao, CUBE_INDICES.length),
    new Shape(vec3.fromValues(-1, 0.15, 1), 0.15, UP_VEC, glMatrix.toRadian(60), cubeVao, CUBE_INDICES.length),
    new Shape(vec3.fromValues(-1, 0.2, -1), 0.2, UP_VEC, glMatrix.toRadian(80), cubeVao, CUBE_INDICES.length),
  ];

  const matView = mat4.create();
  const matProj = mat4.create();
  const matViewProj = mat4.create();

  let cameraAngle = 0;

  //
  // Render!
  let lastFrameTime = performance.now();
  const frame = function () {
    const thisFrameTime = performance.now();
    const dt = (thisFrameTime - lastFrameTime) / 1000;
    lastFrameTime = thisFrameTime;

    //
    // Update
    cameraAngle += dt * glMatrix.toRadian(10);

    const cameraX = 3 * Math.sin(cameraAngle);
    const cameraZ = 3 * Math.cos(cameraAngle);

    mat4.lookAt(
      matView,
      /* pos= */ vec3.fromValues(cameraX, 1, cameraZ),
      /* lookAt= */ vec3.fromValues(0, 0, 0),
      /* up= */ vec3.fromValues(0, 1, 0));
    mat4.perspective(
      matProj,
      /* fovy= */ glMatrix.toRadian(80),
      /* aspectRatio= */ canvas.width / canvas.height,
      /* near, far= */ 0.1, 100.0);

    // in GLM:    matViewProj = matProj * matView
    mat4.multiply(matViewProj, matProj, matView);

    //
    // Render
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    gl.clearColor(0.02, 0.02, 0.02, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(demoProgram);
    gl.uniformMatrix4fv(matViewProjUniform, false, matViewProj);

    shapes.forEach((shape) => shape.draw(gl, matWorldUniform));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

try {
  introTo3DDemo();
} catch (e) {
  showError(`Unhandled JavaScript exception: ${e}`);
}
