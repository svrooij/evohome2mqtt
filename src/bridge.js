const log = require('yalm')
const config = require('./config.js')
const mqtt = require('mqtt')
const EvohomeClient = require('@svrooij/evohome').EvohomeClient
const HeatSetpointStatus = require('@svrooij/evohome').HeatSetpointStatus
const pkg = require('../package.json')

let mqttClient
let evohomeClient
const evohomeDevices = []
let evohomeTimer
let loggedIn = false

// Configure the MQTT client to connect with a will statement (this will be send when we get disconnected.)
function start () {
  log.setLevel(config.logging)
  log.info(pkg.name + ' ' + pkg.version + ' starting')

  const mqttOptions = {
    will: {
      topic: config.name + '/connected',
      message: 0,
      qos: 0
    }
  }

  mqttClient = mqtt.connect(config.mqtt, mqttOptions)

  mqttClient.on('connect', () => {
    // Inform controllers we are connected to mqtt (but not yet to the hardware).
    publishConnectionStatus()
    mqttClient.subscribe(config.name + '/set/thermostat/+')
  })

  mqttClient.on('message', async (topic, message) => {
    if (evohomeClient == null) {
      return
    }

    if (topic.startsWith(config.name + '/set/thermostat/')) {
      var payload = null
      try {
        payload = JSON.parse(message)
      } catch (e) {
        payload = {}
      }
      var name = topic.substr(topic.lastIndexOf('/') + 1)
      handleUpdate(name, payload)
    }
  })

  mqttClient.on('close', () => {
    log.info('mqtt closed ' + config.mqtt)
  })

  mqttClient.on('error', err => {
    log.error('mqtt', err.toString())
  })

  mqttClient.on('offline', () => {
    log.error('mqtt offline')
  })

  mqttClient.on('reconnect', () => {
    log.info('mqtt reconnect')
  })

  log.debug('Evohome username: ' + config.user)
  evohomeClient = new EvohomeClient(config.user, config.password, config.app)
  evohomeClient
    .login()
    .then(session => {
      log.info('Logged-in to Evohome')
      loggedIn = true
      publishConnectionStatus()
      loadLocatonAndPush()
    })
    .catch(function (err) {
      log.error(err)
      process.exit(10)
    })
} // End function

// This function fetches the data from evohome and will then schedule itself with setTimeout.
function loadLocatonAndPush () {
  if (!evohomeClient) return

  log.log('Loading data from evohome')
  evohomeClient.getLocationsWithAutoLogin().then(locations => {
    // currently only the first location. (PULL REQUEST please!!)
    locations[0].devices.forEach(function (device) {
      if (device.thermostat) {
        const name = device.name.toLowerCase()
        if (evohomeDevices[name] == null || !compareObjects(evohomeDevices[name], device)) {
          // Check if something has changed!
          // Publish full status
          const message = {
            val: device.thermostat.indoorTemperature,
            state: device.thermostat,
            lc: Date.now()
          }
          mqttClient.publish(
            config.name + '/status/thermostat/' + name,
            JSON.stringify(message), {
              qos: 0,
              retain: true
            }
          )

          // Only temp
          mqttClient.publish(
            config.name + '/status/thermostat/' + name + '/temp',
            device.thermostat.indoorTemperature.toString(), {
              qos: 0,
              retain: true
            }
          )
        }
        evohomeDevices[name] = device
      }
    })

    evohomeTimer = setTimeout(loadLocatonAndPush, config.pollingInterval * 1000)
  }).catch(function (err) {
    log.error(err)
    process.exit()
  })
}

function handleUpdate (name, payload) {
  if (evohomeDevices[name]) {
    var device = evohomeDevices[name]
    clearTimeout(evohomeTimer)

    if (payload.temp && payload.minutes) {
      log.info('Set temp. in %s to %d for %d minutes', name, payload.temp, payload.minutes)
      evohomeClient
        .setHeatpointSetpoint(device.deviceID, HeatSetpointStatus.Temporary, payload.temp, payload.minutes)
        .then(loadLocatonAndPush)
        .catch(err => {
          log.warn('Error setting heatpoint %j', err)
        })
    } else if (payload.temp) {
      log.info('Set temp. in %s to %d', name, payload.temp)
      evohomeClient
        .setHeatpointSetpoint(device.deviceID, HeatSetpointStatus.Hold, payload.temp)
        .then(loadLocatonAndPush)
        .catch(err => {
          log.warn('Error setting heatpoint %j', err)
        })
    } else {
      log.info('Revert %s back to the schedule', name)
      evohomeClient
        .setHeatpointSetpoint(device.deviceID, HeatSetpointStatus.Scheduled)
        .then(loadLocatonAndPush)
        .catch(err => {
          log.warn('Error reverting heatpoint %j', err)
        })
    }
  }
}

function publishConnectionStatus () {
  mqttClient.publish(config.name + '/connected', loggedIn ? '2' : '1', {
    qos: 0,
    retain: true
  })
}

function compareObjects (obj1, obj2) {
  const json1 = JSON.stringify(obj1)
  const json2 = JSON.stringify(obj2)
  return json1 === json2
}

start()
