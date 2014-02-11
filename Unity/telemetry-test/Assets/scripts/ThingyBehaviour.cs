using UnityEngine;
using System.Collections;

public class ThingyBehaviour : MonoBehaviour {
	
	void OnTriggerEnter(Collider other) {
		particleSystem.Play();
	}
}
