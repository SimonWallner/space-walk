using UnityEngine;
using System.Collections;

public class RemoteScreenCapture : MonoBehaviour {

	public Camera camera;

	private int resWidth = 256;
	private int resHeight = 256;

	private RenderTexture rt;
	private Texture2D texture;

	bool captureNow = false;

	public void Start() {
		Telemetry.registerCamera(this);

		rt = new RenderTexture(resWidth, resHeight, 24);
		texture = new Texture2D(resWidth, resHeight, TextureFormat.RGB24, false);

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
		RenderTexture.active = rt;

		camera.Render();


		texture.ReadPixels(new Rect(0, 0, resWidth, resHeight), 0, 0);
		texture.Apply();

		RenderTexture.active = null;

		byte[] bytes = texture.EncodeToPNG();

		string filename = "textureTest.png";
		System.IO.File.WriteAllBytes(filename, bytes);
		Debug.Log(string.Format("Took screenshot to: {0}", filename));

		return bytes;
	}

}
