# Evohome2mqtt

[![npm](https://img.shields.io/npm/v/evohome2mqtt.svg?style=flat-square)](https://www.npmjs.com/package/evohome2mqtt)
[![travis](https://img.shields.io/travis/svrooij/evohome2mqtt.svg?style=flat-square)](https://travis-ci.org/svrooij/evohome2mqtt)
[![mqtt-smarthome](https://img.shields.io/badge/mqtt-smarthome-blue.svg?style=flat-square)](https://github.com/mqtt-smarthome/mqtt-smarthome)
[![Support me on Patreon][badge_patreon]][patreon]
[![PayPal][badge_paypal_donate]][paypal-donations]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

This node.js application is a bridge between the [Evohome system](http://getconnected.honeywell.com/en/evohome) and a mqtt server. Your thermostats will be polled every x seconds and the status(es) get published to your (local) mqtt server. As with a bridge it also works the other way around. You can set the temperature for a thermostat with a message to mqtt.

It's intended as a building block in heterogenous smart home environments where an MQTT message broker is used as the centralized message bus. See [MQTT Smarthome on Github](https://github.com/mqtt-smarthome/mqtt-smarthome) for a rationale and architectural overview.

## Installation

Using xiaomi2mqtt is really easy, but it requires at least [Node.js](https://nodejs.org/) v6 or higher. (This app is tested against v6 and v8).

`sudo npm install -g evohome2mqtt`

## Usage

```bash
evohome2mqtt 0.0.0-development
Usage: evohome2mqtt [options]

Options:
  --user                  Your evohome username                       [required]
  --password              Your evohome password                       [required]
  -h, --help              Show help
  -l, --logging           possiblevalues: "error", "warn","info","debug"
                                                               [default: "info"]
  -m, --mqtt              mqtt broker url. See
                          https://github.com/svrooij/evohome2mqtt#mqtt-url
                                                   [default: "mqtt://127.0.0.1"]
  -n, --name              instance name. used as mqtt client id and as topic
                          prefix                            [default: "evohome"]
  -p, --polling-interval  evohome polling interval in seconds      [default: 30]
  --app                   Specify a different application ID (EXPERT?)
                               [default: "91db1612-73fd-4500-91b2-e63b069b185c"]
  --version               Show version number                          [boolean]
```

### Evohome credentials

We need your evohome credentials, so those are required. `evohome2mqtt --user yourUsername --password yourSecretPassword`

### MQTT Url

Use the MQTT url to connect to your specific mqtt server. Check out [mqtt.connect](https://github.com/mqttjs/MQTT.js#connect) for the full description.

```txt
Connection without port (port 1883 gets used)
[protocol]://[address] (eg. mqtt://127.0.0.1)

Connection with port
[protocol]://[address]:[port] (eg. mqtt://127.0.0.1:1883)

Secure connection with username/password and port
[protocol]://[username]:[password]@[address]:[port] (eg. mqtts://myuser:secretpassword@127.0.0.1:8883)
```

### Environment variables

You can also config this app with environment variables, they all start with `EVOHOME2MQTT_` and then then full name of the argument. Like `EVOHOME2MQTT_USER`, `EVOHOME2MQTT_PASSWORD` or `EVOHOME2MQTT_POLLING_INTERVAL`

## Topics

Every message starts with a prefix (see [usage](#usage)) that defaults to `evohome`. So if you change this all the topics change.

### Connect messages

This bridge uses the `evohome/connected` topic to send retained connection messages. Use this topic to check your evohome bridge is still running.

* `0` or missing is not connected (set by will functionality).
* `1` is connected to mqtt, but not to evohome.
* `2` is connected to mqtt and evohome. (ultimate success!)

### Status messages

The status of each thermostat will be published to `evohome/status/thermostat/zone_name` as a JSON object containing the following fields.

* `val` current temperature.
* `state` JSON object retrieved from evohome server.
* `lc` last change.

We also publish the temperature as a single value to `evohome/status/thermostat/zone_name/temp`.

### Setting the temperature

You can control each zone by sending a json message to `evohome/set/thermostat/zone_name` with the following fields:

* `temp` is the new temperature.
* `minutes` is the number of minutes this new temp should be set (optional).

```JSON
evohome/set/thermostat/livingroom
{
  "temp":20,
  "minutes":48
}
```

Will set the temperature to 20º for 48 minutes.

An empty message to `evohome/set/thermostat/livingroom` will revert the `livingroom` back to the schedule.

## Use [PM2](http://pm2.keymetrics.io) to run in background

If everything works as expected, you should make the app run in the background automatically. Personally I use PM2 for this. And they have a great [guide for this](http://pm2.keymetrics.io/docs/usage/quick-start/).

## Special thanks

The latest version of this bridge is inspired on [hue2mqtt.js](https://github.com/hobbyquaker/hue2mqtt.js) by [Sabastian Raff](https://github.com/hobbyquaker). That was a great sample on how to create a globally installed, command-line, something2mqtt bridge.

## Beer

This bridge took me a lot of hours to build, so I invite everyone using it to [Buy me a beer](https://svrooij.nl/buy-me-a-beer/)

[badge_paypal_donate]: https://svrooij.nl/badges/paypal_donate.svg
[badge_patreon]: https://svrooij.nl/badges/patreon.svg
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=T9XFJYUSPE4SG
[patreon]: https://www.patreon.com/svrooij
