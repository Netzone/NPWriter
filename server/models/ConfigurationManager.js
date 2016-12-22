'use strict';

var fs = require('fs');
var path = require('path');
var log = require('../utils/logger').child({model: 'ConfigurationManager'});
var _ = require('lodash');

/**
 * Configuration manager, static class
 * @class
 */
function ConfigurationManager() {
}

/**
 * Load configuration
 *
 * @param {string} path Path to configuration file
 */
ConfigurationManager.load = function (path) {

    var content = fs.readFileSync(path, 'utf8');
    if (!content) {
        log.error({path: path}, 'Missing configuration file');
        throw new Error('Configuration file is missing: ' + path);
    }

    log.info({
        path: path
    }, 'Configuration file loaded in Configuration manager')

    this.configurationCache = {};
    this.configuration = JSON.parse(content);
};

/**
 * Load plugin configuration if exist and merge with base configuration
 *
 *        "source": {
 *             "type": "git",
 *             "pluginrepositoryId": "implugin",
 *             "path": "cfg/writer.json"
 *         }
 *
 * @param {string} basePath Base path for app
 */
ConfigurationManager.loadPluginConfiguration = function (basePath) {
    var plugins = this.get('main.plugins');
    if (Array.isArray(plugins)) {
        return;
    }

    // TODO: plugins.name should not be defined in this way, it should be
    // fetched from the pluginRepository setting based on the pluginrepositoryId
    var sourceFile = path.join(
        basePath,
        'tmp',
        plugins.pluginrepositoryId,
        plugins.path
    );
    log.info('Syncing external plugin configuration from <' + sourceFile + '>');

    var content = fs.readFileSync(sourceFile, 'utf8');
    if (!content) {
        log.error({path: path}, 'Missing external plugin configuration file');
        throw new Error('External plugin configuration file is missing: ' + sourceFile);
    }

    var pluginConfig = JSON.parse(content);
    if (!Array.isArray(pluginConfig.plugins)) {
        return;
    }

    this.configurationCache = {};
    this.configuration.main.plugins = pluginConfig.plugins;
};

/**
 * Serialize configuration to json
 *
 * @param {boolean} clearExternal Optional, if true, clear external and repositories sections for added security
 *
 * @return {string}
 */
ConfigurationManager.serialize = function (clearExternal) {
    if (clearExternal === true) {
        var copy = Object.assign({}, this.configuration);
        copy.external = {};
        copy.main.pluginrepositories = [];
        return JSON.stringify(copy);
    }

    return JSON.stringify(this.configuration);
};

/**
 * Set configuration value, if path exists, and cache it
 * @param {string} path
 * @param {string} value
 */
ConfigurationManager.set = function (path, value) {
    var ptr = this.configuration;
    var keys = path.split('.');

    for (var n = 0; n < keys.length; n++) {
        if (!ptr[keys[n]]) {
            break;
        }
        else if (ptr[keys[n]] && n == keys.length - 1) {
            ptr[keys[n]] = value;
            this.configurationCache[path] = value;
            break;
        }
        ptr = ptr[keys[n]];
    }
};

/**
 * Get configuration value
 *
 * @param path JSON path to get
 * @param defaultValue Optional, default value to return if not set
 */
ConfigurationManager.get = function (path, defaultValue) {

    // If not cached, fetch value
    if (false === path in this.configurationCache) {
        this._getValue(path, defaultValue);
    }

    return this.configurationCache[path];
};

/**
 * Get named external backend
 *
 * @param {string} name Name of the backend
 * @param {string} method Http verb/method
 * @param {string} path Virtual path or endpoint
 *
 * @returns {object}
 * @throws {object} Error object with http status code (404 | 403) and message
 */
ConfigurationManager.getBackend = function (name, method, path) {
    var backends = this.get('external.backend');
    if (!Array.isArray(backends)) {
        throw {
            code: 404,
            message: 'No external backends configured',
        };
    }

    for (var n = 0; n < backends.length; n++) {
        if (backends[n].name !== name) {
            continue;
        }

        var allows = backends[n].allows;
        if (!_.isArray(allows)) {
            continue;
        }

        for (var m = 0; m < allows.length; m++) {
            if (path !== allows[m].path) {
                continue;
            }

            if (_.includes(allows[m].methods, method)) {
                return backends[n];
            }
        }

        throw {
            code: 403,
            message: "Access to external backend denied"
        };
    }

    throw {
        code: 404,
        message: 'No configured backend found to forward request',
    };
};

/**
 * Get and cache requested config path
 * @protected
 *
 * @param path JSON path to get
 * @param defaultValue Optional, default value to return if not set
 */
ConfigurationManager._getValue = function (path, defaultValue) {
    var ptr = this.configuration;
    var keys = path.split('.');
    var value = 'undefined' === typeof(defaultValue) ? undefined : defaultValue;

    defaultValue = value;
    for (var n = 0; n < keys.length; n++) {
        if (!ptr[keys[n]]) {
            value = defaultValue;
            break;
        }

        value = ptr[keys[n]];
        ptr = ptr[keys[n]];
    }

    this.configurationCache[path] = value;
    return value;
};

module.exports = ConfigurationManager;
