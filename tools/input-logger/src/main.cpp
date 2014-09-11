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

struct Sample {
	float value;
	bool valueChanged;
};

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

	std::cout << "Serving at port " << port << std::endl;

	SDL_Window* windowHandle = SDL_CreateWindow("Space Walk input logger", 100, 100, 200, 200, SDL_WINDOW_SHOWN);
	
	if (windowHandle == nullptr) {
		std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
		return 1;
	}

	// setup joysticks
	SDL_SetHint(SDL_HINT_JOYSTICK_ALLOW_BACKGROUND_EVENTS, "1");


	unsigned int numJoysticks = SDL_NumJoysticks();

	auto numAxes = new unsigned int[numJoysticks];
	auto numButtons = new unsigned int[numJoysticks];
	bool globalDirtyFlag = false;
	
	int activeJoystick = 0; // starting with 0
	std::cout << numJoysticks << " joystic(s) found." << std::endl;

	if (numJoysticks == 0)
	{
		std::cout << "quitting..." << std::endl;
		return 1;
	}
	
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
	

	auto axesBuffer = new Sample*[numJoysticks];
	auto buttonsBuffer = new Sample*[numJoysticks];

	for (unsigned int i = 0; i < numJoysticks; i++)
	{
		axesBuffer[i] = new Sample[numAxes[i]];
		for (unsigned int j = 0; j < numAxes[i]; j++)
		{
			Sample sample = {};
			sample.valueChanged = false;
			sample.value = 0.0f;

			axesBuffer[i][j] = sample;
		}
		
		buttonsBuffer[i] = new Sample[numButtons[i]];
		for (unsigned int j = 0; j < numButtons[i]; j++)
		{
			Sample sample = {};
			sample.valueChanged = false;
			sample.value = 0.0f;

			buttonsBuffer[i][j] = sample;
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
					float oldValue = axesBuffer[activeJoystick][e.jaxis.axis].value;
					float newValue = (float)e.jaxis.value / (float)(0xffff / 2);

					auto dirty = (oldValue != newValue);
					if (dirty)
					{
						Sample sample = {};
						sample.valueChanged = true;
						sample.value = newValue;

						axesBuffer[activeJoystick][e.jaxis.axis] = sample;
					}

					globalDirtyFlag = globalDirtyFlag || dirty;
				}
			}
			else if (e.type == SDL_JOYBUTTONDOWN)
			{
				if (e.jaxis.which == activeJoystick)
				{
					Sample sample = {};
					sample.valueChanged = true;
					sample.value = 1.0f;
					buttonsBuffer[activeJoystick][e.jbutton.button] = sample;	

					globalDirtyFlag = true;
				}
			}
			else if (e.type == SDL_JOYBUTTONUP)
			{
				if (e.jaxis.which == activeJoystick)
				{
					Sample sample = {};
					sample.valueChanged = true;
					sample.value = 0.0f;
					buttonsBuffer[activeJoystick][e.jbutton.button] = sample;	

					globalDirtyFlag = true;
				}
			}
		}
		
		// transfer frame
		float time = (float)SDL_GetTicks() / 1000.0f;

		for (unsigned int i = 0; i < numAxes[activeJoystick]; i++)
		{
			if (axesBuffer[activeJoystick][i].valueChanged)
			{
				std::stringstream sstr;
				sstr << "axis-" << i;
				
				server.inputAnalog(sstr.str(), axesBuffer[activeJoystick][i].value, time, -1.0f, 1.0f);	

				axesBuffer[activeJoystick][i].valueChanged = false;
			}
		}
		
		for (unsigned int i = 0; i < numButtons[activeJoystick]; i++)
		{
			if (buttonsBuffer[activeJoystick][i].valueChanged)
			{
				std::stringstream sstr;
				sstr << "button-" << i;
				
				server.inputDigital(sstr.str(), buttonsBuffer[activeJoystick][i].value, time);	

				buttonsBuffer[activeJoystick][i].valueChanged = false;	
			}
		}
		
		if (globalDirtyFlag)
		{
			auto dt = time - lastFrame;
			minFrameDelta = std::min(minFrameDelta, dt);
			maxFrameDelta = std::max(maxFrameDelta, dt);
			std::cout << "dt: " << dt * 1000 << "ms, min dt: " << minFrameDelta * 1000 << "ms, max dt: " << maxFrameDelta << std::endl;
			
			lastFrame = time;
			globalDirtyFlag = false;
		}

		// deschedule this thread to save some resources...
		// time passed to the function is lower bound
		std::this_thread::sleep_for(std::chrono::milliseconds(1));
	}

	SDL_Quit();
	return 0;
}


