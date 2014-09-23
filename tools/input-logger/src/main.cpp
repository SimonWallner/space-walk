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
#include "JoystickManager.hpp"

#include "data.hpp"

float lastDeviceUpdateTime = 0;
float UpdateIntervalSeconds = 1;


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

	if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_GAMECONTROLLER | SDL_INIT_TIMER) != 0) {
		std::cout << "SDL_Init Error: " << SDL_GetError() << std::endl;
		return 1;
	}

	SDL_Window* windowHandle = SDL_CreateWindow("Space Walk input logger", 100, 100, 336, 374, SDL_WINDOW_SHOWN);
	
	if (windowHandle == nullptr) {
		std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
		return 1;
	}

	auto renderer = SDL_CreateRenderer(windowHandle, -1, 0);
	SDL_SetRenderDrawColor(renderer, 243, 239, 236, 255);
	SDL_RenderClear(renderer);
	SDL_RenderPresent(renderer);



	// setup joysticks
	SDL_SetHint(SDL_HINT_JOYSTICK_ALLOW_BACKGROUND_EVENTS, "1");

	
	
	// setup networking
	boost::asio::io_service io_service;
	TCPServer server(io_service, port);
	

	// run!
	std::cout << "entering main loop" << std::endl;

	auto joystickManager = new JoystickManager(renderer);
	
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

		auto time = (float)SDL_GetTicks() / 1000.0f;
		if (lastDeviceUpdateTime + UpdateIntervalSeconds < time)
		{
			joystickManager->updateDeviceList();
			lastDeviceUpdateTime = time;
		}

		SDL_JoystickUpdate();

		SDL_Event e;
		while (SDL_PollEvent(&e))
		{

			if (e.type == SDL_QUIT)
			{
				running = false;
			}

			joystickManager->handleEvent(e, &server);
		}
		

		// deschedule this thread to save some resources...
		// time passed to the function is lower bound
		std::this_thread::sleep_for(std::chrono::milliseconds(1));
	}

	SDL_Quit();
	return 0;
}
