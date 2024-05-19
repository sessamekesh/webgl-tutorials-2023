import { createProgram, createStaticVertexBuffer, showError } from './gl-utils';

const vsSource = `#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec3 vertexNormal;

out vec3 fragmentPosition;
out vec3 fragmentColor;
out vec3 fragmentNormal;

uniform vec3 objectColor;
uniform mat4 matWorld;
uniform mat4 matViewProj;

void main() {
  fragmentColor = objectColor;

  fragmentNormal = (matViewProj * matWorld * vec4(vertexNormal, 0.0)).xyz;
  fragmentPosition = matWorld * vec4(vertexPosition, 1.0).xyz;
  gl_Position = matViewProj * vec4(fragmentPos, 1.0);
}`;

const fsSource = `#version 300 es
precision mediump float;

in vec3 fragmentPosition;
in vec3 fragmentColor;
in vec3 fragmentNormal;

uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform float ambientCoefficient;
uniform float specularPower;

out vec4 outputColor;

void main() {
  vec3 normal = normalize(fragmentNormal);
  vec3 ambientColor = ambientCoefficient * fragmentColor;

  vec3 lightDirection = normalize(lightPosition - fragmentPosition);
  float diffuseCoefficient = max(dot(lightDirection, normal), 0.0);
  vec3 diffuseColor = diffuseCoefficient * fragmentColor;

  vec3 viewDirection = normalize(cameraPosition - fragmentPosition);
  vec3 reflectDirection = reflect(-lightDirection, normal);
  vec3 halfwayDirection = normalize(lightDirection + viewDirection);
  float specularCoefficient = pow(max(dot(normal, halfwayDirection), 0.0), specularPower);
  vec3 specularColor = vec3(specularCoefficient);

  outputColor = ambientColor + diffuseColor + specularColor;
}`;

export interface BlinnPhongProgram {
  program: WebGLProgram;
  vertexPosition: number;
  vertexNormal: number;
  objectColor: WebGLUniformLocation;
  matWorld: WebGLUniformLocation;
  matViewProj: WebGLUniformLocation;
  lightPosition: WebGLUniformLocation;
  cameraPosition: WebGLUniformLocation;
  ambientCoefficient: WebGLUniformLocation;
  specularPower: WebGLUniformLocation;
}

export function createSolidBlinnPhongProgram(
    gl: WebGL2RenderingContext): BlinnPhongProgram | null {
  const program = createProgram(gl, vsSource, fsSource);

  if (!program) return null;

  const vertexPosition = gl.getAttribLocation(program, 'vertexPosition');
  const vertexNormal = gl.getAttribLocation(program, 'vertexNormal');
  if (vertexPosition < 0 || vertexNormal < 0) {
    showError(`Blinn-Phong - failed to get attribute locations, pos=${vertexPosition} norm=${vertexNormal}`);
    return null;
  }

  const objectColor = gl.getUniformLocation(program, 'objectColor');
  const matWorld = gl.getUniformLocation(program, 'matWorld');
  const matViewProj = gl.getUniformLocation(program, 'matViewProj');
  const lightPosition = gl.getUniformLocation(program, 'lightPosition');
  const cameraPosition = gl.getUniformLocation(program, 'cameraPosition');
  const ambientCoefficient = gl.getUniformLocation(program, 'ambientCoefficient');
  const specularPower = gl.getUniformLocation(program, 'specularPower');

  if (!objectColor || !matWorld || !matViewProj ||
      !lightPosition || !cameraPosition || !ambientCoefficient || !specularPower) {
    showError(`Blinn-Phong - failed to get uniform locations:
objectColor=${objectColor}
matWorld=${matWorld}
matViewProj=${matViewProj}
lightPosition=${lightPosition}
cameraPosition=${cameraPosition}
ambientCoefficient=${ambientCoefficient}
specularPower=${specularPower}`);
    return null;
  }

  return {
    program,
    ambientCoefficient,
    cameraPosition,
    lightPosition,
    matViewProj,
    matWorld,
    objectColor,
    specularPower,
    vertexNormal,
    vertexPosition
  };
}
