using UnityEngine;
using System.Collections;

public class spin : MonoBehaviour {

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		gameObject.transform.rotation *= Quaternion.Euler (0, 90.0f * Time.deltaTime, 0);
	}
}
