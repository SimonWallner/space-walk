cmake_minimum_required(VERSION 2.8.12)

project(space-walk-input-logger CXX)

set(EXECUTABLE_OUTPUT_PATH ${PROJECT_BINARY_DIR}/bin)

# xcode Product Name
set(APP_NAME space-walk-input-logger)


# -- add subdirs -------------------------------------------------------------
add_subdirectory(external/sdl)
add_subdirectory(src)
