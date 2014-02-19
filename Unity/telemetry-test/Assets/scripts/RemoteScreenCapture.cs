using UnityEngine;
using System.Collections;

public class RemoteScreenCapture : MonoBehaviour {

	public Camera camera;

	private int resWidth = 256;
	private int resHeight = 256;

	private RenderTexture rt;
	private Texture2D texture;

	bool captureNextFrame = false;
	bool cameraSet = false;
	Rect captureCameraFrame;

	public void Start() {
		Telemetry.registerCamera(this);

		rt = new RenderTexture(resWidth, resHeight, 24);
		texture = new Texture2D(resWidth, resHeight, TextureFormat.RGB24, false);

		camera.targetTexture = rt;
		camera.aspect = 1.0f;
	}

	public void OnPostRender() {
		if (captureNextFrame && cameraSet) {
			Debug.Log("cheeeese!");
			Debug.Log("rendering map tile. min X: " + captureCameraFrame.xMin +
			          ", max X: " + captureCameraFrame.xMax +
			          ", min Y: " + captureCameraFrame.yMin +
			          ", max Y: " + captureCameraFrame.yMax +
			          ", width: " + captureCameraFrame.width +
			          ", height: " + captureCameraFrame.height);

			RenderTexture.active = rt;

			camera.Render();
			
			
			texture.ReadPixels(new Rect(0, 0, resWidth, resHeight), 0, 0);
			texture.Apply();
			
			RenderTexture.active = null;
			
			byte[] bytes = texture.EncodeToPNG();
		
			
			Telemetry.mapTile(bytes, captureCameraFrame);

			captureNextFrame = false;
		}
	}

	void Update() {
		float cameraY = camera.transform.position.y;
		camera.transform.position = new Vector3(captureCameraFrame.center.x, cameraY, captureCameraFrame.center.y);
		camera.orthographicSize = captureCameraFrame.width / 2.0f;

		cameraSet = true;
	}


	public void captureMapTile(Rect rect) {
		captureNextFrame = true;
		cameraSet = false;
		
		// setup camera...
		float maxSize = Mathf.Max(rect.width, rect.height);
		captureCameraFrame = new Rect(rect.center.x - (maxSize / 2.0f),
		                              rect.center.y - (maxSize / 2.0f),
		                              maxSize, maxSize);

	}
}
