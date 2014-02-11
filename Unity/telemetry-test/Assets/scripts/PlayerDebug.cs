using UnityEngine;
using System.Collections;
using System.Collections.Generic;


public class PlayerDebug : MonoBehaviour {

	// Update is called once per frame
	void Update () {
//		Telemetry.data("forward", CustomInputManager.GetAxis(CustomInputManager.Token.Forward, 1));
//		Telemetry.data("right", CustomInputManager.GetAxis(CustomInputManager.Token.Right, 1));
//		Telemetry.data("jump", CustomInputManager.GetAxis(CustomInputManager.Token.Jump, 1));
		Telemetry.position(transform.position);

		Telemetry.data("look right", CustomInputManager.GetAxis(CustomInputManager.Token.LookRight, 1));
		Telemetry.data("look up", CustomInputManager.GetAxis(CustomInputManager.Token.LookUp, 1));

		Telemetry.data("move right", CustomInputManager.GetAxis(CustomInputManager.Token.Forward, 1));
		Telemetry.data("move up", CustomInputManager.GetAxis(CustomInputManager.Token.Right, 1));
//
//		string message = "xxx{\"type\": \"foobar\"}";
//
//		var dict = MiniJSON.Json.Deserialize(message) as Dictionary<string, object>;
//
//		Debug.Log("dict: " + dict);
//		
//		Debug.Log(dict["type"]);
	}
}
