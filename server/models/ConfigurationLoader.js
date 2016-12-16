var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var path = require('path');
var log = require('../utils/logger');
var fs = require('fs');

const configurationManager = require('./ConfigurationManager');
const environmentSettings = process.env

const awsS3BucketName = environmentSettings.AWS_S3_BUCKET_NAME

const configFiles = ['./server/config/writer-config-1', './server/config/writer-config-2']


let configRequests = 1;
let configFileIndex = -1
let waitingForConfig;
let periodicDownloadRef
let writerConfig
let currentConfigEtag

class ConfigurationLoader {

    constructor(environment, environmentVariables, params) {
        this.environment = environment
        this.environmentVariables = environmentVariables
        if (params && params.daemon) {
            this.initDaemon();
        }
    }


    initDaemon() {
        log.info("Initializing daemon")
        periodicDownloadRef = setInterval(this.periodicDownload.bind(this), 30000)
        this.periodicDownload();
    }

    checkForWriterConfigUpdates() {
        return new Promise((resolve, reject) => {
                let s3KeyName = process.env.AWS_S3_CLIENT_CONFIG_NAME ? process.env.AWS_S3_CLIENT_CONFIG_NAME : 'writer.json'

                s3.headObject({Bucket: awsS3BucketName, Key: s3KeyName})
                    .on('success', (response) => {
                        let etag = response.data.ETag
                        if (etag !== currentConfigEtag) {
                            log.info({filename: s3KeyName, currentEtag: currentConfigEtag, newEtag: etag}, "Found config updates");
                            currentConfigEtag = etag
                            return resolve(true)
                        }
                        resolve(false)
                    })
                    .on('error', (error) => {
                        reject(error)
                    })
                    .send();
            }
        )
    }

    periodicDownload() {
        if (configRequests > 0) {
            let noOfRequests = configRequests
            configRequests = 0
            this.checkForWriterConfigUpdates()
                .then((hasUpdates) => {
                    if (hasUpdates) {
                        this.downloadWriterConfigFromS3()
                            .then(() => this.copyWriterConfigToLocalFile())
                            .then(() => {
                                configFileIndex = (configFileIndex + 1) % configFiles.length
                                log.info({configFile: ConfigurationLoader.getConfigFile()}, "Reading from config")
                            })
                            .then(() => this.loadWriterConfig())
                            .then(() => {
                                if (typeof waitingForConfig !== 'undefined') {
                                    waitingForConfig(writerConfig)
                                    waitingForConfig = undefined
                                }
                            })
                            .catch((e) => {
                                log.error({err: e}, "Exception while downloading conf")
                            })
                    } else {
                        log.info({configRequests: noOfRequests}, "No changes in writer config file")
                    }
                })
                .catch((e) => log.error({err: err}, "Problem when checking for config updates"))
        }
    }

    loadWriterConfig() {
        return new Promise((resolve, reject) => {
            let content = fs.readFileSync(ConfigurationLoader.getConfigFile(), 'utf8');
            if (!content) {
                log.error({path: path}, 'Missing configuration file');
                return reject(path);
            }

            writerConfig = JSON.parse(content);

            resolve()

        });
    }

    copyWriterConfigToLocalFile() {
        return new Promise((resolve, reject) => {
            const rd = fs.createReadStream('./server/config/writer.external.json');
            rd.on('error', rejectCleanup);
            const wr = fs.createWriteStream(ConfigurationLoader.peekNextConfigFile());
            wr.on('error', rejectCleanup);
            function rejectCleanup(err) {
                rd.destroy();
                wr.end();
                reject(err);
            }

            wr.on('finish', resolve);
            rd.pipe(wr);
        });
    }

    static getConfigFile() {
        return configFiles[configFileIndex]
    }

    static peekNextConfigFile() {
        return configFiles[(configFileIndex + 1) % configFiles.length]
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

    getConfig() {
        configRequests++;
        return new Promise((resolve, reject) => {
            if (configFileIndex === -1) {
                waitingForConfig = resolve;
            } else {
                resolve(writerConfig)
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