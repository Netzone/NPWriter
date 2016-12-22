var express = require('express');
var path = require('path');
var app = express();
var routes = require('./server/routes/routes')
var config = require('./server/models/ConfigurationManager')
var log = require('./server/utils/logger');

const ConfigurationLoader = require('./server/models/ConfigurationLoader')

const environmentVariables = process.env

const environment = environmentVariables.NODE_ENV ? environmentVariables.NODE_ENV : 'develop'
const isProduction = environment === 'production';

var port = isProduction ? process.env.PORT : 5000;
var publicPath = path.resolve(__dirname, 'dist');
if (isProduction) {
    var publicPath = path.resolve(__dirname, 'writer');
}

const configurationLoader = new ConfigurationLoader(environment, environmentVariables)

configurationLoader.load().then((configurationManager) => {

    const host = configurationManager.get('server.host', '127.0.0.1'),
        protocol = configurationManager.get('server.protocol', 'http')
    port = configurationManager.get('server.port', 'http')

    app.use('/', express.static(publicPath));
    app.use('/api', routes);
    app.use(express.static(path.join(__dirname)));

    app.listen(port, function () {
        log.info({
            env: environment
        }, "Writer running @ " + protocol + '://' + host + ':' + port)
    });

}).catch((error) => {
    log.error({
        msg: error.message
    }, error.message)
    console.error('Could not start Writer', error.message)
})