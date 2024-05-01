/** Display an error message to the DOM, beneath the demo element */
export function showError(errorText: string) {
  console.error(errorText);
  const errorBoxDiv = document.getElementById('error-box');
  if (errorBoxDiv === null) {
    return;
  }
  const errorElement = document.createElement('p');
  errorElement.innerText = errorText;
  errorBoxDiv.appendChild(errorElement);
}

export function createStaticVertexBuffer(gl: WebGL2RenderingContext, data: ArrayBuffer) {
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

export function createStaticIndexBuffer(gl: WebGL2RenderingContext, data: ArrayBuffer) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    showError('Failed to allocate buffer');
    return null;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return buffer;
}

export function createProgram(
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

export function getContext(canvas: HTMLCanvasElement) {
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

export function getRandomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
