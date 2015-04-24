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
		var state = (State)ar.AsyncState;
		int bytesRead = state.listener.EndReceive(ar);

		if (bytesRead > 0) {
			Debug.Log ("message got: '" + System.Text.Encoding.ASCII.GetString (state.buffer) + "'");

			var message = System.Text.Encoding.ASCII.GetString (state.buffer);

			try {
				var dict = (Dictionary<string, object>)MiniJSON.Json.Deserialize (message);
				if (dict != null) {
					string type = (string)dict ["type"];
					Debug.Log ("unknown messag type: " + type + " (" + message + ")");
				}
			} catch (KeyNotFoundException e) {
				Debug.Log ("failed to parse json string (Key not found): " + message + " (" + e.Message + ")");
			} catch (InvalidCastException e) {
				Debug.Log ("failed to parse json string (invalid cast): " + message + " (" + e.Message + ")");
			}
		}

		state.handler.BeginReceive(state.buffer, 0, State.BUFFER_SIZE, 0,
				new AsyncCallback(ReceiveCallback), state);
	}

	public void Broadcast(String data) {
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
			Socket handler = (Socket)ar.AsyncState;
			handler.EndSend(ar);
		} catch (Exception e) {
			Debug.Log(e.ToString());
		}
	}
}
