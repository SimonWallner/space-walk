#include <iostream>
#include <vector>

#include <SDL.h>
#include <boost/asio.hpp>

#include "compiler.h"

using boost::asio::ip::tcp;

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
	int numJoysticks = SDL_NumJoysticks();
	std::cout << numJoysticks << " joystic(s) found." << std::endl;

	auto joystics = std::vector<SDL_Joystick*>();
    unsigned int numAxes = 0;
    unsigned int numButtons = 0;
	for (int i = 0; i < numJoysticks; i++)
	{
		SDL_Joystick* stick = SDL_JoystickOpen(i);
		joystics.push_back(stick);

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

	// setup networking
	boost::asio::io_service io_service;
	tcp::acceptor acceptor(io_service, tcp::endpoint(tcp::v4(), port));
    tcp::socket socket(io_service);

	// run!
	bool running = true;
	while (running)
	{
        if (!socket.is_open()) {
            std::cout << "listening to socket: " << port << std::endl;
            acceptor.accept(socket);

            boost::system::error_code ignored_error;
            boost::asio::write(socket, boost::asio::buffer("hello space walk"), ignored_error);
            std::cout << "socket connection established" << std::endl;
        }


		SDL_JoystickUpdate();

		SDL_Event e;
		while (SDL_PollEvent(&e)){
			//If user closes the window
			if (e.type == SDL_QUIT)
			{
				running = false;
			}
			else if (e.type == SDL_JOYAXISMOTION)
			{
//				std::cout << "joystic: " << e.jaxis.which << ", axis: " << e.jaxis.axis;
//				std::cout << " , value: " << e.jaxis.value << ", time: " << e.jaxis.timestamp << std::endl;
                std::cout << "which: " << e.jaxis.which << std::endl;
                std::cout << "axis: " << (int) e.jaxis.axis << std::endl;
                std::cout << "type: " << e.jaxis.type << std::endl;
                std::cout << "time stamp: " << e.jaxis.timestamp << std::endl;
			}
		}
		SDL_Delay(1);
	}

	SDL_Quit();
	return 0;
}