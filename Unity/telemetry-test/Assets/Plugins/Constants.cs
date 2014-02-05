using UnityEngine;
using System.Collections;

public class Constants {

	public static bool isMac;
	public static bool singlePlayerMode = false;
	public static PlayerPrefab Player1Prefab;
	public static PlayerPrefab Player2Prefab;
	public static bool TurboCheat = false;
	
	public enum PlayerPrefab {
		Motorbike = 0,
		Plane = 1,
		Fish = 2,
	}

	public static string[] PlayerPrefabNames = {
		"PlayerMotorbike_Prefab",
		"PlayerPlane_Prefab",
		"PlayerFish_Prefab",
	};

	// player prefs strings
	public static class PlayerPrefs {
		public static class Developer {
			public static string SinglePlayerMode = "developer/singlePlayerMode";
			public static string Player1PrefabName = "developer/player1PrefabName";
			public static string Player2PrefabName = "developer/player2PrefabName";
			public static string TurboCheat = "developer/turboCheat";
		}
	}

	public static void Init() {
		isMac = (Application.platform == RuntimePlatform.OSXPlayer) || (Application.platform == RuntimePlatform.OSXEditor) || (Application.platform == RuntimePlatform.OSXWebPlayer);

		singlePlayerMode = System.Convert.ToBoolean(UnityEngine.PlayerPrefs.GetInt(PlayerPrefs.Developer.SinglePlayerMode));

		Player1Prefab = (PlayerPrefab)UnityEngine.PlayerPrefs.GetInt(PlayerPrefs.Developer.Player1PrefabName);
		Player2Prefab = (PlayerPrefab)UnityEngine.PlayerPrefs.GetInt(PlayerPrefs.Developer.Player2PrefabName);

		TurboCheat = System.Convert.ToBoolean(UnityEngine.PlayerPrefs.GetInt(PlayerPrefs.Developer.TurboCheat));
	}

	public static void Dump() {
		Debug.Log("isMac: " + isMac);
	}
}
