import ResourceLoader from './ResourceLoader'
import isString from 'lodash/isString'
import sortBy from 'lodash/sortBy'
import 'whatwg-fetch'

class PluginManager {

    /**
     *
     * @param {NPWriterConfigurator} configurator The configurator
     * @param {APIManager} apiManager Requires an API manager that exposes endpoints to window.writer namespace
     */
    constructor(configurator, apiManager) {
        this.configurator = configurator
        this.registerPluginList = new Map()
        this.plugins = new Map()
        this.configurationCache = {};

        apiManager.expose('registerPlugin', this.registerPlugin.bind(this))
    }

    /**
     * Fetch a list of plugins from backend and parse result to JSON
     * @param configURL {string} A URL to the config file constraint plugins
     * @returns {Promise.<TResult>|*}
     */
    getListOfPlugins(configURL) {
        return fetch(configURL, {
            credentials: "same-origin"
        })
            .then(response => response.json())
            .then(configJson => configJson.plugins)
    }

    /**
     * Appending script tag for plugins
     * @param plugins
     * @returns {Promise.<TResult>|*} - Returns an array of promise objects
     */
    appendPluginScripts(plugins) {
        const resourceLoader = new ResourceLoader()
        return plugins.map(plugin => {
            return resourceLoader.load(plugin, 'js')
        })
    }


    appendPluginStylesheet(plugin) {
        const resourceLoader = new ResourceLoader()
        if (plugin.style) {
            resourceLoader.load(plugin, 'css')
        }
    }


    /**
     * Called by the plugin when it's done loading
     * @param pluginPackage
     */
    registerPlugin(pluginPackage) {
        if (!this.validatePluginPackage(pluginPackage)) {
            throw new Error('Package does not conform to package standard')
        }
        const pluginRegisterFunction = this.registerPluginList.get(pluginPackage.id);
        if (pluginRegisterFunction) {
            pluginRegisterFunction(pluginPackage);
        } else {
            console.info("Trying to call register on a plugin that's not registered with the writer", pluginPackage.id);
        }
    }

    /**
     * Checks if requires properties and methods exists on pluginPackage
     * @param pluginPackage
     * @returns {boolean}
     */
    validatePluginPackage(pluginPackage) {
        return !(typeof pluginPackage.configure !== 'function' || !pluginPackage.id || !pluginPackage.name || !pluginPackage.configure);
    }

    /**
     * Adding a register function for plugins. That's called later in registerPlugin method in the window object
     * @param plugins
     * @returns {Promise.<*>}
     */
    load(plugins) {
        const enabledPlugins = plugins.filter((plugin) => {
            return plugin.enabled
        })

        this.pluginPackages = []
        const pluginRegistered = enabledPlugins.map((plugin, idx) => {
            return new Promise((resolve, reject) => {
                let resolved = false;

                this.registerPluginList.set(plugin.id, (pluginPackage) => {
                    pluginPackage.index = idx // Set the sort index for the package
                    this.pluginPackages.push({pluginPackage: pluginPackage, pluginConfigObject: plugin})
                    resolved = true;
                    this.plugins.set(plugin.id, plugin)
                    this.registerPluginList.delete(plugin.id)

                    // If plugin successfully registers then append the stylesheet provided for plugin
                    this.appendPluginStylesheet(plugin)

                    resolve();
                })

                setTimeout(() => {
                    if (!resolved) {
                        this.registerPluginList.delete(plugin.id) // Delete from loading list

                        if (plugin.mandatory) {
                            reject(plugin.id + " did not respond in time");
                        }
                        // plugin is not mandatory, resolve
                        console.warn(`Plugin ${plugin.id} did not respond, but marked as optional`)
                        resolve()
                    }
                }, 5000)
            })
        })

        const pluginsAppendPromise = this.appendPluginScripts(enabledPlugins)
        const allPromises = [...pluginsAppendPromise, ...pluginRegistered]
        return Promise.all(allPromises)
    }

    importPluginPackagesSortedByIndex() {

        let packages = sortBy(this.pluginPackages, [(pluginPackage) => {
            if (pluginPackage.pluginPackage.index === undefined) { // Undefined is a higher number than zero
                pluginPackage.pluginPackage.index = 0
            }
            return pluginPackage.pluginPackage.index;
        }])

        packages.forEach((pluginPackage) => {
            this.configurator.import(pluginPackage.pluginPackage, pluginPackage.pluginConfigObject)
        })
    }


    getConfigValue(obj, path, defaultValue) {

        var namePath,
            name,
            config = null;

        if (isString(obj)) {
            name = obj;
            namePath = name + '.data.' + path;
        }
        else if (obj.schema && obj.schema.name) {
            name = obj.schema.name;
            namePath = name + '.data.' + path;
            config = obj.config;
        }
        else {
            throw new Error('Either string or plugin object with config is mandatory to get config value');
        }

        // If no config object is give and not cached, then fetch value
        if (config === null || false === namePath in this.configurationCache) {
            return this._getValue(name, namePath, path, defaultValue, config);
        }

        return this.configurationCache[namePath];
    }


    getHandlerCommandsForFile(fileType) {  // eslint-disable-line no-unused-vars
        // TODO: get commands for file drop from configurator
        return []
    }

    /**
     * Get and cache requested config path from within plugins data section
     * @protected
     *
     * @param type Plugin name
     * @param typePath Fake path with type used to cache value
     * @param path JSON path to get
     * @param defaultValue Optional, default value to return if not set
     * @param If not null, config structure to use instead of plugin config array
     */
    _getValue(name, namePath, path, defaultValue, config) {
        var ptr = this.plugins;
        var keys = path.split('.');
        var value = 'undefined' === typeof(defaultValue) ? undefined : defaultValue;

        if (config) {
            ptr = config;
        }
        else {

            let pluginData = this.plugins.get(name)
            if (pluginData) {
                ptr = pluginData.data
                // console.log("", pluginData.data[path]);
            }
            // for (var i = 0; i < ptr.length; i++) {
            //     if (ptr[i].name === name) {
            //         ptr = ptr[i].data;
            //         break;
            //     }
            // }
        }

        if (!ptr) {
            return defaultValue;
        }

        defaultValue = value;
        for (var n = 0; n < keys.length; n++) {
            if (typeof(ptr[keys[n]]) === "undefined") {
                value = defaultValue;
                break;
            }

            value = ptr[keys[n]];
            ptr = ptr[keys[n]];
        }

        if (config === null) {
            this.configurationCache[namePath] = value;
        }

        return value;
    }

}

export default PluginManager