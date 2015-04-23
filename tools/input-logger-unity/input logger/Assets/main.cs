using UnityEngine;
using System.Collections;

public class main : MonoBehaviour {

	int joystickCount = 4;
	int buttonCount = 32;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
		for (var i = 1; i <= joystickCount; i++) {
			for (var j = 0; j < buttonCount; j++) {
				Input.GetButton("joystick-" + i + "-button-" + j);
			}
		}
	}
}
