/** Demo configuration constants */
const SPAWNER_CHANGE_TIME = 5;
const SPAWN_RATE = 0.08;
const MIN_SHAPE_TIME = 0.25;
const MAX_SHAPE_TIME = 6;
const MIN_SHAPE_SPEED = 125;
const MAX_SHAPE_SPEED = 350;
const MIN_SHAPE_FORCE = 150;
const MAX_SHAPE_FORCE = 750;
const MIN_SHAPE_SIZE = 2;
const MAX_SHAPE_SIZE = 50;
const MAX_SHAPE_COUNT = 250;
const CIRCLE_SEGMENT_COUNT = 40;

/** Display an error message to the DOM, beneath the demo element */
function showError(errorText: string) {
  console.error(errorText);
  const errorBoxDiv = document.getElementById('error-box');
  if (errorBoxDiv === null) {
    return;
  }
  const errorElement = document.createElement('p');
  errorElement.innerText = errorText;
  errorBoxDiv.appendChild(errorElement);
}

const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec2 vertexPosition;
in vec3 vertexColor;

out vec3 fragmentColor;

uniform vec2 canvasSize;
uniform vec2 shapeLocation;
uniform float shapeSize;

void main() {
  fragmentColor = vertexColor;

  vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
  vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

  gl_Position = vec4(clipPosition, 0.0, 1.0);
}`;

const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentColor;
out vec4 outputColor;

void main() {
  outputColor = vec4(fragmentColor, 1.0);
}`;

function buildCircleVertexBufferData() {
  const vertexData = [];

  for (let i = 0; i < CIRCLE_SEGMENT_COUNT; i++) {
    const vertex1Angle = i * Math.PI * 2 / CIRCLE_SEGMENT_COUNT;
    const vertex2Angle = (i + 1) * Math.PI * 2 / CIRCLE_SEGMENT_COUNT;

    const x1 = Math.cos(vertex1Angle);
    const y1 = Math.sin(vertex1Angle);
    const x2 = Math.cos(vertex2Angle);
    const y2 = Math.sin(vertex2Angle);

    // Center vertex is a light blue color, and in the middle of the shape
    vertexData.push(
      // Position (x, y)
      0, 0,
      // Color (r, g, b)
      0.678, 0.851, 0.957
    );

    // Other two vertices are along the edges of the circle, and are a darker blue shape
    vertexData.push(
      // Position (x, y)
      x1, y1,
      // Color (r, g, b)
      0.251, 0.353, 0.856
    );
    vertexData.push(
      // Position (x, y)
      x2, y2,
      // Color (r, g, b)
      0.251, 0.353, 0.856
    );
  }

  return new Float32Array(vertexData);
}

const trianglePositions = new Float32Array([ 0, 1, -1, -1, 1, -1 ]);
const squarePositions = new Float32Array([ -1, 1, -1, -1, 1, -1,  -1, 1, 1, -1, 1, 1 ]);
const rgbTriangleColors = new Uint8Array([
  255, 0, 0,
  0, 255, 0,
  0, 0, 255,
]);
const fireyTriangleColors = new Uint8Array([
  // Chili red - E52F0F
  229, 47, 15,
  // Jonquil - F6CE1D
  246, 206, 29,
  // Gamboge - E99A1A
  233, 154, 26
]);
const indigoGradientSquareColors = new Uint8Array([
  // Top: "Tropical Indigo" - A799FF
  167, 153, 255,
  // Bottom: "Eminence" - 583E7A
  88, 62, 122,
  88, 62, 122,
  167, 153, 255,
  88, 62, 122,
  167, 153, 255
]);
const graySquareColors = new Uint8Array([
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45
]);

function createStaticVertexBuffer(gl: WebGL2RenderingContext, data: ArrayBuffer) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    showError('Failed to allocate buffer');
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return buffer;
}

function createTwoBufferVao(
    gl: WebGL2RenderingContext,
    positionBuffer: WebGLBuffer, colorBuffer: WebGLBuffer,
    positionAttribLocation: number, colorAttribLocation: number) {
  const vao = gl.createVertexArray();
  if (!vao) {
    showError('Failed to allocate VAO for two buffers');
    return null;
  }

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(
    positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(
    colorAttribLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindVertexArray(null);

  return vao;
}

function createInterleavedBufferVao(
    gl: WebGL2RenderingContext, interleavedBuffer: WebGLBuffer,
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
  // (x, y, r, g, b) (x, y, r, g, b) (x, y, r, g, b)
  gl.bindBuffer(gl.ARRAY_BUFFER, interleavedBuffer);
  gl.vertexAttribPointer(
    positionAttribLocation, 2, gl.FLOAT, false,
    5 * Float32Array.BYTES_PER_ELEMENT,
    0);
  gl.vertexAttribPointer(
    colorAttribLocation, 3, gl.FLOAT, false,
    5 * Float32Array.BYTES_PER_ELEMENT,
    2 * Float32Array.BYTES_PER_ELEMENT);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindVertexArray(null);

  return vao;
}

function createProgram(
    gl: WebGL2RenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!vertexShader || !fragmentShader || !program) {
    showError(`Failed to allocate GL objects (`
      + `vs=${!!vertexShader}, `
      + `fs=${!!fragmentShader}, `
      + `program=${!!program})`);
    return null;
  }

  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(vertexShader);
    showError(`Failed to compile vertex shader: ${errorMessage}`);
    return null;
  }

  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(fragmentShader);
    showError(`Failed to compile fragment shader: ${errorMessage}`);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const errorMessage = gl.getProgramInfoLog(program);
    showError(`Failed to link GPU program: ${errorMessage}`);
    return null;
  }

  return program;
}

