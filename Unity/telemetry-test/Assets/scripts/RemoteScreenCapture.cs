using UnityEngine;
using System.Collections;

public class RemoteScreenCapture : MonoBehaviour {

	public Camera camera;

	private int resWidth = 256;
	private int resHeight = 256;

	private RenderTexture rt;
	private Texture2D texture;

	bool captureNextFrame = false;
	Rect captureCameraFrame;

	public void Start() {
		Telemetry.registerCamera(this);

		rt = new RenderTexture(resWidth, resHeight, 24);
		texture = new Texture2D(resWidth, resHeight, TextureFormat.RGB24, false);

		camera.targetTexture = rt;
		camera.aspect = 1.0f;
	}

	public void OnPostRender() {
		if (captureNextFrame) {
			Debug.Log("cheeeese!");

			RenderTexture.active = rt;

			// setup camera...
			// todo
			camera.Render();
			
			
			texture.ReadPixels(new Rect(0, 0, resWidth, resHeight), 0, 0);
			texture.Apply();
			
			RenderTexture.active = null;
			
			byte[] bytes = texture.EncodeToPNG();
			
			//		string filename = "textureTest.png";
			//		System.IO.File.WriteAllBytes(filename, bytes);
			//		Debug.Log(string.Format("Took screenshot to: {0}", filename));
			
			Telemetry.mapTile(bytes);

			captureNextFrame = false;
		}
	}


	public void capture(Rect rect) {
		captureNextFrame = true;
		captureCameraFrame = rect;
	}

}
