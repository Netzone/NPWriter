var express = require('express');
var path = require('path');
var app = express();
var routes = require('./server/routes/routes')
// var config = require('./server/models/ConfigurationManager')
var log = require('./server/utils/logger');
var { DocumentServer, CollabServer, CollabServerPackage, CollabServerConfigurator } = require('substance')
var http = require('http')
// TODO: check how to use a different websocket impl
var ws = require('ws')
var seedLib = require('./seed.cjs.js')

var WebSocketServer = ws.Server
var seed = seedLib.seed
var buildSnapshot = seedLib.buildSnapshot

require('source-map-support').install()

const ConfigurationLoader = require('./server/models/ConfigurationLoader')
const environmentVariables = process.env
const environment = environmentVariables.NODE_ENV ? environmentVariables.NODE_ENV : 'develop'
const isProduction = environment === 'production';

var publicPath = path.resolve(__dirname, 'dist');
if (isProduction) {
    publicPath = path.resolve(__dirname, 'writer');
}

// config code

/*
CollabServerPackage provides an in-memory backend for testing purposes.
For real applications, please provide a custom package here, which configures
a database backend.
*/
let cfg = new CollabServerConfigurator()
cfg.import(CollabServerPackage)
cfg.setHost(process.env.HOST || 'localhost')
cfg.setPort(isProduction ? process.env.PORT : 5000)
cfg.setSnapshotBuilder(buildSnapshot)

var httpServer = http.createServer()
let wss = new WebSocketServer({ server: httpServer })

/*
DocumentServer provides an HTTP API to access snapshots
*/
var documentServer = new DocumentServer({
    configurator: cfg
})
documentServer.bind(app)

/*
CollabServer implements the server part of the collab protocol
*/
var collabServer = new CollabServer({
    configurator: cfg
})

collabServer.bind(wss)

// Delegate http requests to express app
httpServer.on('request', app)


// boot code

switch (environment) {
    case 'standby':
        startStandbyServer()
        break
    default:
        startServer()
}

/**
* When Newspilot Writer environment is setup by CloudWatch we a missing some configuration etc
* so we need to start this server so the docker container doesn't crash,
*/
function startStandbyServer() {
    app.get('/', function(req, res){
        res.send('Newspilot Writer is in standby mode');
    })
    httpServer.listen(cfg.getPort(), cfg.getHost(), function() {
        log.info({
            env: environment
        }, "Writer started in standby mode without config ")
    })
}

/**
* Load configuration either locally or from S3 and then start the server
*/
function startServer() {
    const configurationLoader = new ConfigurationLoader(environment, environmentVariables)

    configurationLoader.load().then((configurationManager) => {

        const host = configurationManager.get('server.host', '127.0.0.1')
        const protocol = configurationManager.get('server.protocol', 'http')
        const port = configurationManager.get('server.port', 'http')

        app.use('/', express.static(publicPath));
        app.use('/api', routes);
        app.use(express.static(path.join(__dirname)));

        // HACK: only for demoing purposes, seeding should not
        // be done on server start up
        console.info('Seeding database ...')
        let changeStore = cfg.getChangeStore()
        let snapshotStore = cfg.getSnapshotStore()
        seed(changeStore, snapshotStore, function() {
            console.info('successfully seeded.', snapshotStore)
        })

        httpServer.listen(cfg.getPort(), cfg.getHost(), function() {
            log.info({
                env: environment
            }, "Writer running @ " + protocol + '://' + host + ':' + port)
        })

    }).catch((error) => {
        log.error({
            msg: error.message
        }, error.message)
        console.error('Could not start Writer', error)
    })
}