function getContext(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    const isWebGl1Supported = !!(document.createElement('canvas')).getContext('webgl');
    if (isWebGl1Supported) {
      throw new Error('WebGL 1 is supported, but not v2 - try using a different device or browser');
    } else {
      throw new Error('WebGL is not supported on this device - try using a different device or browser');
    }
  }

  return gl;
}

function getRandomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

class MovingShape {
  constructor(
    public position: [number, number],
    public velocity: [number, number],
    public force: [number, number],
    public size: number,
    public timeRemaining: number,
    public vao: WebGLVertexArrayObject,
    public numVertices: number) {}

  isAlive() {
    return this.timeRemaining > 0;
  }

  update(dt: number) {
    this.velocity[0] += this.force[0] * dt;
    this.velocity[1] += this.force[1] * dt;

    this.position[0] += this.velocity[0] * dt;
    this.position[1] += this.velocity[1] * dt;

    this.timeRemaining -= dt;
  }
}

//
// DEMO
//
function movementAndColorDemo() {
  const canvas = document.getElementById('demo-canvas');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) throw new Error('Failed to get demo canvas reference');

  const gl = getContext(canvas);

  const triangleGeoBuffer = createStaticVertexBuffer(gl, trianglePositions);
  const rgbTriangleColorBuffer = createStaticVertexBuffer(gl, rgbTriangleColors);
  const fireyTriangleColorBuffer = createStaticVertexBuffer(gl, fireyTriangleColors);

  const squareGeoBuffer = createStaticVertexBuffer(gl, squarePositions);
  const indigoGradientSquareColorBuffer = createStaticVertexBuffer(gl, indigoGradientSquareColors);
  const graySquareColorsBuffer = createStaticVertexBuffer(gl, graySquareColors);

  const circleInterleavedBuffer = createStaticVertexBuffer(gl, buildCircleVertexBufferData());

  if (!triangleGeoBuffer || !rgbTriangleColorBuffer || !fireyTriangleColorBuffer
      || !squareGeoBuffer || !indigoGradientSquareColorBuffer || !graySquareColorsBuffer
      || !circleInterleavedBuffer) {
    showError(`Failed to create vertex buffers (triangle pos=${!!triangleGeoBuffer},`
      + `, rgb tri color=${!!rgbTriangleColorBuffer}`
      + `, firey tri color=${!!fireyTriangleColorBuffer}`
      + `, square geo=${!!squareGeoBuffer}`
      + `, indigo square color=${!!indigoGradientSquareColorBuffer}`
      + `, gray square color=${!!graySquareColorsBuffer}`
      + `, circle=${!!circleInterleavedBuffer})`);
    return null;
  }

  // Get attribute locations
  const movementAndColorProgram = createProgram(gl, vertexShaderSourceCode, fragmentShaderSourceCode);
  if (!movementAndColorProgram) {
    showError('Failed to create Movement and Color WebGL program');
    return;
  }

  const vertexPositionAttributeLocation = gl.getAttribLocation(movementAndColorProgram, 'vertexPosition');
  const vertexColorAttributeLocation = gl.getAttribLocation(movementAndColorProgram, 'vertexColor');
  if (vertexPositionAttributeLocation < 0 || vertexColorAttributeLocation < 0) {
    showError(`Failed to get attribute locations: (pos=${vertexPositionAttributeLocation},`
      + ` color=${vertexColorAttributeLocation})`);
    return;
  }

  // Get uniform locations
  const shapeLocationUniform = gl.getUniformLocation(movementAndColorProgram, 'shapeLocation');
  const shapeSizeUniform = gl.getUniformLocation(movementAndColorProgram, 'shapeSize');
  const canvasSizeUniform = gl.getUniformLocation(movementAndColorProgram, 'canvasSize');
  if (shapeLocationUniform === null || shapeSizeUniform === null || canvasSizeUniform === null) {
    showError(`Failed to get uniform locations (shapeLocation=${!!shapeLocationUniform}`
     + `, shapeSize=${!!shapeSizeUniform}`
     + `, canvasSize=${!!canvasSizeUniform})`);
    return;
  }

  // Create VAOs
  const rgbTriangleVao = createTwoBufferVao(
    gl, triangleGeoBuffer, rgbTriangleColorBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const fireyTriangleVao = createTwoBufferVao(
    gl, triangleGeoBuffer, fireyTriangleColorBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const indigoSquareVao = createTwoBufferVao(
    gl, squareGeoBuffer, indigoGradientSquareColorBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const graySquareVao = createTwoBufferVao(
    gl, squareGeoBuffer, graySquareColorsBuffer,
    vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const circleVao = createInterleavedBufferVao(
    gl, circleInterleavedBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);

  if (!rgbTriangleVao || !fireyTriangleVao || !indigoSquareVao || !graySquareVao || !circleVao) {
    showError(`Failed to create VAOs: (`
      + `rgbTriangle=${!!rgbTriangleVao}, `
      + `fireyTriangle=${!!fireyTriangleVao}, `
      + `indigoSquare=${!!indigoSquareVao}, `
      + `graySquare=${!!graySquareVao}, `
      + `circle=${!!circleVao})`);
    return;
  }

  const geometryList = [
    { vao: rgbTriangleVao, numVertices: 3 },
    { vao: fireyTriangleVao, numVertices: 3 },
    { vao: indigoSquareVao, numVertices: 6 },
    { vao: graySquareVao, numVertices: 6 },
    { vao: circleVao, numVertices: CIRCLE_SEGMENT_COUNT * 3 },
  ];

  // Set up logical objects
  let shapes: MovingShape[] = [];
  let timeToNextSpawn = SPAWN_RATE;
  let spawnPosition: [number, number] = [
    getRandomInRange(canvas.width * 0.1, canvas.width * 0.9),
    getRandomInRange(canvas.height * 0.1, canvas.height * 0.9),
  ];
  let timeToSpawnerChange = SPAWNER_CHANGE_TIME;

  let lastFrameTime = performance.now();
  const frame = function () {
    const thisFrameTime = performance.now();
    const dt = (thisFrameTime - lastFrameTime) / 1000;
    lastFrameTime = thisFrameTime;

    // Update spawner
    timeToSpawnerChange -= dt;
    if (timeToSpawnerChange < 0) {
      timeToSpawnerChange = SPAWNER_CHANGE_TIME;
      spawnPosition = [
        getRandomInRange(canvas.width * 0.1, canvas.width * 0.9),
        getRandomInRange(canvas.height * 0.1, canvas.height * 0.9),
      ];
    }

    // Update shapes
    timeToNextSpawn -= dt;
    while (timeToNextSpawn < 0) {
      timeToNextSpawn += SPAWN_RATE;

      const movementAngle = getRandomInRange(0, 2 * Math.PI);
      const movementSpeed = getRandomInRange(MIN_SHAPE_SPEED, MAX_SHAPE_SPEED);
      const forceAngle = getRandomInRange(0, 2 * Math.PI);
      const forceSpeed = getRandomInRange(MIN_SHAPE_FORCE, MAX_SHAPE_FORCE);

      const position: [number, number] = [ spawnPosition[0], spawnPosition[1] ];
      const velocity: [number, number] = [
        Math.sin(movementAngle) * movementSpeed,
        Math.cos(movementAngle) * movementSpeed
      ];
      const force: [number, number] = [
        Math.sin(forceAngle) * forceSpeed,
        Math.cos(forceAngle) * forceSpeed
      ];
      const size = getRandomInRange(MIN_SHAPE_SIZE, MAX_SHAPE_SIZE);
      const timeRemaining = getRandomInRange(MIN_SHAPE_TIME, MAX_SHAPE_TIME);

      const geometryIdx = Math.floor(getRandomInRange(0, geometryList.length));
      const geometry = geometryList[geometryIdx];

      const shape = new MovingShape(position, velocity, force, size, timeRemaining, geometry.vao, geometry.numVertices);

      shapes.push(shape);
    }

    for (let i = 0; i < shapes.length; i++) {
      shapes[i].update(dt);
    }
    shapes = shapes.filter((shape) => shape.isAlive()).slice(0, MAX_SHAPE_COUNT);

    // Render the Frame
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(0.08, 0.08, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(movementAndColorProgram);

    // Set uniforms shared across frame...
    gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

    // Draw the shapes!
    for (let i = 0; i < shapes.length; i++) {
      gl.uniform1f(shapeSizeUniform, shapes[i].size);
      gl.uniform2f(shapeLocationUniform, shapes[i].position[0], shapes[i].position[1]);
      gl.bindVertexArray(shapes[i].vao);
      gl.drawArrays(gl.TRIANGLES, 0, shapes[i].numVertices);
    }

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

try {
  movementAndColorDemo();
} catch (e) {
  showError(`Uncaught JavaScript exception: ${e}`);
}
