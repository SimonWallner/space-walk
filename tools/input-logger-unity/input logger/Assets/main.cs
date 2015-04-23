using UnityEngine;
using System.Collections;

public class main : MonoBehaviour {

	int joystickCount = 4;
	int buttonCount = 20;
	int axisCount = 20;

	// Use this for initialization
	void Start () {

		Application.runInBackground = true;

		Debug.Log ("available controllers: ");
		foreach (var name in Input.GetJoystickNames()) {
			Debug.Log(name);
		}
	
	}
	
	// Update is called once per frame
	void Update () {
		for (var i = 1; i <= joystickCount; i++) {
			for (var j = 0; j < buttonCount; j++) {
				var id = "joystick-" + i + "-button-" + j;
				if (Input.GetButton(id)) {
					Debug.Log("button pressed: " + id);
				}
			}

			for (var j = 0; j < axisCount; j++) {
				var id = "joystick-" + i + "-axis-" + j;
				if (Input.GetAxisRaw(id) > 0.5f) {
					Debug.Log("axis moved: " + id);
				}
			}
		}
	}
}
