using UnityEditor;
using UnityEngine;
using System.Collections;

public class DeveloperPreferences : EditorWindow {

	[MenuItem("Window/Devloper Prefs")]
	public static void ShowWindow()
	{
		//Show existing window instance. If one doesn't exist, make one.
		EditorWindow.GetWindow(typeof(DeveloperPreferences));
	}
	
	void OnGUI()
	{
		GUILayout.Label ("General Settings", EditorStyles.boldLabel);

		// enable mouse
		var enableMouse = System.Convert.ToBoolean(PlayerPrefs.GetInt(Constants.PlayerPrefs.Developer.EnableMouse));
		enableMouse = EditorGUILayout.Toggle("Enable Mouse", enableMouse);
		PlayerPrefs.SetInt(Constants.PlayerPrefs.Developer.EnableMouse, System.Convert.ToInt32(enableMouse));
	}
}
