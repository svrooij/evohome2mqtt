# Evohome2mqtt

This node.js application is a bridge between the [Evohome system](http://getconnected.honeywell.com/en/evohome) and a mqtt server. Your thermostats will be polled every x seconds and the status(es) get published to your (local) mqtt server. As with a bridge it also works the other way around. You can set the temperature for a thermostat with a message to mqtt.

It's intended as a building block in heterogenous smart home environments where an MQTT message broker is used as the centralized message bus. See [MQTT Smarthome on Github](https://github.com/mqtt-smarthome/mqtt-smarthome) for a rationale and architectural overview.

# Topics
Every message starts with a prefix (see [config](#Config)) that defaults to `evohome`. So if you change this all the topics change.

## Connect messages
This bridge uses the `evohome/connected` topic to send retained connection messages. Use this topic to check your evohome bridge is still running.

*   `0` or missing is not connected (set by will functionality).
*   `1` is connected to mqtt, but not to evohome.
*   `2` is connected to mqtt and evohome. (ultimate success!)

## Status messages
The status of each thermostat will be published to `evohome/status/thermostat/zone_name` as a JSON object containing the following fields.

*   `val` current temperature.
*   `state` JSON object retrieved from evohome server.
*   `lc` last change.

We also publish the temperature as a single value to `evohome/status/thermostat/zone_name/temp`.

## Setting the temperature
You can control each zone by sending a json message to `evohome/set/thermostat/zone_name` with the following fields:

*   `temp` is the new temperature.
*   `minutes` is the number of minutes this new temp should be set (optional).

```
evohome/set/thermostat/livingroom
{
  "temp":20,
  "minutes":48
}
```
Will set the temperature to 20º for 48 minutes.

An empty message to `evohome/set/thermostat/livingroom` will revert the `livingroom` back to the schedule.

# Config
You would typically run this app in the background, but first you have to configure it.

```bash
git clone https://github.com/svrooij/evohome2mqtt.git
cd evohome2mqtt
npm install
nano config/local.json
```
You are now in the config file. Enter the following data as needed.
At the moment you can only connect to mqtt if it doesn't require an user/password. This will be implemented soon.

```JSON
{
  "mqtt": {
    "host":"mqtt://127.0.0.1"
  },
  "evohome": {
    "user":"user_or_email",
    "password":"password",
    "updateInterval":60
  }
}
```

Try to start the application by running `node index.js`, and the topics should appear on your mqtt server.

## Running in the background
If everything works as expected, you should make the app run in the background automatically. Personally I use PM2 for this. And they have a great [guide for this](http://pm2.keymetrics.io/docs/usage/quick-start/).
