
class JoystickManager {
public:
	void updateDeviceList();
	void pollDevices();

private:
	struct Device {
		unsigned int GUID;
		unsigned int controllerNumber
	};
}