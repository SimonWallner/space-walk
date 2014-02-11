using UnityEngine;
using System.Collections;

public class Constants {

	public static bool isMac;
	public static bool enableMouse;

	// player prefs strings
	public static class PlayerPrefs {
		public static class Developer {
			public static string EnableMouse = "developer/enableMouse";
		}
	}

	public static void Init() {
		isMac = (Application.platform == RuntimePlatform.OSXPlayer) || (Application.platform == RuntimePlatform.OSXEditor) || (Application.platform == RuntimePlatform.OSXWebPlayer);

		enableMouse = System.Convert.ToBoolean(UnityEngine.PlayerPrefs.GetInt(PlayerPrefs.Developer.EnableMouse));
		Debug.Log("enable mouse: " + enableMouse);
	}

	public static void Dump() {
		Debug.Log("isMac: " + isMac);
	}
}
