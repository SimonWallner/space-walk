#include "JoystickManager.hpp"

#include <iostream>
#include <sstream>

#include <SDL.h>

#include "data.hpp"

JoystickManager::JoystickManager(SDL_Renderer* renderer)
	: numJoysticks(0)
	, renderer(renderer)
{
	auto rw = SDL_RWFromConstMem(controllerImageData, controllerImageLength);
	auto img = SDL_LoadBMP_RW(rw, 1);

	if (img == nullptr)
	{
		 std::cout << "failed to load image from memory: " << SDL_GetError() << std::endl;
		 exit(1);
	}
	controllerTexture = SDL_CreateTextureFromSurface(renderer, img);

	rw = SDL_RWFromConstMem(controllerImageLightData, controllerImageLightLength);
	img = SDL_LoadBMP_RW(rw, 1);

	if (img == nullptr)
	{
		 std::cout << "failed to load image from memory: " << SDL_GetError() << std::endl;
		 exit(1);
	}
	controllerTextureLight = SDL_CreateTextureFromSurface(renderer, img);

	rw = SDL_RWFromConstMem(bannerImageData, bannerImageLength);
	img = SDL_LoadBMP_RW(rw, 1);

	if (img == nullptr)
	{
		 std::cout << "failed to load image from memory: " << SDL_GetError() << std::endl;
		 exit(1);
	}
	bannerTexture = SDL_CreateTextureFromSurface(renderer, img);
}

void JoystickManager::updateDeviceList()
{
//	std::cout << "updating device list" << std::endl;
	
	unsigned int newNumJoystics = SDL_NumJoysticks();
	if (newNumJoystics != numJoysticks)
	{
		std::cout << "Joystick count is now at: " << newNumJoystics << std::endl;
	}
	numJoysticks = newNumJoystics;
	deviceMap.clear();

	for (unsigned int i = 0; i < numJoysticks && i < MAX_DEVISES; i++)
	{
		auto stick = SDL_JoystickOpen(i);

		if (stick) {
//			SDL_JoystickGUID guid = SDL_JoystickGetDeviceGUID(i);
//			auto pszGUID = new char[128];
//			SDL_JoystickGetGUIDString(guid, pszGUID, 128);

//			std::cout << "Opened Joystick " << i << std::endl;
//			std::cout << "Name: " << SDL_JoystickNameForIndex(i) << std::endl;
//			std::cout << "Devise GUID string: " << pszGUID << std::endl;
//			std::cout << "Number of Axes: " << SDL_JoystickNumAxes(stick) << std::endl;
//			std::cout << "Number of Buttons: " << SDL_JoystickNumButtons(stick) << std::endl;
//			std::cout << "Number of Balls: " << SDL_JoystickNumBalls(stick) << std::endl;

			devices[i].index = SDL_JoystickInstanceID(stick);
			deviceMap.insert(std::pair<unsigned int, unsigned int>(devices[i].index, i));

		} else {
			std::cout << "failed to open joystick " << i << std::endl;
		}
	}

//	for (auto entry : deviceMap)
//	{
//		std::cout << entry.first << " - " << entry.second << std::endl;
//	}

	// draw icons on the screen
	SDL_RenderClear(renderer);

	SDL_Rect rect;
	rect.w = 304;
	rect.h = 54;
	rect.x = 15;
	rect.y = 0;

	SDL_RenderCopy(renderer, bannerTexture, nullptr, &rect);

	for (unsigned int i = 0; i < MAX_DEVISES; i++)
	{
		SDL_Rect rect;
		rect.w = 72;
		rect.h = 72;
		rect.x = 78 * (i % 4) + 15;
		rect.y = 78 * (i / 4) + 54;

		SDL_RenderCopy(renderer, controllerTextureLight, nullptr, &rect);
	}

	for (unsigned int i = 0; i < numJoysticks; i++)
	{
//		auto index = devices[i].index;
		auto index = i;

		SDL_Rect rect;
		rect.w = 72;
		rect.h = 72;
		rect.x = 78 * (index % 4) + 15;
		rect.y = 78 * (index / 4) + 54;

		SDL_RenderCopy(renderer, controllerTexture, nullptr, &rect);
	}
	SDL_RenderPresent(renderer);
}

void JoystickManager::handleEvent(const SDL_Event &e, TCPServer* server) {
	auto time = (float)SDL_GetTicks() / 1000.0f;

	if (e.type == SDL_JOYAXISMOTION)
	{
		{
			auto number = deviceMap[e.jdevice.which];
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
		auto number = deviceMap[e.jdevice.which];
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

unsigned int JoystickManager::getNumJoystics()
{
	return numJoysticks;
}
