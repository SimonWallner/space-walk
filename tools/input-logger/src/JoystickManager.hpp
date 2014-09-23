#include <SDL.h>
#include "TCPServer.hpp"

#define MAX_AXIS_CNT 32
#define MAX_DEVISES 16

class JoystickManager {
public:
	JoystickManager(SDL_Renderer *renderer);
	void updateDeviceList();
	void pollDevices();
	void handleEvent(const SDL_Event &, TCPServer*);

private:
	struct Device {
//		unsigned int numAxis;
//		unsigned int numButtons;
		float axisBuffer[MAX_AXIS_CNT];
		int buttonBuffer[MAX_AXIS_CNT];

		Device() {
//			numAxis = 0;
//			numButtons = 0;
			for (auto i = 0; i < MAX_AXIS_CNT; i++) {
				axisBuffer[i] = 0;
				buttonBuffer[i] = 0;
			}
		}
	};

	Device devices[MAX_DEVISES];

	SDL_Texture* texture;
	SDL_Renderer* renderer;
};
