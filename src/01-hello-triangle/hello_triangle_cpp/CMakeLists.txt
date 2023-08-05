cmake_minimum_required(VERSION 3.14)

project(hello-triangle-cpp VERSION 0.1 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)

include(FetchContent)

# GLFW for windowing
FetchContent_Declare(
  glfw
  GIT_REPOSITORY "https://github.com/glfw/glfw/"
  GIT_TAG "df8d7bc892937a8b0f7c604c92a9f64f383cf48c"
)
FetchContent_MakeAvailable(glfw)

add_executable(hello-triangle-cpp main.cc glad/src/glad.c)
target_include_directories(hello-triangle-cpp PRIVATE glad/include)
target_link_libraries(hello-triangle-cpp glfw ${GLFW_LIBRARIES})
