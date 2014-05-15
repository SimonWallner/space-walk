#include <iostream>

#include <SDL.h>

#include "compiler.h"

int main(int argc, char* argv[]) {
	UNUSED argc;
	UNUSED argv;

	if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_GAMECONTROLLER | SDL_INIT_TIMER) != 0){
		std::cout << "SDL_Init Error: " << SDL_GetError() << std::endl;
		return 1;
	}

	std::cout << "hello sdl" << std::endl;

	SDL_Window *win = SDL_CreateWindow("Hello World!", 100, 100, 640, 480, SDL_WINDOW_SHOWN);
	
	if (win == nullptr){
		std::cout << "SDL_CreateWindow Error: " << SDL_GetError() << std::endl;
		return 1;
	}

	
	bool running = true;

	while (running)
	{
		SDL_Event e;
		while (SDL_PollEvent(&e)){
			//If user closes the window
			if (e.type == SDL_QUIT)
				running = false;
		}
	}

	SDL_Quit();
	return 0;
}