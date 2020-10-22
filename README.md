# Evohome2mqtt

[![npm][badge_npm]][link_npm]
[![Run tests and publish][badge_build]][link_build]
[![github issues][badge_issues]][link_issues]
[![Support me on Github][badge_sponsor]][link_sponsor]
[![mqtt-smarthome][badge_smarthome]][link_smarthome]
[![semantic-release][badge_semantic]][link_semantic]

This node.js application is a bridge between the [Evohome system](http://getconnected.honeywell.com/en/evohome) and a mqtt server. Your thermostats will be polled every x seconds and the status(es) get published to your (local) mqtt server. As with a bridge it also works the other way around. You can set the temperature for a thermostat with a message to mqtt.

It's intended as a building block in heterogenous smart home environments where an MQTT message broker is used as the centralized message bus. See [MQTT Smarthome on Github](https://github.com/mqtt-smarthome/mqtt-smarthome) for a rationale and architectural overview.

## Installation

Using evohome2mqtt is really easy, but it requires at least [Node.js](https://nodejs.org/) v6 or higher. (This app is tested against v12).

`sudo npm install -g evohome2mqtt`

## Usage

```text
evohome2mqtt 0.0.0-development
Usage: evohome2mqtt [options]

Options:
  --user                  Your evohome username                       [required]
  --password              Your evohome password                       [required]
  -l, --logging           Logging level
                   [choices: "error", "warn", "info", "debug"] [default: "info"]
  -m, --mqtt              mqtt broker url. See
                          https://github.com/svrooij/evohome2mqtt#mqtt-url
                                                   [default: "mqtt://127.0.0.1"]
  -n, --name              instance name. used as mqtt client id and as topic
                          prefix                            [default: "evohome"]
  -p, --polling-interval  evohome polling interval in seconds      [default: 30]
  --app                   Specify a different application ID (EXPERT?)
                               [default: "91db1612-73fd-4500-91b2-e63b069b185c"]
  -h, --help              Show help                                    [boolean]
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

## Beer or Coffee

This bridge took me a lot of hours to build, so I invite everyone using it to at least have a look at my [Sponsor page](https://github.com/sponsors/svrooij). Even though the sponsoring tiers are montly you can also cancel anytime :wink:

[badge_build]: https://github.com/svrooij/evohome2mqtt/workflows/Run%20tests%20and%20publish/badge.svg
[badge_issues]: https://img.shields.io/github/issues/svrooij/evohome2mqtt?style=flat-square
[badge_npm]: https://img.shields.io/npm/v/evohome2mqtt?style=flat-square
[badge_semantic]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[badge_smarthome]: https://img.shields.io/badge/mqtt-smarthome-blue.svg?style=flat-square
[badge_sponsor]: https://img.shields.io/badge/Sponsor-on%20Github-red?style=flat-square

[link_build]: https://github.com/svrooij/evohome2mqtt/actions
[link_issues]: https://github.com/svrooij/evohome2mqtt/issues
[link_npm]: https://www.npmjs.com/package/evohome2mqtt
[link_semantic]: https://github.com/semantic-release/semantic-release
[link_smarthome]: https://github.com/mqtt-smarthome/mqtt-smarthome
[link_sponsor]: https://github.com/sponsors/svrooij
