#include "JoystickManager.hpp"

void JoystickManager::updateDeviceList() {
	std::cout << "updating device list" << std::endl;
	
	unsigned int numJoysticks = SDL_NumJoysticks();
	std::cout << numJoysticks << " joystic(s) found." << std::endl;
	
	if (sticks) {
		delete[] sticks;
		delete[] numAxes;
		delete[] numButtons;
	}

	sticks = new SDL_Joystick*[numJoysticks];
	numAxes = new unsigned int[numJoysticks];
	numButtons = new unsigned int[numJoysticks];

	for (unsigned int i = 0; i < numJoysticks; i++)
	{
		numAxes[i] = 0;
		numButtons[i] = 0;

		sticks[i] = SDL_JoystickOpen(i);

		if (sticks[i]) {
			printf("Opened Joystick 0\n");
			printf("Name: %s\n", SDL_JoystickNameForIndex(i));
			// printf("Devise GUID: %s\n", SDL_JoystickGetGUIDString(i));
			printf("Number of Axes: %d\n", SDL_JoystickNumAxes(sticks[i]));
			printf("Number of Buttons: %d\n", SDL_JoystickNumButtons(sticks[i]));
			printf("Number of Balls: %d\n", SDL_JoystickNumBalls(sticks[i]));
			
			numAxes[i] = SDL_JoystickNumAxes(sticks[i]);
			numButtons[i] = SDL_JoystickNumButtons(sticks[i]);
		} else {
			printf("Couldn't open Joystick 0\n");
		}
	}
	
	if (axesBuffer) {
		delete[] axesBuffer;
		delete[] buttonsBuffer;
	}
	axesBuffer = new Sample*[numJoysticks];
	buttonsBuffer = new Sample*[numJoysticks];

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
}
}










SDL_Joystick** sticks = nullptr;
unsigned int* numAxes = nullptr;
unsigned int* numButtons = nullptr;

bool globalDirtyFlag = false;
int activeJoystick = 0; // starting with 0

Sample** axesBuffer = nullptr;
Sample** buttonsBuffer = nullptr;
