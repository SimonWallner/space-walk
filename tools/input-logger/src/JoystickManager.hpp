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
		float axisBuffer[MAX_AXIS_CNT];
		int buttonBuffer[MAX_AXIS_CNT];
		unsigned int index;

		Device() {
			for (auto i = 0; i < MAX_AXIS_CNT; i++) {
				axisBuffer[i] = 0;
				buttonBuffer[i] = 0;
			}

			index = 0;
		}
	};

	Device devices[MAX_DEVISES];
	unsigned int numJoysticks;

	SDL_Texture* controllerTexture;
	SDL_Texture* controllerTextureLight;
	SDL_Texture* bannerTexture;
	SDL_Renderer* renderer;
};
