const errorBoxDiv = document.getElementById('error-box');

/** Vertex shader source code (explained in "drawTutorialTriangle()" below) */
const vertexShaderText = `
#version 300 es
precision mediump float;

in vec2 vertexPosition;

void main () {
  gl_Position = vec4(vertexPosition, 0.0, 1.0);
}`;

/** Fragment shader source code (explained in "drawTutorialTriangle()" below) */
const fragmentShaderText = `
#version 300 es
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
function drawTutorialTriangle() {
  //
  // Step 1: Get WebGL context.
  //
  // WebGL context holds all the WebGL state needed to draw things, and it's
  //  attached to an HTML5 "canvas" element. Basically, any graphics output of
  //  WebGL gets drawn to the space on the page where the canvas is, and the
  //  browser takes care of all the magic behind telling WebGL how to do that.
  //

  /** @type {HTMLCanvasElement|null} */
  const canvasElement = document.getElementById('demo-canvas');
  if (!canvasElement) {
    showError('Cannot find "demo-canvas" HTML element - cannot start demo');
    return;
  }

  const gl = canvasElement.getContext('webgl2');
  if (!gl) {
    showError('Cannot get WebGL 2 rendering context - cannot start demo');
    return;
  }

  //
  // Step 2: Define the shape of the triangle
  //
  // Geometry is defined in sets of triangles, and each triangle is made up of
  //  three corners. For this demo, we just use an X/Y position for our inputs.
  //
  const triangleVertices = [
    // Top middle
    0.0, 0.5,
    // Bottom left
    -0.5, -0.5,
    // Bottom right
    0.5, -0.5
  ];

  // JavaScript numbers are always 64-bit floats, but most graphics APIs (WebGL
  //  included, as with the OpenGL API it's based on) expect 32-bit floats.
  // Thankfully, typed arrays like Float32Array exist to help talk to such APIs.
  const triangleVerticesTypedData = new Float32Array(triangleVertices);

  // Create a GPU buffer - your GPU can't access JavaScript variables!
  // Loosely speaking, GPU buffers are basically variables, but for the GPU.
  // In this case, "GPU array of 32-bit floats"
  // gl.STATIC_DRAW hints to WebGL that we don't plan on changing this data,
  //  but we do plan on using it often when drawing things.
  const triangleGeoBuffer = gl.createBuffer();
  if (!triangleGeoBuffer) {
    showError('Failed to create triangle geometry buffer - demo might break');
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesTypedData, gl.STATIC_DRAW);

  //
  // Step 3: Tell WebGL which shaders to use for drawing
  //
  // WebGL shaders come in two flavors, both required for drawing:
  // - Vertex shader: _where_ should a triangle go?
  // - Fragment shader: how should a pixel on a triangle be colored?
  //
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) {
    showError('Failed to CREATE vertex shader - demo might break');
  }
  gl.shaderSource(vertexShader, vertexShaderText);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    showError('Failed to COMPILE vertex shader - demo might break');
  }

  const fragmentShader = gl.createShader(gl.VERTEX_SHADER);
  if (!fragmentShader) {
    showError('Failed to CREATE fragment shader - demo might break');
  }
  gl.shaderSource(fragmentShader, fragmentShaderText);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    showError('Failed to COMPILE fragment shader - demo might break');
  }

  const helloTriangleProgram = gl.createProgram();
  if (!helloTriangleProgram) {
    showError('Failed to CREATE hello triangle program - demo might break');
  }
  
}
