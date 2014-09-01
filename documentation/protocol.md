# The Space Walk Protocol
One of the three pillars of Space Walk is the common protocol. Having an (easy to use) common protocol, allows developers and researchers to share their tools and to make them interoperable with the tools of other devs. 

## Design Goals
The following design goals are leading the development of the protocol:

- Ease of use: The protocol shall be simple to work with and debugging friendly. 
- Extensible: The protocol shall be easy to extend. Additions to the protocol should not impact older implementations.
- Low complexity: The protocol shall not depend on state, and not require any sort of complex handshake or negotiation. 
- Graceful degradation: As far as possible the service shall degrade gracefully.
- Low barrier of entry for new devs
- Self documenting

This lead to a human readable and understandable json based message interface. Performance is not one of the main goals. It only has to run "fast enough". Using a mostly stateless json protocol sure is wasteful in terms of message size and computational overhead, but on the other hand, using this simple protocol makes working with it much easier, and should also lower the barrier of entry for new developers.

Space Walk not only supports sending messages from the server to the client (even though most of the data will flow in that direction) but is also meant to support message going from the client back to the server. This can for instance be used for live parameter tuning or to request screen shots form the game.


## The Base Structure
The basic message structure is quite simple. It has a unique `type` and a `payload` field that encapsulates the arbitrary payload. Let's take a look at an example:

	{
		"type": "log",
		"payload": {
			"level": "info",
			"message": "hello Telemetry"
		}
	}

The protocol should be self describing and easy to understand. The different message types form *protocol features*. Each feature can be implemented independently of others.

TODO: namespaces!!!
feature.messageName
extension namespaces?
x.feature.messageName
core.feature.messageName?
at.simonwallner.feature.message?

core. meant to stay the way they are within a major version
ex. experimental, likely to change in a major version, might turn into a core feature at some point.


##Core Features
These are the cure features that currently form the Space Walk protocol. Over time, more and more features are expected to make it into the core section. 

### Log Messages
	{
		"type": "core.log.message",
		"payload": {
			"level": "info",
			"message": "Hello, Space Walk!"
		}
	}

`level` can be one of the following keywords (with rising severity):	`[trace, debug, info, warn, error, fatal]`

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

### Parameter Tweaking

Variables can be registered to be tweaked remotely

	{
		"type": "floatParameter",
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
		"type": "event",
		"payload": {
			"time": 123.123,
			"name": "foo",
			"data": "bar"
		}
	}


## User Input Data
Digital Button input, {0, 1}

	{
		"type": "input",
		"payload": {
			"type": "digital",
			"name": "foo",
			"value": 1 // {0, 1}
			"time": 123.34,
		}
	}

Analog input, e.g. stick axis...

	{
		"type": "input",
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
