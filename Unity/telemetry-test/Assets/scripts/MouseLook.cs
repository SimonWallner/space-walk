using UnityEngine;
using System.Collections;

/// MouseLook rotates the transform based on the mouse delta.
/// Minimum and Maximum values can be used to constrain the possible rotation

/// To make an FPS style character:
/// - Create a capsule.
/// - Add the MouseLook script to the capsule.
///   -> Set the mouse look to use LookX. (You want to only turn character but not tilt it)
/// - Add FPSInputController script to the capsule
///   -> A CharacterMotor and a CharacterController component will be automatically added.

/// - Create a camera. Make the camera a child of the capsule. Reset it's transform.
/// - Add a MouseLook script to the camera.
///   -> Set the mouse look to use LookY. (You want the camera to tilt up and down like a head. The character already turns.)
[AddComponentMenu("Camera-Control/Mouse Look")]
public class MouseLook : MonoBehaviour {

	public float MouseSensitivity = 0.01f;
	public float GamepadSensitivity = 200F;

	public float minimumX = -360F;
	public float maximumX = 360F;

	public float minimumY = -60F;
	public float maximumY = 60F;

	private float rotationX = 0.0f;
	private float rotationY = 0.0f;


	void Update ()
	{
		rotationX += CustomInputManager.GetAxis(CustomInputManager.Token.LookRight, 1) * Time.deltaTime * GamepadSensitivity;
		if (Constants.enableMouse) {
			rotationX += Input.GetAxis("Mouse_X") * MouseSensitivity;
		}

		if (Constants.enableMouse) {
			rotationY += Input.GetAxis("Mouse_Y") * MouseSensitivity;
		}
		rotationY += CustomInputManager.GetAxis(CustomInputManager.Token.LookUp, 1) * Time.deltaTime * GamepadSensitivity;
		rotationY = Mathf.Clamp (rotationY, minimumY, maximumY);
		
		transform.localEulerAngles = new Vector3(-rotationY, rotationX, 0);
	}
	
	void Start ()
	{
		// Make the rigid body not change rotation
		if (rigidbody)
			rigidbody.freezeRotation = true;
	}
}	