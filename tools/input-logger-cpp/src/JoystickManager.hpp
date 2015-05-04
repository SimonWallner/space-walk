#include <GLFW/glfw3.h>
#include <map>
#include "TCPServer.hpp"

#define MAX_AXIS_CNT 32
#define MAX_DEVISES 16

class JoystickManager {
public:
	JoystickManager(GLFWwindow* window);
	void updateDeviceList();
	void pollDevices();

	unsigned int getNumJoystics();

private:
	struct Device {
		float axisBuffer[MAX_AXIS_CNT];
		int buttonBuffer[MAX_AXIS_CNT];
		unsigned int index; // index that is reported by e.which
		unsigned int number; // number as it is enumerated during search. max(number) == numJoystics;

		Device() {
			for (auto i = 0; i < MAX_AXIS_CNT; i++) {
				axisBuffer[i] = 0;
				buttonBuffer[i] = 0;
			}

			index = 0;
			number = 0;
		}
	};
    
    GLFWwindow* window;
    unsigned int joystickMaxCount;

	Device devices[MAX_DEVISES];
	unsigned int numJoysticks;

	// maps the device index to indices in the devices array;
	std::map<unsigned int, unsigned int> deviceMap;
};
