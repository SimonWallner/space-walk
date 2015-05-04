#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
#include <chrono>
#include <thread>

#include <cfloat>

#include <GLFW/glfw3.h>

#include "compiler.h"
#include "TCPServer.hpp"

#include "data.hpp"

float lastDeviceUpdateTime = 0;
float UpdateIntervalSeconds = 1;


#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-parameter"
// glfw callbacks
static void error_callback(int error, const char* description)
{
    fprintf(stderr, "GFWL Error: %s\n", description);
}

static void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
    glViewport(0, 0, width, height);
}
#pragma GCC diagnostic pop


#ifdef _WINDOWS
#include <tchar.h>
int wmain(int argc, _TCHAR* argv[]) {
#else
int main(int argc, char** argv) {
#endif

	// defaults
	unsigned int port = 60601;

	// command line params
	if (argc >= 2) {
		port = atoi(argv[1]);
	} else {
		std::cout << "Serving at default port: " << port << std::endl;
		std::cout << "call 'input-logger xxxxxx' to specify the port manually." << std::endl;
	}

    
    
    // glfw window setup
    GLFWwindow* window;
    glfwSetErrorCallback(error_callback);
    
    if (!glfwInit())
        exit(EXIT_FAILURE);
    
    window = glfwCreateWindow(640, 480, "Joystick Test", NULL, NULL);
    if (!window)
    {
        glfwTerminate();
        exit(EXIT_FAILURE);
    }
    
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);
  

    std::cout << "setting up server..." << std::endl;
	// setup networking
	boost::asio::io_service io_service;
	TCPServer server(io_service, port);


	// run!

	bool running = true;
	while (running)
	{
        for (int i = GLFW_JOYSTICK_1; i <= GLFW_JOYSTICK_LAST; i++)
        {
            if (glfwJoystickPresent(i)) {
                int count;
                const float* axis = glfwGetJoystickAxes(i, &count);
                for (int j = 0; j < count; j++) {
                    std::cout << "stick: " << i << ", axis: " << j << ": " << axis[j] << std:: endl;
                }
            }
        }
        

		// deschedule this thread to save some resources...
		// time passed to the function is lower bound
		std::this_thread::sleep_for(std::chrono::milliseconds(1));
        
        running = running &&
        	!glfwWindowShouldClose(window)
            && !(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS);
        
        glClear(GL_COLOR_BUFFER_BIT);
        glfwSwapBuffers(window);
        glfwPollEvents();
	}

    glfwTerminate();
    exit(EXIT_SUCCESS);
	return 0;
}
