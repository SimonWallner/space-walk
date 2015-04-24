using UnityEngine;
using System.Collections;

public class main : MonoBehaviour {

	int joystickCount = 4;
	int buttonCount = 20;
	int axisCount = 20;
	
	// buffer values if there are no changes to save bandwidth and not make the bridge crash.
	bool[,] buttonBuffer;
	float[,] axisBuffer;

	public GameObject[] tiles;
	public GameObject[] greyTiles;
	public GameObject controlFlash;
	public GameObject networkFlash;

	bool controlsActive = false;
	bool networkAktive = false;

	// Use this for initialization
	void Start () {
		Telemetry.info ("input logger starting up...");
		print ("asdfasdfasdfasdfsadf");

		Application.runInBackground = true;

		buttonBuffer = new bool[joystickCount, buttonCount];
		axisBuffer = new float[joystickCount, axisCount];

		for (var i = 0; i < joystickCount; i++) {
			for (var j = 0; j < buttonCount; j++) {
				buttonBuffer [i, j] = false;
			}

			for (var j = 0; j < axisCount; j++) {
				axisBuffer [i, j] = 0;
			}
		}

		Debug.Log ("available controllers: ");
		foreach (var name in Input.GetJoystickNames()) {
			Debug.Log(name);
		}
	
	}
	
	// Update is called once per frame
	void FixedUpdate () {

		var controlsFlipState = !controlsActive;

		var names = Input.GetJoystickNames ();

		for (var i = 0; i < joystickCount; i++) {

			if (i < names.Length) {
				tiles[i].SetActive(true);
				greyTiles[i].SetActive(false);
			} else {
				tiles[i].SetActive(false);
				greyTiles[i].SetActive(true);
			}
		}

		for (var i = 0; i < Mathf.Min(joystickCount, names.Length); i++)
		{
			for (var j = 0; j < buttonCount; j++)
			{
				var id = "joystick-" + (i+1) + "-button-" + j;
				var value = Input.GetButton(id);

				if (buttonBuffer[i, j] != value) {
					buttonBuffer[i, j] = value;
					controlsActive = controlsFlipState;
					Telemetry.digital("button-" + j, j, i, value);
				}
			}

			for (var j = 0; j < axisCount; j++) {
				var id = "joystick-" + (i+1) + "-axis-" + j;
				var value = Input.GetAxisRaw(id);

				if (axisBuffer[i, j] != value) {
					axisBuffer[i, j] = value;
					controlsActive = controlsFlipState;
					Telemetry.analog("axis-" + j, j, i, value);
				}
			}
		}

		controlFlash.SetActive (controlsActive);
	}
}
