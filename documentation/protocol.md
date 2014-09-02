# The Space Walk Protocol
`Version 1.0.0 draft 1`

One of the three pillars of Space Walk is the common protocol. Having an (easy to use) common protocol, allows developers and researchers to share their tools and to make them interoperable with the tools of other devs. 

## Design Goals
The following design goals are leading the development of the protocol:

- Ease of use: The protocol shall be simple to work with and debugging friendly. 
- Extensible: The protocol shall be easy to extend. Additions to the protocol should not impact older implementations.
- Low complexity: The protocol shall not depend on state, and not require any sort of complex handshake or negotiation. 
- Graceful degradation: As far as possible the service shall degrade gracefully.
- Low barrier of entry for new devs
- Self describing

This lead to a human readable and understandable json based message interface. Performance is not one of the main goals. It only has to run "fast enough". Using a mostly stateless json protocol sure is wasteful in terms of message size and computational overhead, but on the other hand, using this simple protocol makes working with it much easier, and should also lower the barrier of entry for new developers.

Space Walk not only supports sending messages from the server to the client (even though most of the data will flow in that direction) but is also meant to support message going from the client back to the server. This can for instance be used for live parameter tuning or to request screen shots form the game.

## The Base Structure
The basic message structure is quite simple. It has a unique `type` id and a `payload` field that encapsulates the arbitrary payload. Let's take a look at an example:

	{
		"type": "namespace.feature.messageType",
		"payload": {
			"level": "info",
			"message": "hello Telemetry!"
		}
	}

The protocol should be self describing and easy to understand. The different message types form *protocol features*. Each feature can be implemented independently of others.

### Name spaces
The protocol supports name spaces for message types to avoid name collisions and to provide a mechanism for continually extending and improving the protocol, while allowing others to extend it for their purposes.

#### Built in Name Spaces
Space Walk comes with two reserved namespaces: `core` and `ext`. The `core` name space is meant to be stable throughout a major version of the protocol. New features are first introduced as an extension in the `ext` name space and then move into the `core` once they have stabilised enough and proven useful. 

#### Custom Name Spaces
The reverse domain name notation scheme is recommended for developers who are extending or creating their own features and message types. E.g.

	{
		"type": "at.simonwallner.biometrtics.data",
		"payload": {
			"HR": 123
		}
	}

## Naming Conventions
Message must be valid JSON objects and all parameter names should be in camel case starting with a lower case letter. The reverse domain part of the name space  should be in lower case followed by further sub name spaces, feature names and message names in camel case. E.g.

	at.simonwallner.spaceWalk.myFeature.messageName

All parameter names and message types are case sensitive.

## Core Features
These are the cure features that currently form the Space Walk protocol. Over time, more and more features are expected to make it into the core section. 

### Simple Logging
The simple logging feature is intended in addition to or as a replacement for other logging mechanisms. Having a good logging framework usually is not so much of an issue when developing on a PC but just printing to the console might not be a practical solution when working on embedded devices or consoles. 

This feature consists of a single message that just covers the basic logging needs.

	{
		"type": "core.simpleLog.message",
		"payload": {
			"level": "info",
			"message": "Hello, Space Walk!"
		}
	}

`level` can be one of the following keywords (with rising severity):	`[trace, debug, info, warn, error, fatal]`

### Simple Telemetry
The simple telemetry feature is intended as a simple way to get numeric data from an application. This data can then be visualised directly or plotted on a time axis, etc...

Example usages are the games frame time, current memory consumption, debugging animated parameters, etc...

The feature currently consists of two messages: `sample` is meant to be used for data that is measured a repeatedly over a longer time and `foobar` is meant to used for data that remains constant most of the time. 

#### core.simpleTelemetry.sample
Samples are time referenced measurements of scalar data. The name string is unique and is used to collect data that belongs to the same data series.

	{
		"type": "core.simpleTelemetry.sample",
		"payload": {
			"name": "frame time",
			"time": 3.141
			"value": 2.718
		}
	}

#### core.simpleTelemetry.foobar
foobar is not time referenced, and is more an event style message. It just indicates the current value of something.

	{
		"type": "core.simpleTelemetry.fooBar",
		"payload": {
			"name": "connected controller cnt",
			"value": 3
		}
	}


## Ext Features
Features in the `ext` name space are meant to be current extensions to the core protocol that are likely to make their way into the core feature set once they are reasonably stable and have proven to be a valuable extension to the core.

### User Input Data
Games most often use some kind of user input. The following feature covers standard game pads with buttons and analog controls. An extension to other input devices like keyboards and mice is likely.

This feature uses an additional `type` parameter to discern between buttons and analog controls on the payload level. The message for a single button looks as follows:

	{
		"type": "ext.input.gamePad.sample",
		"payload": {
			"type": "digital",
			"name": "foo",
			"value": 1 // {0, 1}
			"time": 123.34,
		}
	}

Analog controls use the following message.

	{
		"type": "ext.input.gamePad.sample",
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


