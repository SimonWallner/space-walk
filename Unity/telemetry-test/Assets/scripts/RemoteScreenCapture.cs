using UnityEngine;
using System.Collections;

public class RemoteScreenCapture : MonoBehaviour {

	public Camera camera;

	private int resWidth = 1024;
	private int resHeight = 1024;

	private RenderTexture rt;

	bool captureNow = false;

	public void Start() {
		Telemetry.registerCamera(this);

		rt = new RenderTexture(resWidth, resHeight, 24);
		camera.targetTexture = rt;
		camera.aspect = 1.0f;
	}

	public void OnPostRender() {
		if (captureNow) {
			Debug.Log("cheeeese!");
			Telemetry.captureImage();

			captureNow = false;
		}
	}

	public void Update() {
		if (Input.GetKeyDown(".")) {
			captureNow = true;
		}
	}

	public byte[] capture() {
		camera.Render();
		RenderTexture.active = rt;

		Texture2D texture = new Texture2D(resWidth, resHeight, TextureFormat.RGB24, false);
		texture.ReadPixels(new Rect(0, 0, resWidth, resHeight), 0, 0);
		texture.Apply();

		RenderTexture.active = null;

		byte[] bytes = texture.EncodeToPNG();

		return bytes;
	}

}
