# protocol documentation for Space Walk
Space walk uses a human readable and understandable json message interface. The messages are as follows:

## JSON
JSON is used as the transport format, becase it is easily understandable and parsable by both humans and computers. Keywords are therefore not ordered, since is an unordered set of name/value pairs.

## Server (game) --> Client (browser)

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
			"time": 123.456,
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

Map tiles have span a quad with the following coords: (x, y), (x + width, y), (x, y + height), (x + width, y + height).
	{
		"type": "mapTileRequest",
		"payload": {
			"x": 1234.1234,
			"y": 123,
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
			"left": 123,
			"top": 1234.1234,
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

## Events
	{
		"type": "event"
		"payload": {
			"time": 123.123,
			"name": "foo",
			"data": "bar"
		}
	}


## User Input Data
Digital Button input, {0, 1}
	{
		"type": "input"
		"payload": {
			"type": "digital",
			"name": "foo",
			"value": 1 // {0, 1}
			"time": 123.34,
		}
	}

Analog input, e.g. stick axis...
	{
		"type": "input"
		"payload": {
			"type": "analog",
			"name": "foo",
			"value": 1
			"range": {
				"min": -1,
				"max": 1
			}
			"time": 123.34,
		}
	}
