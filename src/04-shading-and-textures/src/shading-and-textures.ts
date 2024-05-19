import { TABLE_INDICES } from "./geometry";
import { createProgram, createStaticIndexBuffer, createStaticVertexBuffer, getContext, showError } from "./gl-utils";
import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import { BlinnPhongProgram } from "./solidBlinnPhong";

class WorldTransform {
  private _matWorld = mat4.create();
  private _quat = quat.create();
  private _scl = vec3.create();

  constructor(
    public pos: vec3 = vec3.fromValues(0, 0, 0),
    public rotationAxis: vec3 = vec3.fromValues(0, 1, 0),
    public rotationAngle: number = 0,
    public scale: number = 1) {}

  matWorld() {
    quat.setAxisAngle(this._quat, this.rotationAxis, this.rotationAngle);
    vec3.set(this._scl, this.scale, this.scale, this.scale);
    mat4.fromRotationTranslationScale(this._matWorld, this._quat, this.pos, this._scl);
    return this._matWorld;
  }
}

class SolidColorObject {
  constructor(
    private readonly transform: WorldTransform,
    private readonly vao: WebGLVertexArrayObject,
    private readonly color: vec3) {}

  draw(gl: WebGL2RenderingContext, shader: BlinnPhongProgram) {}
}

function introTo3DDemo() {
  const canvas = document.getElementById('demo-canvas');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    showError('Could not get Canvas reference');
    return;
  }

  const gl = getContext(canvas);

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
