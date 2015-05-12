cmake_minimum_required(VERSION 2.8.12)

project(space-walk-input-logger CXX)

set(EXECUTABLE_OUTPUT_PATH ${PROJECT_BINARY_DIR}/bin)

# reserve enough space in the binary to fix the library paths when we fix
# them in the package phase
set(CMAKE_EXE_LINKER_FLAGS -headerpad_max_install_names)
set(CMAKE_SHARED_LINKER_FLAGS -headerpad_max_install_names)
set(CMAKE_MODULE_LINKER_FLAGS -headerpad_max_install_names)

# xcode Product Name
set(APP_NAME space-walk-input-logger)

# -- add subdirs -------------------------------------------------------------
add_subdirectory(external/sdl)
add_subdirectory(src)
