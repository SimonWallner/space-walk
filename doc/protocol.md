# protocol documentation for Space Walk
Space walk uses a human readable and understandable json message interface. The messages are as follows:

## Server (game) --> Client (btowser)

### Log messages
	{
		"type": "log",
		"payload": {
			"level": "info",
			"message": "hello Telemetry"
		}
	}

*level* can be a keyword from (with rising severity)
	[trace, debug, info, warn, error, fatal]

### Sending scalar values
Their are two different modes of sending scalar values. Time referenced or not.
	{
		"type": "scalar",
		"payload": {
			"name": "my first scalar",
			"value": 42.314
		}
	}

and the time referenced 'data' message
	{
		"type": "data",
		"payload": {
			"name": "my first scalar",
			"reference": 123.456,
			"value": 42.314
		}
	}

### Variable Tweaking

Variables can be registered to be tweaked remotely
	{
		"type": "floatVariable",
		"payload": {
			"name": "my first scalar",
			"value": 42.314,
			"min": 0.0,
			"max": 1.0,
			"description": "awesomeness coefficient"
		}
	}


### Map tiles

	{
		"type": "mapTileRequest",
		"payload": {
			"top": 1234.1234,
			"left": 123,
			"width": 123,
			"height": 1234
		}
	}

// TODO separate mime type and encoding

	{
		"type": "mapTile",
		"payload": {
			"type": "image/png;base64",
			"data": "asdfasfhkjadshflaksjdfhkla...",
			"top": 1234.1234,
			"left": 123,
			"width": 123,
			"height": 1234
		}
	}



## Space Walk Positional Tracking
	{
		"type": "position",
		"payload": {
			"time": 123.34,
			"x": 123,
			"y": 3456,
			"z": 789
		}
	}
