/** Helper method to output an error message to the screen */
function showError(errorText) {
  const errorBoxDiv = document.getElementById('error-box');
  const errorSpan = document.createElement('p');
  errorSpan.innerText = errorText;
  errorBoxDiv.appendChild(errorSpan);
  console.error(errorText);
}

function helloTriangle() {
  //
  // Setup Step 1: Get the WebGL rendering context for our HTML canvas rendering area
  //
  // The WebGL context is the object used to generate images via the WebGL API, and
  //  the canvas it is associated with is an area where those generated images will
  //  be placed by the browser once the JavaScript code is done working on it
  //

  // Below type annotation is totally ignored by JavaScript, but it helps IDEs
  //  figure out that the HTML element below is a canvas, not a div, p, span, etc.
  /** @type {HTMLCanvasElement|null} */
  const canvas = document.getElementById('demo-canvas');
  if (!canvas) {
    showError('Could not find HTML canvas element - check for typos, or loading JavaScript file too early');
    return;
  }
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    const isWebGl1Supported = !!(document.createElement('canvas')).getContext('webgl');
    if (isWebGl1Supported) {
      showError('WebGL 1 is supported, but not v2 - try using a different device or browser');
    } else {
      showError('WebGL is not supported on this device - try using a different device or browser');
    }
    return;
  }

  //
  // Create a list of [X, Y] coordinates belonging to the corners ("vertices")
  //  of the triangle that will be drawn by WebGL.
  //
  // JavaScript arrays aren't very WebGL-friendly, so create a friendlier Float32Array
  //
  // The data is useless on the CPU, so send it over to a GPU buffer by using the
  //  ARRAY_BUFFER binding point and gl.bufferData WebGL call
  //
  const triangleVertices = [
    // Top middle
    0.0, 0.5,
    // Bottom left
    -0.5, -0.5,
    // Bottom right
    0.5, -0.5
  ];
  const triangleGeoCpuBuffer = new Float32Array(triangleVertices);

  const triangleGeoBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleGeoCpuBuffer, gl.STATIC_DRAW);

  //
  // Create the vertex and fragment shader for this demo. GLSL shader code is
  //  written as a plain JavaScript string, attached to a shader, and compiled
  //  with the "compileShader" call.
  //
  // If both shaders compile successfully, attach them to a WebGLProgram
  //  instance - vertex and fragment shaders must be used together in a draw
  //  call, and a WebGLProgram represents the combination of shaders to be used.
  //
  const vertexShaderSourceCode = `#version 300 es
  precision mediump float;
  
  in vec2 vertexPosition;

  void main() {
    gl_Position = vec4(vertexPosition, 0.0, 1.0);
  }`;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(vertexShader);
    showError(`Failed to compile vertex shader: ${errorMessage}`);
    return;
  }

  const fragmentShaderSourceCode = `#version 300 es
  precision mediump float;
  
  out vec4 outputColor;

  void main() {
    outputColor = vec4(0.294, 0.0, 0.51, 1.0);
  }`;

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(fragmentShader);
    showError(`Failed to compile fragment shader: ${errorMessage}`);
    return;
  }

  const helloTriangleProgram = gl.createProgram();
  gl.attachShader(helloTriangleProgram, vertexShader);
  gl.attachShader(helloTriangleProgram, fragmentShader);
  gl.linkProgram(helloTriangleProgram);
  if (!gl.getProgramParameter(helloTriangleProgram, gl.LINK_STATUS)) {
    const errorMessage = gl.getProgramInfoLog(helloTriangleProgram);
    showError(`Failed to link GPU program: ${errorMessage}`);
    return;
  }

  // Attribute locations allow us to talk about which shader input should
  //  read from which GPU buffer in the later "vertexAttribPointer" call.
  // NOTE - WebGL 2 and OpenGL 4.1+ should use VertexArrayObjects instead,
  //  which I'll cover in the next tutorial.
  const vertexPositionAttributeLocation = gl.getAttribLocation(helloTriangleProgram, 'vertexPosition');
  if (vertexPositionAttributeLocation < 0) {
    showError(`Failed to get attribute location for vertexPosition`);
    return;
  }

  //
  // Render a frame!
  //
  // Of the below steps, the order is unimportant and up to the application
  //  developer. I've picked an order that makes general sense.
  //
  // The only order-sensitive thing is that the draw call (gl.drawArrays)
  //  must be made after all of the other pipeline state has been set up
  //  correctly, since it dispatches the draw commands to the GPU using
  //  the current state.
  //

  // Output merger (how to apply an updated pixel to the output image)
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.clearColor(0.08, 0.08, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Rasterizer (which output pixels are covered by a triangle?)
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set up GPU program
  // Vertex shader (where to put vertex on the screen, in clip space?)
  // Fragment shader (what color should a pixel be?)
  gl.useProgram(helloTriangleProgram);
  gl.enableVertexAttribArray(vertexPositionAttributeLocation);

  // Input assembler (how to read vertex information from buffers?)
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.vertexAttribPointer(
    /* index: vertex attrib location */
    vertexPositionAttributeLocation,
    /* size: number of components in the attribute */
    2,
    /* type: type of data in the GPU buffer for this attribute */
    gl.FLOAT,
    /* normalized: if type=float and is writing to a vec(n) float input, should WebGL normalize the ints first? */
    false,
    /* stride: bytes between starting byte of attribute for a vertex and the same attrib for the next vertex */
    2 * Float32Array.BYTES_PER_ELEMENT,
    /* offset: bytes between the start of the buffer and the first byte of the attribute */
    0
  );
  
  // Draw call (Primitive assembly (which vertices form triangles together?))
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

try {
  helloTriangle();
} catch (e) {
  showError(`Uncaught JavaScript exception: ${e}`);
}
