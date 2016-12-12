var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var path = require('path');
var log = require('../utils/logger');
const configurationManager = require('./ConfigurationManager');
const environmentSettings = process.env

const awsS3BucketName = environmentSettings.AWS_S3_BUCKET_NAME


class ConfigurationLoader {

    constructor(environment, environmentVariables) {
        this.environment = environment
        this.environmentVariables = environmentVariables
    }


    /**
     * Loads a local config file for server
     * @returns {Promise}
     */
    loadLocalConfig() {
        return new Promise((resolve, reject) => {
            try {
                configurationManager.load(path.join(__dirname, '..', 'config/', 'server.json'))
                resolve(configurationManager)
            }
            catch (error) {
                reject(error)
            }
        })
    }

    downloadServerConfigFromS3() {

        return new Promise((resolve, reject) => {
            let s3KeyName = process.env.AWS_S3_SERVER_CONFIG_NAME ? process.env.AWS_S3_SERVER_CONFIG_NAME : 'server.json'

            log.info({
                    configFile: s3KeyName,
                    bucket: awsS3BucketName
                },
                'Download Server config from S3')

            s3.getObject({Bucket: awsS3BucketName, Key: s3KeyName}).on('success', function (response) {

                const file = require('fs').createWriteStream('./server/config/server.external.json');
                const stream = s3.getObject(response.request.params).createReadStream();
                stream.pipe(file)

                stream.on('finish', () => {
                    log.info('Server config downloaded')
                    configurationManager.load(path.join(__dirname, '..', 'config', 'server.external.json'));
                    resolve(configurationManager)
                })

                stream.on('error', (error) => {
                    reject(error)
                })
            }).on('error', (error) => {
                reject(error)
            }).send();
        })
    }


    /**
     * Download and stores config file for writer.
     * Saves config file as writer.external.json
     * @returns {Promise}
     */
    downloadWriterConfigFromS3() {

        return new Promise((resolve, reject) => {

            let s3KeyName = process.env.AWS_S3_CLIENT_CONFIG_NAME ? process.env.AWS_S3_CLIENT_CONFIG_NAME : 'writer.json'

            log.info({
                    configFile: s3KeyName,
                    bucket: awsS3BucketName
                },
                'Download client config from S3')


            s3.getObject({Bucket: awsS3BucketName, Key: s3KeyName}).on('success', function (response) {
                const file = require('fs').createWriteStream('./server/config/writer.external.json');
                const stream = s3.getObject(response.request.params).createReadStream();
                stream.pipe(file)

                stream.on('finish', () => {
                    log.info('Client config downloaded')
                    resolve()
                })

                stream.on('error', (error) => {
                    reject(error)
                })
            }).on('error', (error) => {
                reject(error)
            }).send();
        })
    }


    /**
     * Download configuration files for server and writer from S3
     * @returns {Promise.<*>}
     */
    loadConfigsFromS3() {

        let serverConfig = this.downloadServerConfigFromS3()
        let writerConfig = this.downloadWriterConfigFromS3()

        return Promise.all([serverConfig, writerConfig])
    }


    /**
     *  Loads the configuration for both writer and server
     *
     *  If environment is prodction config files is loaded from S3
     *  If running i develop environment local config files is loaded
     *
     * @returns {Promise(configurationManager)}
     */
    load() {

        if (this.environment === 'production') {
            return new Promise((resolve, reject) => {
                this.loadConfigsFromS3().then(() => {
                    resolve(configurationManager)
                }).catch((error) => {
                    reject(error)
                })
            })

        } else {
            return this.loadLocalConfig()
        }


    }

}

module.exports = ConfigurationLoader