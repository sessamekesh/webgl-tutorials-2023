// clang-format off
#include <glad/glad.h>
#include <GLFW/glfw3.h>
// clang-format on

#include <iostream>

static void glfwErrorCallback(int id, const char* description) {
  std::cerr << "GLFW error (" << id << ") - " << description << std::endl;
}

const char* vertexShaderText = R"VST(#version 330 core
precision mediump float;

in vec2 vertexPosition;

void main () {
  gl_Position = vec4(vertexPosition, 0.0, 1.0);
})VST";

const char* fragmentShaderText = R"FST(#version 330 core
precision mediump float;

out vec4 helloTriangleColor;

void main() {
  helloTriangleColor = vec4(0.294, 0.0, 0.51, 1.0);
})FST";

int main() {
  // Setup Step 1: create render surface (window) and initialize OpenGL
  glfwSetErrorCallback(&glfwErrorCallback);
  glfwInit();
  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 2);
  glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

  GLFWwindow* window =
      glfwCreateWindow(800, 800, "Hello, Triangle!", NULL, NULL);

  if (!window) {
    std::cerr << "Failed to create GLFW window, exiting" << std::endl;
    glfwTerminate();
    return -1;
  }
  glfwMakeContextCurrent(window);

  if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
    std::cerr << "Failed to initialize OpenGL via GLAD" << std::endl;
    glfwTerminate();
    return -1;
  }

  // Setup Step 2: Define the shape of the triangle
  float triangleVertices[] = {// Top middle
                              0.0f, 0.5f,
                              // Bottom left
                              -0.5f, -0.5f,
                              // Bottom right
                              0.5f, -0.5f};
  GLuint triangleGeoBuffer = 0, triangleGeoVAO = 0;
  glGenVertexArrays(1, &triangleGeoVAO);
  glGenBuffers(1, &triangleGeoBuffer);
  glBindVertexArray(triangleGeoVAO);
  glBindBuffer(GL_ARRAY_BUFFER, triangleGeoBuffer);
  glBufferData(GL_ARRAY_BUFFER, sizeof(triangleVertices), triangleVertices,
               GL_STATIC_DRAW);
  glBindVertexArray(NULL);

  // Setup Step 3: Compile vertex and fragment shaders for use with rendering
  GLint success = -1;
  char infoLog[512];

  GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
  glShaderSource(vertexShader, 1, &vertexShaderText, NULL);
  glCompileShader(vertexShader);
  glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
  if (!success) {
    glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
    std::cerr << "Vertex shader compilation failed:\n" << infoLog << std::endl;
    return -1;
  }

  GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
  glShaderSource(fragmentShader, 1, &fragmentShaderText, NULL);
  glCompileShader(fragmentShader);
  glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
  if (!success) {
    glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
    std::cerr << "Fragment shader compilation failed:\n"
              << infoLog << std::endl;
    return -1;
  }

  GLuint helloTriangleProgram = glCreateProgram();
  glAttachShader(helloTriangleProgram, vertexShader);
  glAttachShader(helloTriangleProgram, fragmentShader);
  glLinkProgram(helloTriangleProgram);
  glGetProgramiv(helloTriangleProgram, GL_LINK_STATUS, &success);
  if (!success) {
    glGetProgramInfoLog(helloTriangleProgram, 512, NULL, infoLog);
    std::cerr << "Failed to LINK helloTriangleProgram:\n"
              << infoLog << std::endl;
    return -1;
  }
  // Resource cleanup is necessary in C++ but not JavaScript - garbage collector
  //  handles WebGL resource cleanup for us in WebGL.
  glDeleteShader(vertexShader);
  glDeleteShader(fragmentShader);

  // Setup Step 4: Get vertexPosition vertex shader attribute location
  GLint vertexPositionAttribLocation =
      glGetAttribLocation(helloTriangleProgram, "vertexPosition");
  if (vertexPositionAttribLocation < 0) {
    std::cerr << "Failed to get attrib location for vertexPosition"
              << std::endl;
    return -1;
  }

  {
    auto err = glGetError();
    if (err > 0) {
      std::cerr << "OpenGL error - " << err << std::endl;
      return -1;
    }
  }

  // Render loop - in C++ implementation, app is in charge of its own lifecycle
  while (!glfwWindowShouldClose(window)) {
    // Render Step 1: clear the canvas
    glClearColor(0.08f, 0.08f, 0.08f, 1.0f);
    int width = 0, height = 0;
    glfwGetWindowSize(window, &width, &height);
    glViewport(0, 0, width, height);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    // Render Step 2: Tell WebGL to use our program for any upcoming draw calls.
    // Notify OpenGL about all attribute slots that need to be used.
    glUseProgram(helloTriangleProgram);
    glEnableVertexAttribArray(vertexPositionAttribLocation);

    // Render Step 3: Tell OpenGL to pull vertexPosition attrib from
    // triangleGeoBuffer
    glBindVertexArray(triangleGeoVAO);

    // Tell OpenGL that vertexPosition comes from the current ARRAY_BUFFER, in
    // sets
    //  of two floats each, starting 8 bytes apart from each other with no
    //  offset from the beginning of the buffer
    glVertexAttribPointer(
        /* index: vertex attrib location (got earlier) */
        vertexPositionAttribLocation,
        /* size: number of components in this attribute (vec2 = 2) */
        2,
        /* type: type of data in this attribute (vec2 = float) */
        GL_FLOAT,
        /* normalized: only used for int values (true to map int inputs to float
           range 0, 1) */
        GL_FALSE,
        /* stride: how far to move forward in the buffer for the next element,
           in bytes (2 floats) */
        sizeof(float) * 2,
        /* offset: how far from the first element in the buffer to start looking
           for data */
        (void*)0);

    // Render Step 4: Execute the draw call to actually dispatch to GPU
    glDrawArrays(GL_TRIANGLES, 0, 3);

    // Check for errors...
    {
      auto err = glGetError();
      if (err > 0) {
        std::cerr << "OpenGL error - " << err << std::endl;
        return -1;
      }
    }

    // Render Step 5: Swap buffers - present back buffer, and prepare current
    // surface for next frame
    glfwSwapBuffers(window);
    glfwPollEvents();
  }

  // Free resources used by this program...
  glDeleteVertexArrays(1, &triangleGeoVAO);
  glDeleteBuffers(1, &triangleGeoBuffer);
  glDeleteProgram(helloTriangleProgram);

  glfwTerminate();
  return 0;
}
