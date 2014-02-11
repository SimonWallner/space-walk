using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System;

public class SocketServer {

	private class State {
		public SocketServer instance = null;
		public Socket listener = null;
		public Socket handler = null;
		public const int BUFFER_SIZE = 1024;
		public byte[] buffer = new byte[BUFFER_SIZE];
	}

	public SocketServer(int port)
	{
		this.port = port;
	}

	private Socket listener;
	private int port;

	private List<Socket> openSockets = new List<Socket>();

	// Use this for initialization
	public void Start () {
		Debug.Log("trying to start the server");
		var ipAddress = Dns.GetHostEntry("localhost").AddressList[0];
		IPEndPoint localEndPoint = new IPEndPoint(ipAddress, this.port);

		listener = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);

		try
		{
			listener.Bind(localEndPoint);
			listener.Listen(10);

			var state = new State();
			state.instance = this;
			state.listener = listener;

			listener.BeginAccept(new AsyncCallback(AcceptCallback), state);

			Debug.Log("socket server up and running");

		} catch (System.Exception e) {
			Debug.Log(e.ToString());
		}

	}
	
	public static void AcceptCallback(IAsyncResult ar) {
		Debug.Log("accept callback");

		var state = (State)ar.AsyncState;
		state.handler = state.listener.EndAccept(ar);
		state.listener.BeginAccept(new AsyncCallback(AcceptCallback), state);

		state.instance.openSockets.Add(state.handler);

		state.handler.BeginReceive(state.buffer, 0, State.BUFFER_SIZE, 0,
				new AsyncCallback(ReceiveCallback), state);
	}

	public static void ReceiveCallback(IAsyncResult ar) {
//		Debug.Log("receive callback");

		var state = (State)ar.AsyncState;
		int bytesRead = state.listener.EndReceive(ar);

		if (bytesRead > 0) {
			Debug.Log(System.Text.Encoding.ASCII.GetString(state.buffer));

			var message = System.Text.Encoding.ASCII.GetString(state.buffer);

			try {
				var dict = (Dictionary<string, object>)MiniJSON.Json.Deserialize(message);
				
				if (dict != null) {

					string type = (string)dict["type"];

					if (type == "mapTileRequest") {
						var payload = (Dictionary<string, object>)dict["payload"];
		
						float x = (float)payload["x"];
//						float y = float.Parse((string)payload["y"]);
//						float width = float.Parse((string)payload["width"]);
//						float height = float.Parse((string)payload["height"]);
//						Telemetry.capture(new Rect(x, y, width, height));
					} else {
						Debug.Log("unknown messag type: " + type + " (" + message + ")");
					}
				}
			}
			catch (KeyNotFoundException e) {
				Debug.Log("failed to parse json string (Key not found): " + message + " (" + e.Message + ")");
			}
			catch (InvalidCastException e) {
				Debug.Log("failed to parse json string (invalid cast): " + message + " (" + e.Message + ")");
			}
		}

		state.handler.BeginReceive(state.buffer, 0, State.BUFFER_SIZE, 0,
				new AsyncCallback(ReceiveCallback), state);
	}
	
//	public static void ReadCallback(IAsyncResult ar) {
//		String content = String.Empty;
//		
//		// Retrieve the state object and the handler socket
//		// from the asynchronous state object.
//
//		// Read data from the client socket. 
//		int bytesRead = handler.EndReceive(ar);
//		
//		if (bytesRead > 0) {
//			// There  might be more data, so store the data received so far.
//			state.sb.Append(Encoding.ASCII.GetString(
//				state.buffer,0,bytesRead));
//			
//			// Check for end-of-file tag. If it is not there, read 
//			// more data.
//			content = state.sb.ToString();
//			if (content.IndexOf("<EOF>") > -1) {
//				// All the data has been read from the 
//				// client. Display it on the console.
//				Console.WriteLine("Read {0} bytes from socket. \n Data : {1}",
//				                  content.Length, content );
//				// Echo the data back to the client.
//				Send(handler, content);
//			} else {
//				// Not all data received. Get more.
//				handler.BeginReceive(state.buffer, 0, StateObject.BufferSize, 0,
//				                     new AsyncCallback(ReadCallback), state);
//			}
//		}
//	}
//	
	public void Broadcast(String data) {
//		byte[] byteData = Util.GetBytes(data);
		byte[] byteData = System.Text.Encoding.ASCII.GetBytes(data + "\n");
		
		foreach (Socket handler in openSockets)
		{
			if (handler.Connected)
			{
				handler.BeginSend(byteData, 0, byteData.Length, 0,
				                  new AsyncCallback(SendCallback), handler);

			}
		}

	}
	
	private static void SendCallback(IAsyncResult ar) {
		try {
//			Debug.Log("send callback");
			Socket handler = (Socket)ar.AsyncState;
			
			int bytesSent = handler.EndSend(ar);
//			Debug.Log("Sent {0} bytes to client." + bytesSent);
				
		} catch (Exception e) {
			Debug.Log(e.ToString());
		}
	}

}
