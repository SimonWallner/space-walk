# compiler settings
add_definitions(-std=c++11)
add_definitions(-Wall -pedantic)

add_definitions(-g -O0) # debugging

if (NOT "${CMAKE_CXX_COMPILER_ID}" STREQUAL "MSVC")
	add_definitions(-Wextra -Werror -Winit-self)
	add_definitions(-Wno-long-long)
	add_definitions(-Wno-c++11-extensions)
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



include_directories(
	${PROJECT_SOURCE_DIR}/external/sdl/include
	${Boost_INCLUDE_DIR}
)

link_directories(
	${Boost_LIBRARY_DIRS}
)

# collect the files
file(GLOB_RECURSE HEADER_FILES *.hpp)
file(GLOB_RECURSE SOURCE_FILES *.cpp)



add_executable(input-logger ${SOURCE_FILES} ${HEADER_FILES})

set (TARGET_LINK_LIBRARIES input-logger
   SDL2-static
   ${Boost_SYSTEM_LIBRARY}
)

target_link_libraries(${TARGET_LINK_LIBRARIES})




