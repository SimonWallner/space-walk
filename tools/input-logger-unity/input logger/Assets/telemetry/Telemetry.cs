using UnityEngine;
using System.Collections;


public static class Telemetry {

	private static SocketServer serverHandle;

	public static SocketServer Server
	{
		get
		{
			if (serverHandle == null)
			{
				serverHandle = new SocketServer(60601);
				serverHandle.Start();
			}
			return serverHandle;
		}
	}

	public enum Level {
		Trace,
		Debug,
		Info,
		Warn,
		Error,
		Fatal
	}

	private static string[] logLevelTokens = {
		"trace",
		"debug",
		"info",
		"warn",
		"error",
		"fatal"
	};

	public static void log(Level level, string msg) {
		var json = "{\"type\": \"core.simpleLog.message\", \"payload\": {\"level\": \""
			+ logLevelTokens[(int)level]
			+ "\", \"message\": \""
			+ msg
			+ "\"}}";

		Server.Broadcast(json);
	}

	public static void trace(string msg) {
		log (Level.Trace, msg);
	}

	public static void debug(string msg) {
		log (Level.Debug, msg);
	}

	public static void info(string msg) {
		log (Level.Info, msg);
	}

	public static void warn(string msg) {
		log (Level.Warn, msg);
	}

	public static void error(string msg) {
		log (Level.Error, msg);
	}

	public static void fatal(string msg) {
		log (Level.Fatal, msg);
	}

	public static void scalar(string name, float value) {
		var json = "{\"type\": \"scalar\", \"payload\": {" +
				"\"name\": \"" + name + "\", " + 
				"\"value\": " + value + "}}";

		Server.Broadcast(json);
	}

	public static void data(string name, float value) {
		var json = "{\"type\": \"core.simpleTelemetry.sample\", \"payload\": {" +
			"\"name\": \"" + name + "\", " + 
			"\"time\": " + Time.time + ", " + 
			"\"value\": " + value + "}}";
		
		Server.Broadcast(json);
	}

	public static void digital(string buttonName, int buttonNumber, int controllerNumber, bool value) {
		var json = "{\"type\": \"ext.input.gamePad.sample\", \"payload\": {" +
			"\"type\": \"digital\", " + 
			"\"name\": \"" + buttonName + "\", " + 
			"\"controllerNumber\": " + controllerNumber + ", " + 
			"\"buttonNumber\": " + buttonNumber + ", " + 
			"\"time\": " + Time.time + ", " + 
			"\"value\": " + System.Convert.ToInt16(value) + "}}";
		
		Server.Broadcast(json);
	}

	public static void analog(string axisName, int axisNumber, int controllerNumber, float value) {
		var json = "{\"type\": \"ext.input.gamePad.sample\", \"payload\": {" +
			"\"type\": \"analog\", " + 
			"\"name\": \"" + axisName + "\", " + 
			"\"controllerNumber\": " + controllerNumber + ", " + 
			"\"axisNumber\": " + axisNumber + ", " + 
			"\"time\": " + Time.time + ", " + 
			"\"range\": {\"min\": -1, \"max\": 1}, " + 
			"\"value\": " + value + "}}";

		Server.Broadcast(json);
	}


}
