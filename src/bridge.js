const log = require('yalm')
const config = require('./config.js')
const mqtt = require('mqtt')
const _ = require('lodash')
const evohome = require('./evohome.js')
const pkg = require('../package.json')

let client
let evohomeSession
let evohomeDevices = []
let evohomeTimer

// Configure the MQTT client to connect with a will statement (this will be send when we get disconnected.)
function start () {
  log.setLevel(config.logging)
  log.info(pkg.name + ' ' + pkg.version + ' starting')

  const mqttOptions = { will: {
    topic: config.name + '/connected',
    message: 0,
    qos: 0
  }}

  client = mqtt.connect(config.mqtt, mqttOptions)

  client.on('connect', () => {
    // Inform controllers we are connected to mqtt (but not yet to the hardware).
    publishConnectionStatus()
    client.subscribe(config.name + '/set/thermostat/+')
  })

  client.on('message', (topic, message) => {
    if (evohomeSession == null) {
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
      if (evohomeDevices[name]) {
        var device = evohomeDevices[name]
        clearTimeout(evohomeTimer)
        if (payload.temp && payload.minutes) {
          log.info('Set temp. in %s to %d for %d minutes', name, payload.temp, payload.minutes)
          evohomeSession.modifyHeatSetpoint(device.deviceID, 'Temporary', payload.temp, payload.minutes).then(publishEvohomeStatus)
        } else if (payload.temp) {
          log.info('Set temp. in %s to %d', name, payload.temp)
          evohomeSession.modifyHeatSetpoint(device.deviceID, 'Hold', payload.temp).then(publishEvohomeStatus)
        } else {
          log.info('Revert %s back to the schedule', name)
          evohomeSession.modifyHeatSetpoint(device.deviceID, 'Scheduled').then(publishEvohomeStatus)
        }
      }
    }
  })

  client.on('close', () => {
    log.info('mqtt closed ' + config.mqtt)
  })

  client.on('error', err => {
    log.error('mqtt', err.toString())
  })

  client.on('offline', () => {
    log.error('mqtt offline')
  })

  client.on('reconnect', () => {
    log.info('mqtt reconnect')
  })

  log.debug('Evohome username: ' + config.user)
  evohome.login(config.user, config.password, config.app, config.logging).then(function (session) {
    log.info('Logged-in to Evohome')
    evohomeSession = session
    publishConnectionStatus()
    publishEvohomeStatus()
  }).fail(function (err) {
    log.error(err)
    process.exit(10)
  })
} // End function

// This function fetches the data from evohome and will then schedule itself with setTimeout.
function publishEvohomeStatus () {
  if (!client || !evohomeSession) {
    return
  }
  log.log('Loading data from evohome')
  evohomeSession.getLocations().then(function (locations) {
    // currently only the first location. (PULL REQUEST please!!)
    locations[0].devices.forEach(function (device) {
      if (device.thermostat) {
        const name = device.name.toLowerCase()
        if (evohomeDevices[name] == null || !_.isEqual(evohomeDevices[name], device)) {
          // Check if something has changed!
          // Publish full status
          const message = {
            val: device.thermostat.indoorTemperature,
            state: device.thermostat,
            lc: Date.now()
          }
          client.publish(
            config.name + '/status/thermostat/' + name,
            JSON.stringify(message), {
              qos: 0,
              retain: true
            }
          )

          // Only temp
          client.publish(
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

    evohomeTimer = setTimeout(publishEvohomeStatus, config.pollingInterval * 1000)
  }).fail(function (err) {
    log.error(err)
    process.exit()
  })
}

function publishConnectionStatus () {
  let status = '1'
  if (evohomeSession) {
    status = '2'
  }
  client.publish(config.name + '/connected', status, {
    qos: 0,
    retain: true
  })
}

start()
