using UnityEngine;
using System.Collections;


public class PlayerDebug : MonoBehaviour {

	// Update is called once per frame
	void Update () {
//		Telemetry.data("forward", CustomInputManager.GetAxis(CustomInputManager.Token.Forward, 1));
//		Telemetry.data("right", CustomInputManager.GetAxis(CustomInputManager.Token.Right, 1));
//		Telemetry.data("jump", CustomInputManager.GetAxis(CustomInputManager.Token.Jump, 1));
		Telemetry.position(transform.position);
	}
}
