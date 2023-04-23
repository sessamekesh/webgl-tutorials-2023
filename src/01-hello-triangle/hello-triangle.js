const errorBoxDiv = document.getElementById('error-box');

/** Vertex shader source code (explained in "drawTutorialTriangle()" below) */
const vertexShaderText =
`#version 300 es
precision mediump float;

in vec2 vertexPosition;

void main () {
  gl_Position = vec4(vertexPosition, 0.0, 1.0);
}`;

/** Fragment shader source code (explained in "drawTutorialTriangle()" below) */
const fragmentShaderText = 
`#version 300 es
precision mediump float;

out vec4 helloTriangleColor;

void main() {
  helloTriangleColor = vec4(0.294, 0.0, 0.51, 1.0);
}`;

/**
 * Display an error in our little error text area
 * @param {string} errorText
 */
function showError(errorText) {
  const errorSpan = document.createElement('p');
  errorSpan.innerText = errorText;
  errorBoxDiv.appendChild(errorSpan);
}

/**
 * Entry point of our app - call this function to render the tutorial triangle
 *  to the canvas.
 * 
 * JavaScript trick: make this a function so that you can use "return" to break
 *  out early if there's an error and the program can't continue.
 * 
 * If you're feeling really tricky, you can make it an async function so you can
 *  use "await" if you're loading shaders/geometry/whatever from files.
 */
function helloTriangle() {
  //
  // Setup Step 1: Get WebGL context.
  //

  // Below type annotation is totally ignored by JavaScript, but it helps IDEs
  //  figure out that the HTML element below is a canvas, not a div, p, span, etc.
  /** @type {HTMLCanvasElement|null} */
  const canvasElement = document.getElementById('demo-canvas');
  if (!canvasElement) {
    showError('Cannot find "demo-canvas" HTML element - cannot start demo');
    return;
  }

  const gl = canvasElement.getContext('webgl2', {antialias: false});
  if (!gl) {
    showError('Cannot get WebGL 2 rendering context - cannot start demo');
    return;
  }

  //
  // Setup Step 2: Define the shape of the triangle
  //
  const triangleVertices = [
    // Top middle
    0.0, 0.5,
    // Bottom left
    -0.5, -0.5,
    // Bottom right
    0.5, -0.5
  ];
  const triangleVerticesTypedArray = new Float32Array(triangleVertices);

  // Create GPU buffer and send triangle data over to it...
  const triangleGeoBuffer = gl.createBuffer();
  if (!triangleGeoBuffer) {
    showError('Failed to create triangle geometry buffer - demo might break');
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesTypedArray, gl.STATIC_DRAW);

  //
  // Setup Step 3: Compile vertex and fragment shader for use with rendering
  //
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) {
    showError('Failed to CREATE vertex shader - demo might break');
  }
  gl.shaderSource(vertexShader, vertexShaderText);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    showError(`Failed to COMPILE vertex shader - ${gl.getShaderInfoLog(vertexShader)}`);
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    showError('Failed to CREATE fragment shader - demo might break');
  }
  gl.shaderSource(fragmentShader, fragmentShaderText);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    showError(`Failed to COMPILE fragment shader - ${gl.getShaderInfoLog(fragmentShader)}`);
  }

  const helloTriangleProgram = gl.createProgram();
  if (!helloTriangleProgram) {
    showError('Failed to CREATE hello triangle program');
  }
  gl.attachShader(helloTriangleProgram, vertexShader);
  gl.attachShader(helloTriangleProgram, fragmentShader);
  gl.linkProgram(helloTriangleProgram);
  if (!gl.getProgramParameter(helloTriangleProgram, gl.LINK_STATUS)) {
    showError(`Failed to LINK helloTriangleProgram - ${gl.getProgramInfoLog(helloTriangleProgram)}`);
  }

  //
  // Setup Step 4: Get vertexPosition vertex shader attribute location
  //
  const vertexPositionAttribLocation = gl.getAttribLocation(helloTriangleProgram, 'vertexPosition');
  if (vertexPositionAttribLocation < 0) {
    showError(`Failed to get attrib location for "vertexPosition"`);
    return;
  }

  //
  // Render step 1: clear the canvas
  //
  gl.clearColor(0.08, 0.08, 0.08, 1.0);
  canvasElement.width = canvasElement.clientWidth * devicePixelRatio;
  canvasElement.height = canvasElement.clientHeight * devicePixelRatio;
  gl.viewport(0, 0, canvasElement.width, canvasElement.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //
  // Render step 2: Tell WebGL to use our program for any upcoming draw calls
  // Notify WebGL about all attribute slots that need to be used
  //
  gl.useProgram(helloTriangleProgram);
  gl.enableVertexAttribArray(vertexPositionAttribLocation);

  //
  // Render step 3: Tell WebGL to pull vertexPosition attrib from the triangleGeoBuffer
  //
  // Bind our triangle geometry buffer to the WebGL ARRAY_BUFFER slot.
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  
  // Tell WebGL that vertexPosition comes from the current ARRAY_BUFFER, in sets of
  //  two floats each, starting 8 bytes apart from each other and with no offset from
  //  the beginning of the buffer.
  gl.vertexAttribPointer(
    /* index: vertex attrib location (got earlier) */
    vertexPositionAttribLocation,
    /* size: number of components in this attribute (vec2 = 2) */
    2,
    /* type: type of data in this attribute (vec2 = float) */
    gl.FLOAT,
    /* normalized: only used for int values (true to map int inputs to float range 0, 1) */
    false,
    /* stride: how far to move forward in the buffer for the next element, in bytes (2 floats) */
    Float32Array.BYTES_PER_ELEMENT * 2,
    /* offset: how far from the first element in the buffer to start looking for data */
    0);

  // Execute the draw call!
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Check for errors...
  const glError = gl.getError();
  if (glError > 0) {
    showError(`WebGL error - ${glError}`);
  }
}

// Run the program in a try/catch, just in case we did something dumb (e.g. typo)
try {
  helloTriangle();
} catch (e) {
  showError(`Uncaught exception: ${JSON.stringify(e)}`);
}
