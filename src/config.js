const pkg = require('../package.json')
const config = require('yargs')
    .env('EVOHOME2MQTT')
    .usage(pkg.name + ' ' + pkg.version + '\r\nUsage: $0 [options]')
    .describe('user', 'Your evohome username')
    .describe('password', 'Your evohome password')
    .describe('h', 'Show this help')
    .describe('l', 'possiblevalues: "error", "warn","info","debug"')
    .describe('m', 'mqtt broker url. See https://github.com/svrooij/node-xiaomi2mqtt#mqtt-url')
    .describe('n', 'instance name. used as mqtt client id and as topic prefix')
    .describe('p', 'evohome polling interval in seconds')
    .describe('app', 'Specify a different application ID (EXPERT?)')
    .alias({
      h: 'help',
      l: 'logging',
      m: 'mqtt',
      n: 'name',
      p: 'polling-interval'
    })
    .default({
      l: 'info',
      m: 'mqtt://127.0.0.1',
      n: 'evohome',
      app: '91db1612-73fd-4500-91b2-e63b069b185c',
      p: 30
    })
    .demand(['user', 'password'], ' We cannot work without your evohome account!')
    .version()
    .help('help')
    .argv

module.exports = config
