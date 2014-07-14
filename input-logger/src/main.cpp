#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
#include <chrono>
#include <thread>

#include <cfloat>

#include <SDL.h>

#include "compiler.h"
#include "TCPServer.hpp"

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
	}

	if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_GAMECONTROLLER | SDL_INIT_TIMER) != 0) {
		std::cout << "SDL_Init Error: " << SDL_GetError() << std::endl;
		return 1;
	}

	std::cout << "hello sdl" << std::endl;

	SDL_Window* windowHandle = SDL_CreateWindow("Hello World!", 100, 100, 640, 480, SDL_WINDOW_SHOWN);
	
	if (windowHandle == nullptr) {
		std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
		return 1;
	}

	// setup joysticks
	SDL_SetHint(SDL_HINT_JOYSTICK_ALLOW_BACKGROUND_EVENTS, "1");


    bool dirty = false;
    unsigned int numJoysticks = SDL_NumJoysticks();

	auto numAxes = new unsigned int[numJoysticks];
	auto numButtons = new unsigned int[numJoysticks];
	
    int activeJoystick = 0; // starting with 0
	std::cout << numJoysticks << " joystic(s) found." << std::endl;
    
	for (unsigned int i = 0; i < numJoysticks; i++)
	{
		numAxes[i] = 0;
		numButtons[i] = 0;

		SDL_Joystick* stick = SDL_JoystickOpen(i);

		if (stick) {
	        printf("Opened Joystick 0\n");
	        printf("Name: %s\n", SDL_JoystickNameForIndex(i));
	        // printf("Devise GUID: %s\n", SDL_JoystickGetGUIDString(i));
	        printf("Number of Axes: %d\n", SDL_JoystickNumAxes(stick));
	        printf("Number of Buttons: %d\n", SDL_JoystickNumButtons(stick));
	        printf("Number of Balls: %d\n", SDL_JoystickNumBalls(stick));
            
            numAxes[i] = SDL_JoystickNumAxes(stick);
            numButtons[i] = SDL_JoystickNumButtons(stick);
	    } else {
	        printf("Couldn't open Joystick 0\n");
	    }
	}
    

    auto axesBuffer = new float*[numJoysticks];
    auto buttonsBuffer = new float*[numJoysticks];

    for (unsigned int i = 0; i < numJoysticks; i++)
    {
    	axesBuffer[i] = new float[numAxes[i]];
    	for (unsigned int j = 0; j < numAxes[i]; j++)
	    {
	        axesBuffer[i][j] = 0;
	    }
	    
	    buttonsBuffer[i] = new float[numButtons[i]];
	    for (unsigned int j = 0; j < numButtons[i]; j++)
	    {
			buttonsBuffer[i][j] = 0;
	    }	
    }
    

    
    
    
    // setup networking
    boost::asio::io_service io_service;
    TCPServer server(io_service, 60601);
    
    
    auto lastFrame = 0.0f;
    auto minFrameDelta = FLT_MAX;
    auto maxFrameDelta = 0.0f;

	// run!
    std::cout << "entering main loop" << std::endl;
    std::cout << "active joystic is: " << activeJoystick << std::endl;
	bool running = true;
	while (running)
	{
        try
        {
            io_service.poll();
        }
        catch (std::exception& e)
        {
            std::cerr << e.what() << std::endl;
        }

		SDL_JoystickUpdate();

		SDL_Event e;
		while (SDL_PollEvent(&e))
        {
			if (e.type == SDL_QUIT)
			{
				running = false;
			}
            else if (e.type == SDL_KEYDOWN)
            {
             if (e.key.state == SDL_PRESSED && e.key.keysym.scancode == SDL_SCANCODE_LEFT)
                {
                    activeJoystick = (activeJoystick - 1) % numJoysticks;
                    std::cout << "active joystic is: " << activeJoystick << std::endl;
                }
                if (e.key.state == SDL_PRESSED && e.key.keysym.scancode == SDL_SCANCODE_RIGHT)
                {
                    activeJoystick = (activeJoystick + 1) % numJoysticks;
                    std::cout << "active joystic is: " << activeJoystick << std::endl;
                }
            }
			else if (e.type == SDL_JOYAXISMOTION)
			{
                if (e.jaxis.which == activeJoystick)
                {
					float oldValue = axesBuffer[activeJoystick][e.jaxis.axis];
					float newValue = (float)e.jaxis.value / (float)(0xffff / 2);

					dirty = dirty || (oldValue != newValue);

					axesBuffer[activeJoystick][e.jaxis.axis] = newValue;
				}
            }
            else if (e.type == SDL_JOYBUTTONDOWN)
			{
				if (e.jaxis.which == activeJoystick)
                {
					dirty = dirty || (buttonsBuffer[activeJoystick][e.jbutton.button] != 1.0f);
	                buttonsBuffer[activeJoystick][e.jbutton.button] = 1.0f;
	            }
			}
            else if (e.type == SDL_JOYBUTTONUP)
			{
                if (e.jaxis.which == activeJoystick)
                {
	                dirty = dirty || (buttonsBuffer[activeJoystick][e.jbutton.button] != 0.0f);
	                buttonsBuffer[activeJoystick][e.jbutton.button] = 0.0f;
	            }
			}
		}
        
        // transfer frame
        float time = (float)SDL_GetTicks() / 1000.0f;

        if (dirty)
        {
            for (unsigned int i = 0; i < numAxes[activeJoystick]; i++)
            {
                std::stringstream sstr;
                sstr << "axis-" << i;
                
                server.inputAnalog(sstr.str(), axesBuffer[activeJoystick][i], time, -1.0f, 1.0f);
            }
            
            for (unsigned int i = 0; i < numButtons[activeJoystick]; i++)
            {
                std::stringstream sstr;
                sstr << "button-" << i;
                
                server.inputDigital(sstr.str(), buttonsBuffer[activeJoystick][i], time);
            }
            
            auto dt = time - lastFrame;
            minFrameDelta = std::min(minFrameDelta, dt);
            maxFrameDelta = std::max(maxFrameDelta, dt);
            std::cout << "dt: " << dt * 1000 << "ms, min dt: " << minFrameDelta * 1000 << "ms, max dt: " << maxFrameDelta << std::endl;
            
			lastFrame = time;
        }
        
        dirty = false;

        // deschedule this thread to save some resources...
        // time passed to the function is lower bound
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
	}

	SDL_Quit();
	return 0;
}


