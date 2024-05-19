import { TABLE_POSITIONS, TABLE_NORMALS, TABLE_INDICES, WorldTransform } from "./geometry";
import { createStaticIndexBuffer, createStaticVertexBuffer, getContext, showError } from "./gl-utils";
import { glMatrix, mat4, vec3 } from 'gl-matrix';
import { createBlinnPhongVao, createSolidBlinnPhongProgram } from "./solidBlinnPhong";

function introTo3DDemo() {
  const canvas = document.getElementById('demo-canvas');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    showError('Could not get Canvas reference');
    return;
  }

  const gl = getContext(canvas);

  const tablePositions = createStaticVertexBuffer(gl, TABLE_POSITIONS);
  const tableNormals = createStaticVertexBuffer(gl, TABLE_NORMALS);
  const tableIndices = createStaticIndexBuffer(gl, TABLE_INDICES);

  if (!tablePositions || !tableNormals || !tableIndices) {
    showError(`Failed to create geo: table: (pos=${!!tablePositions} norm=${tableNormals} i=${tableIndices}))`);
    return;
  }

  const blinnPhongSolid = createSolidBlinnPhongProgram(gl);
  if (!blinnPhongSolid) {
    showError('Failed to compile Blinn-Phong (solid color) WebGL program');
    return;
  }

  const tableBlinnPhongVao = createBlinnPhongVao(gl, tablePositions, tableNormals, tableIndices, blinnPhongSolid);

  if (!tableBlinnPhongVao) {
    showError(`Failed to create Blinn-Phong (solid) VAOs: table=${!!tableBlinnPhongVao}`);
    return;
  }

  const tableWorldTransform = new WorldTransform();

  const matView = mat4.create();
  const matProj = mat4.create();
  const matViewProj = mat4.create();
  const cameraPos = vec3.create();

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

    vec3.set(cameraPos, cameraX, 1, cameraZ);
    mat4.lookAt(
      matView,
      /* pos= */ cameraPos,
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
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Per-frame stuff...
    gl.useProgram(blinnPhongSolid.program);
    gl.uniformMatrix4fv(blinnPhongSolid.matViewProj, false, matViewProj);
    gl.uniform3fv(blinnPhongSolid.cameraPosition, cameraPos);

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
