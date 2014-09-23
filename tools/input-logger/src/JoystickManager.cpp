#include "JoystickManager.hpp"

#include <iostream>
#include <sstream>

#include <SDL.h>

#include "data.hpp"

JoystickManager::JoystickManager(SDL_Renderer* renderer)
	: renderer(renderer)
{
	SDL_RWops* rw = SDL_RWFromConstMem(controllerImageData, controllerImageLength);
	auto img = SDL_LoadBMP_RW(rw, 1);

	if (img == nullptr)
	{
		 std::cout << "failed to load image from memory: " << SDL_GetError() << std::endl;
		 exit(1);
	}
	texture = SDL_CreateTextureFromSurface(renderer, img);
}

void JoystickManager::updateDeviceList()
{
	std::cout << "updating device list" << std::endl;
	
	unsigned int numJoysticks = SDL_NumJoysticks();
	std::cout << numJoysticks << " joystic(s) found." << std::endl;

	for (unsigned int i = 0; i < numJoysticks && i < MAX_DEVISES; i++)
	{
		auto stick = SDL_JoystickOpen(i);

		if (stick) {
			SDL_JoystickGUID guid = SDL_JoystickGetDeviceGUID(i);
			auto pszGUID = new char[128];
			SDL_JoystickGetGUIDString(guid, pszGUID, 128);

			std::cout << "Opened Joystick " << i << std::endl;
			std::cout << "Name: " << SDL_JoystickNameForIndex(i) << std::endl;
			std::cout << "Devise GUID string: " << pszGUID << std::endl;
			std::cout << "Number of Axes: " << SDL_JoystickNumAxes(stick) << std::endl;
			std::cout << "Number of Buttons: " << SDL_JoystickNumButtons(stick) << std::endl;
			std::cout << "Number of Balls: " << SDL_JoystickNumBalls(stick) << std::endl;

//			devices[i].numAxis = SDL_JoystickNumAxes(stick);
//			devices[i].numButtons = SDL_JoystickNumButtons(stick);

		} else {
			std::cout << "failed to open joystick " << i << std::endl;
		}
	}

	// draw icons on the screen
	SDL_RenderClear(renderer);
	for (unsigned int i = 0; i < numJoysticks; i++) {
		SDL_Rect rect;
		rect.w = 20;
		rect.h = 15;
		rect.x = 25 * 1 + 20;
		rect.y = 20;

		SDL_RenderCopy(renderer, texture, nullptr, &rect);
	}
	SDL_RenderPresent(renderer);
}

void JoystickManager::handleEvent(const SDL_Event &e, TCPServer* server) {
	auto time = (float)SDL_GetTicks() / 1000.0f;

	if (e.type == SDL_JOYAXISMOTION)
	{
		{
			auto number = e.jdevice.which;
			auto axis = (unsigned int)e.jaxis.axis;

			std::stringstream sstr;
			sstr << "axis-" << axis;

			auto value = (float)e.jaxis.value / (float)(0xffff / 2);
			float oldValue = devices[number].axisBuffer[axis];

			if (value != oldValue)
			{
				server->inputAnalog(sstr.str(), number, value, time, -1.0f, 1.0f);
				devices[number].axisBuffer[axis] = value;
			}
		}
	}
	else if (e.type == SDL_JOYBUTTONDOWN || e.type == SDL_JOYBUTTONUP)
	{
		auto number = e.jdevice.which;
		auto button = (unsigned int)e.jbutton.button;

		std::stringstream sstr;
		sstr << "button-" << button;

		auto value = (e.type == SDL_JOYBUTTONDOWN ? 1 : 0);
		float oldValue = devices[number].buttonBuffer[button];

		if (value != oldValue)
		{
			server->inputDigital(sstr.str(), number, button, value, time);
			devices[number].buttonBuffer[button] = value;
		}
	}
}
