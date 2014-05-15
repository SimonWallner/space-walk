# compiler settings
add_definitions(-std=c++11)
add_definitions(-Wall -pedantic)
if (NOT "${CMAKE_CXX_COMPILER_ID}" STREQUAL "MSVC")
	add_definitions(-Wextra -Werror -Winit-self)
	add_definitions(-Wno-long-long)
	add_definitions(-Wno-c++11-extensions)
endif()



include_directories(
	${PROJECT_SOURCE_DIR}/external/sdl/include
)

link_directories(
)

# collect the files
file(GLOB_RECURSE HEADER_FILES *.hpp)
file(GLOB_RECURSE SOURCE_FILES *.cpp)



add_executable(input-logger ${SOURCE_FILES} ${HEADER_FILES})

set (TARGET_LINK_LIBRARIES input-logger
   SDL2-static
)

target_link_libraries(${TARGET_LINK_LIBRARIES})




