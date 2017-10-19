// config is needed for loading the config file.
const config = require('config')
const _ = require('lodash')
// Evohome library is used for connecting to the cloud.
const evohome = require('./lib/evohome.js')

// MQTT library for all the communication.
const mqtt = require('mqtt')

// Load evohome Config
var evoConf = config.get('evohome')
var mqttConf = config.get('mqtt')

// Configure the MQTT client to connect with a will statement (this will be send when we get disconnected.)
var mqttOptions = { will: {
  topic: mqttConf.topic + 'connected',
  message: 0,
  qos: 0
}}
if (mqttConf.user && mqttConf.password) {
  mqttOptions.username = mqttConf.user
  mqttOptions.password = mqttConf.password
}
const client = mqtt.connect(mqttConf.host, mqttOptions)

client.on('connect', () => {
    // Inform controllers we are connected to mqtt (but not yet to the hardware).
  publishConnectionStatus()
  client.subscribe(mqttConf.topic + 'set/thermostat/+')
})

client.on('message', (topic, message) => {
  if (evohomeSession == null) {
    return
  }

  if (topic.startsWith(mqttConf.topic + 'set/thermostat/')) {
    var payload = null
    try {
      payload = JSON.parse(message)
    } catch (e) {
      payload = {}
    }
    var name = topic.substr(topic.lastIndexOf('/') + 1)
    if (evohomeDevices[name]) {
      var device = evohomeDevices[name]
      clearTimeout(evohomeTimer)
      if (payload.temp && payload.minutes) {
        console.log('Set temp. in %s to %d for %d minutes', name, payload.temp, payload.minutes)
        evohomeSession.modifyHeatSetpoint(device.deviceID, 'Temporary', payload.temp, payload.minutes).then(publishEvohomeStatus)
      } else if (payload.temp) {
        console.log('Set temp. in %s to %d', name, payload.temp)
        evohomeSession.modifyHeatSetpoint(device.deviceID, 'Hold', payload.temp).then(publishEvohomeStatus)
      } else {
        console.log('Revert %s back to the schedule', name)
        evohomeSession.modifyHeatSetpoint(device.deviceID, 'Scheduled').then(publishEvohomeStatus)
      }
    }
  }
})

var evohomeSession = null
var evohomeDevices = []
var evohomeTimer = null
console.log('Starting EvoHome2mqtt')

if (!evoConf.user || !evoConf.password) {
  console.error('Either Evohome user or password not set!')
  process.exit(5)
}

console.log('User: ' + evoConf.user)
evohome.login(evoConf.user, evoConf.password, evoConf.applicationId).then(function (session) {
  console.log('Successfully logged in to Evohome')
  evohomeSession = session
  publishConnectionStatus()
  publishEvohomeStatus()
}).fail(function (err) {
  console.error(err)
  process.exit(10)
})

// This function fetches the data from evohome and will then schedule itself with setTimeout.
function publishEvohomeStatus () {
  console.log('Loading data from evohome')
  evohomeSession.getLocations().then(function (locations) {
        // currently only the first location. (PULL REQUEST please!!)
    locations[0].devices.forEach(function (device) {
      if (device.thermostat) {
        var name = device.name.toLowerCase()
        if (evohomeDevices[name] == null ||
                    !_.isEqual(evohomeDevices[name], device)) {
 // Check if something has changed!

                    // Publish full status
          var message = {
            val: device.thermostat.indoorTemperature,
            state: device.thermostat,
            lc: Date.now()
          }
          client.publish(
                        mqttConf.topic + 'status/thermostat/' + name,
                        JSON.stringify(message), {
                          qos: 0,
                          retain: true
                        }
                    )

                    // Only temp
          client.publish(
                        mqttConf.topic + 'status/thermostat/' + name + '/temp',
                        device.thermostat.indoorTemperature.toString(), {
                          qos: 0,
                          retain: true
                        }
                    )
        }
        evohomeDevices[name] = device
      }
    })

    evohomeTimer = setTimeout(publishEvohomeStatus, evoConf.updateInterval * 1000)
  }).fail(function (err) {
    console.error(err)
    process.exit()
  })
}

function publishConnectionStatus () {
  var status = '1'
  if (evohomeSession) {
    status = '2'
  }
  client.publish(mqttConf.topic + 'connected', status, {
    qos: 0,
    retain: true
  })
}
