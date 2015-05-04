#include "JoystickManager.hpp"

#include <iostream>
#include <sstream>

#include "data.hpp"

JoystickManager::JoystickManager(GLFWwindow* window)
	: numJoysticks(0)
	, window(window)
{
    joystickMaxCount = GLFW_JOYSTICK_LAST - GLFW_JOYSTICK_1 + 1;
}

void JoystickManager::updateDeviceList()
{
    for (var i = GLFW_JOYSTICK_1; i <= GLFW_JOYSTICK_LAST; i++)
    {
		
	}


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
