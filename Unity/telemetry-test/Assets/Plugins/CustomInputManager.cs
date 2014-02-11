using UnityEngine;
using System.Collections;
using System;

/**
 * controller mappings
 * 
 * --- Axis of Evil---
 * XB360/Mac 3rd party driver
 * 1: LS right
 * 2: LS down
 * 3: RS: right
 * 4: RS down
 * 5: LT pulled
 * 6: RT pulled
 * 
 * PS3/Mac
 * 1: LS right
 * 2: LS down
 * 3: RS: right
 * 4: RS down
 * 
 * --- buttons ---
 * XB360/MAc 3rd party driver
 * 1: ???
 * 2: ???
 * 3: ???
 * 4: ???
 * 5: D-up
 * 6: D-down
 * 7: D-left
 * 8: D-right
 * 9: start
 * 10: back
 * 11: LS
 * 12: RS
 * 13: LB
 * 14: RB
 * 15: shiny XBox button
 * 16: A
 * 17: B
 * 18: X
 * 19: Y
 * 
 * PS3/Mac
 * 0: select
 * 1: LS
 * 2: RS
 * 3: start
 * 4: D-up
 * 5: D-right
 * 6: D-down
 * 7: D-left
 * 8: LT
 * 9: RT
 * 10: LB
 * 11: RB
 * 12: triangle
 * 13: circle
 * 14: cross
 * 15: square
 * 
 * 
 */

public static class CustomInputManager {

	public enum Token {
		Forward,
		Right,
		Jump,
		LookRight,
		LookUp
	}

	public enum Controller {
		Unknown,
		XBox,
		PS3
	}

	public static float deadZone = 0.2f;

	/**
	 * The game pad returs 0 for the trigger as long as it is not
	 * pressed. It should be -1 instead;
	 */
	private static float rightTriggerFix1 = 0;
	private static bool rightTriggerFixPulledOnce1 = false;
	private static float rightTriggerFix2 = 0;
	private static bool rightTriggerFixPulledOnce2 = false;

	private static int controllerCount = 0;
	private static Controller[] controllers = {Controller.Unknown, Controller.Unknown};

	private static float RetrieveAxisDataDeadZoned(int playerID, int axis) {
		return MathUtils.DeadZone(deadZone, RetrieveAxisDataRaw(playerID, axis));
	}

	private static float RetrieveAxisDataRaw(int playerID, int axis) {
		var identifier = "Joystick_" + playerID + "_axis_" + axis;
		return Input.GetAxis(identifier);
	}

	private static float RetrieveButtonData(int playerID, int button) {
		var identifier = "Joystick_" + playerID + "_button_" + button;
		return System.Convert.ToSingle(Input.GetButton(identifier));
	}

	private static void nameControllers() {
		var names = Input.GetJoystickNames();
		for (var i = 0; i < names.Length; i++) {
			switch (names[i]) {
			case "Sony PLAYSTATION(R)3 Controller":
				controllers[i] = Controller.PS3;
				break;
			default:
				controllers[i] = Controller.Unknown;
				break;
			}
		}
	}

	public static float GetAxis(Token token, int playerID) {

		if (Input.GetJoystickNames().Length != controllerCount) {
			nameControllers();
			controllerCount = Input.GetJoystickNames().Length;
		}

//		for (var i = 0; i < Input.GetJoystickNames().Length; i++) {
//			Debug.Log("Controller i: " + Input.GetJoystickNames()[i]);
//		}

		float keys = 0;
		switch(token) {

		case Token.Right:
			keys = Convert.ToSingle(Input.GetKey("d")) - Convert.ToSingle(Input.GetKey("a"));
			return RetrieveAxisDataDeadZoned(playerID, 1) + keys;
		
		case Token.Forward:
			keys = Convert.ToSingle(Input.GetKey("w")) - Convert.ToSingle(Input.GetKey("s"));
			return -RetrieveAxisDataDeadZoned(playerID, 2) + keys;

		case Token.LookRight:
			return RetrieveAxisDataDeadZoned(playerID, 3);
			
		case Token.LookUp:
			return -RetrieveAxisDataDeadZoned(playerID, 4);

		case Token.Jump:
			float jump = Convert.ToSingle(Input.GetKey(KeyCode.Space));
			if (controllers[playerID - 1] == Controller.PS3) {
				return RetrieveButtonData(playerID, 14) + jump;
			} else {
				return RetrieveButtonData(playerID, 16) + jump;
			}

		default:
			return 0.0f;
		}
	}

	public static void DebugDumpAxis() {
		for (var joystick = 1; joystick <= 2; joystick++) {
			for (var axis = 1; axis <= 10; axis++) {
				var identifier = "Joystick_" + joystick + "_axis_" + axis;
				var value = Input.GetAxis(identifier);
				Debug.Log(identifier + ", value: " + value);
			}
		}
	}

	public static void DebugDumpButtons() {
		for (var joystick = 1; joystick <= 1; joystick++) {
			for (var button = 0; button <= 19; button++) {
				var identifier = "Joystick_" + joystick + "_button_" + button;
				var value = Input.GetButton(identifier);
				Debug.Log(identifier + ", value: " + value);
			}
		}
	}
}
