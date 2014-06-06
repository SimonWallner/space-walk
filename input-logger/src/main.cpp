#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>

#include <cfloat>

#include <SDL.h>

#include "compiler.h"
#include "TCPServer.hpp"

int main(int argc, char* argv[]) {

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
	unsigned int numAxes = 0;
	unsigned int numButtons = 0;
	unsigned int numJoysticks = SDL_NumJoysticks();
	std::cout << numJoysticks << " joystic(s) found." << std::endl;
    
	for (unsigned int i = 0; i < numJoysticks; i++)
	{
		SDL_Joystick* stick = SDL_JoystickOpen(i);

		if (stick) {
	        printf("Opened Joystick 0\n");
	        printf("Name: %s\n", SDL_JoystickNameForIndex(i));
	        // printf("Devise GUID: %s\n", SDL_JoystickGetGUIDString(i));
	        printf("Number of Axes: %d\n", SDL_JoystickNumAxes(stick));
	        printf("Number of Buttons: %d\n", SDL_JoystickNumButtons(stick));
	        printf("Number of Balls: %d\n", SDL_JoystickNumBalls(stick));
            
            numAxes = SDL_JoystickNumAxes(stick);
            numButtons = SDL_JoystickNumButtons(stick);
	    } else {
	        printf("Couldn't open Joystick 0\n");
	    }
	}
    
    if (numJoysticks > 1)
    {
        std::cout << "WARNING: multiple joysticks found! This implementation only supports a single attached device!" << std::endl;
    }
    
    auto axesBuffer = new float[numAxes];
    for (unsigned int i = 0; i < numAxes; i++)
    {
        axesBuffer[i] = 0;
    }
    
    auto buttonsBuffer = new float[numButtons];
    for (unsigned int i = 0; i < numButtons; i++)
    {
		buttonsBuffer[i] = 0;
    }

    
    
    
    // setup networking
    boost::asio::io_service io_service;
    TCPServer server(io_service, 60601);
    
    
    auto lastFrame = 0.0f;
    auto minFrameDelta = FLT_MAX;
    auto maxFrameDelta = 0.0f;

	// run!
    std::cout << "entering main loop" << std::endl;
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
			else if (e.type == SDL_JOYAXISMOTION)
			{
                float oldValue = axesBuffer[e.jaxis.axis];
                float newValue = (float)e.jaxis.value / (float)(0xffff / 2);
                
                dirty = dirty || (oldValue != newValue);
                
				axesBuffer[e.jaxis.axis] = newValue;
            }
            else if (e.type == SDL_JOYBUTTONDOWN)
			{
				dirty = dirty || (buttonsBuffer[e.jbutton.button] != 1.0f);
                buttonsBuffer[e.jbutton.button] = 1.0f;
			}
            else if (e.type == SDL_JOYBUTTONUP)
			{
                dirty = dirty || (buttonsBuffer[e.jbutton.button] != 0.0f);
                buttonsBuffer[e.jbutton.button] = 0.0f;
			}
		}
        
        // transfer frame
        float time = (float)SDL_GetTicks() / 1000.0f;

        if (dirty)
        {
            for (unsigned int i = 0; i < numAxes; i++)
            {
                std::stringstream sstr;
                sstr << "axis-" << i;
                
                server.data(sstr.str(), axesBuffer[i], time);
            }
            
            for (unsigned int i = 0; i < numButtons; i++)
            {
                std::stringstream sstr;
                sstr << "button-" << i;
                
                server.data(sstr.str(), buttonsBuffer[i], time);
            }
            
            auto dt = time - lastFrame;
            minFrameDelta = std::min(minFrameDelta, dt);
            maxFrameDelta = std::max(maxFrameDelta, dt);
            std::cout << "dt: " << dt << ", min dt: " << minFrameDelta << ", max dt: " << maxFrameDelta << ;
            
			lastFrame = time;
        }
        
        dirty = false;
	}

	SDL_Quit();
	return 0;
}


