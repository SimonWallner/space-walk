# compiler settings
add_definitions(-std=c++11)
add_definitions(-Wall -pedantic)

add_definitions(-g -O0) # debugging

if (NOT "${CMAKE_CXX_COMPILER_ID}" STREQUAL "MSVC")
	add_definitions(-Wextra -Werror -Winit-self)
	add_definitions(-Wno-long-long)
	add_definitions(-Wno-c++11-extensions)
	add_definitions(-Wno-unused-variable)
endif()

if(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
	add_definitions(-Wno-deprecated-declarations)
endif()


# -- find stuff --------------------------------------------------------------
if (WIN32)
	set(BOOST_ROOT "C:\\Boost")
endif()
set(Boost_USE_STATIC_LIBS ON)
find_package(Boost)
find_package(Boost REQUIRED COMPONENTS System)
if(NOT Boost_FOUND)
	message(WARNING "Boost not found")
endif()

find_library(COCOA_FRAMEWORK Cocoa)
find_library(CORE_VIDEO_FRAMEWORK CoreVideo)
find_library(IOKIT_FRAMEWORK IOKit)


include_directories(
	${PROJECT_SOURCE_DIR}/external/glfw/include
	${Boost_INCLUDE_DIR}
)

link_directories(
	${Boost_LIBRARY_DIRS}
)

add_executable(input-logger
	main.cpp
	TCPServer.hpp
	TCPServer.cpp
	TCPConnection.hpp
	TCPConnection.cpp
)


target_link_libraries(input-logger
	glfw
	${Boost_SYSTEM_LIBRARY}
	${COCOA_FRAMEWORK}
	${CORE_VIDEO_FRAMEWORK}
	${IOKIT_FRAMEWORK}
	${OPENGL_gl_LIBRARY}
)
