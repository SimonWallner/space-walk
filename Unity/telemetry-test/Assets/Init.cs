using UnityEngine;
using System.Collections;

public class Init : MonoBehaviour {

	public Camera mainCamera;

	void Awake () {
		Debug.Log("init....");
		Telemetry.trace("hello!");
	}
}
