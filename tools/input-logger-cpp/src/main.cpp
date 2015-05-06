#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
#include <chrono>
#include <thread>
#include <sstream>

#include <cfloat>
#include <cmath>

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

    std::cout << "setting up server..." << std::endl;
    // setup networking
    boost::asio::io_service io_service;
    TCPServer server(io_service, port);
    
//    while(true) {
//        server.data("adf", 42, 42);
//    }
    
    
    // glfw window setup
    GLFWwindow* window;
    glfwSetErrorCallback(error_callback);
    
    if (!glfwInit())
        exit(EXIT_FAILURE);
    
    window = glfwCreateWindow(300, 100, "Input Logger", NULL, NULL);
    if (!window)
    {
        glfwTerminate();
        exit(EXIT_FAILURE);
    }
    
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);
    glClearColor(0.5f, 0.5f, 0.5f, 1.0f);
  
    
    int maxJoysticCount = GLFW_JOYSTICK_LAST - GLFW_JOYSTICK_1 + 1;
    int maxAxisCount = 32;
    int maxButtonCount = 32;
    
    auto axisBuffer = new float*[maxJoysticCount];
    for (auto i = 0; i < maxJoysticCount; i++)
    {
        axisBuffer[i] = new float[maxAxisCount];
        for (auto j = 0; j < maxAxisCount; j++)
        {
            axisBuffer[i][j] = 0.0f;
        }
    }
    
    auto buttonBuffer = new bool*[maxJoysticCount];
    for (auto i = 0; i < maxJoysticCount; i++)
    {
        buttonBuffer[i] = new bool[maxButtonCount];
        for (auto j = 0; j < maxButtonCount; j++)
        {
            buttonBuffer[i][j] = false;
        }
    }
    
    
	// run!

	bool running = true;
	while (running)
	{
        auto joysticCount = 0;
        auto eps = 0.01f;
        
        for (int i = GLFW_JOYSTICK_1; i <= GLFW_JOYSTICK_LAST; i++)
        {
            if (glfwJoystickPresent(i)) {
                joysticCount++;
                auto name = glfwGetJoystickName(i);
                
                int axisCount;
                auto axis = glfwGetJoystickAxes(i, &axisCount);
                for (auto j = 0; j < axisCount; j++) {
                    auto newValue = axis[j];
                    auto bufferedValue = axisBuffer[i][j];
                    
                    if (fabs(newValue - bufferedValue) > eps)
                    {
//                        std::cout << "joy: " << i << ", axis: " << j << ", value: " << newValue << std::endl;
                        server.inputAnalog(name, i, newValue, glfwGetTime(), -1.0f, 1.0f);
                        axisBuffer[i][j] = newValue;
                    }
                }
                
                int buttonCount;
                auto buttons = glfwGetJoystickButtons(i, &buttonCount);
                for (auto j = 0; j < buttonCount; j++) {
                    auto newValue = buttons[j];
                    auto bufferedValue = buttonBuffer[i][j];
                    
                    if (newValue != bufferedValue)
                    {
//                        std::cout << "joy: " << i << ", button: " << j << ", value: " << (int)newValue << std::endl;
                        server.inputDigital(name,  i, j, (float)newValue, glfwGetTime());
                        buttonBuffer[i][j] = newValue;
                    }
                }
            }
        }
        
        std::stringstream sstr;
        sstr << "joystics connected: " << joysticCount;
        glfwSetWindowTitle(window, sstr.str().c_str());
        

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
