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
			float maxSize = Mathf.Max(captureCameraFrame.width, captureCameraFrame.height);

			float cameraY = camera.transform.position.y;
			camera.transform.position = new Vector3(captureCameraFrame.center.x, cameraY, captureCameraFrame.center.y);
			camera.orthographicSize = maxSize / 2.0f;

			camera.Render();
			
			
			texture.ReadPixels(new Rect(0, 0, resWidth, resHeight), 0, 0);
			texture.Apply();
			
			RenderTexture.active = null;
			
			byte[] bytes = texture.EncodeToPNG();
		
			
			Telemetry.mapTile(bytes, new Rect(captureCameraFrame.center.x - (maxSize / 2.0f),
			                  captureCameraFrame.center.y - (maxSize / 2.0f),
			                  maxSize, maxSize));

			captureNextFrame = false;
		}
	}


	public void captureMapTile(Rect rect) {
		captureNextFrame = true;
		captureCameraFrame = rect;
	}

}
