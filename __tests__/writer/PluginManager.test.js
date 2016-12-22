var fs = require('fs')
import sinon from 'sinon'
import PluginManager from '../../writer/utils/PluginManager'
import APIManager from '../../writer/api/APIManager'

const getConfigurator = () => {
    return {
        import: (data) => {
        }
    }
}

describe('validate and register plugin packages with pluginmanager', () => {
    let pluginManager

    beforeEach(() => {
        pluginManager = new PluginManager(getConfigurator(), new APIManager());
    })

    it('Register Plugin with faulty package results in error', () => {
        var register = () => {
            pluginManager.registerPlugin({})
        }
        expect(register).toThrowError(/Package/);
    })


    it('Failes when registering package without id', () => {
        const pluginPackage = {
            'name': 'dummy',
            'configure': () => {
            }
        }
        expect(pluginManager.validatePluginPackage(pluginPackage)).toBe(false)
    })


    it('Failes when registering package without name', () => {
        const pluginPackage = {
            'id': 'se.infomaker.dummy',
            'configure': () => {
            }
        }
        expect(pluginManager.validatePluginPackage(pluginPackage)).toBe(false)
    })


    it('Failes when registering package without configure method', () => {
        const pluginPackage = {
            'name': 'dummy',
            'id': 'se.infomaker.dummy'
        }
        expect(pluginManager.validatePluginPackage(pluginPackage)).toBe(false)
    })


    it('Failes when registering package configure method as string', () => {
        const pluginPackage = {
            'name': 'dummy',
            'id': 'se.infomaker.dummy',
            'configure': 'not_a_function'
        }
        expect(pluginManager.validatePluginPackage(pluginPackage)).toBe(false)
    })


    it('Registers package with id, name, and configure function', () => {
        const pluginPackage = {
            'name': 'dummy',
            'id': 'se.infomaker.dummy',
            'configure': () => {
            }
        }
        expect(pluginManager.validatePluginPackage(pluginPackage)).toBe(true)

    })


    it('Adds plugin register function to registerPluginList Map', () => {
        const plugins = [
            {
                id: 'se.infomaker.dummy',
                name: 'dummy',
                enabled: true,
                configure: () => {
                }
            }
        ]
        pluginManager.load(plugins)

        // Expect to have have register function
        expect(pluginManager.registerPluginList.size).toBe(1)

        // Expect to have a key in Map that's the same as plugin id
        expect(pluginManager.registerPluginList.has(plugins[0].id)).toBe(true)

        // Expect to be of type function
        var func = pluginManager.registerPluginList.get(plugins[0].id)
        expect(typeof func).toBe('function')

    })


    it('Calls register function and removes it from registerPluginList', () => {
        const plugins = [
            {
                id: 'se.infomaker.dummy',
                name: 'dummy',
                configure: () => {
                }
            }
        ]
        // Add a timeout before resolving the promise
        setTimeout(() => {
            pluginManager.registerPlugin(plugins[0])
        }, 300)

        return pluginManager.load(plugins)
            .then(data => expect(pluginManager.registerPluginList.size).toBe(0))
    })


    it('Adds plugin to list of registerd plugins', () => {
        const plugins = [
            {
                id: 'se.infomaker.dummy',
                name: 'dummy',
                enabled: true,
                configure: () => {
                }
            }
        ]
        // Add a timeout before resolving the promise
        setTimeout(() => {
            pluginManager.registerPlugin(plugins[0])
        }, 300)

        expect(pluginManager.plugins.size).toBe(0)

        return pluginManager.load(plugins)
            .then((data) => {
                expect(pluginManager.plugins.has(plugins[0].id)).toBe(true)
                expect(pluginManager.plugins.size).toBe(1)
            })
    })

})


// Using SinonJS to mock the fetch call
// https://rjzaworski.com/2015/06/testing-api-requests-from-window-fetch

describe('Load list of plugins', () => {

    let pluginManager

    afterEach(() => {
        window.fetch.restore();
    });

    beforeEach(() => {
        const plugins = fs.readFileSync('data/writer.json', {encoding: 'UTF-8'})
        sinon.stub(window, 'fetch');

        var res = new window.Response(plugins, {
            status: 200,
            headers: {
                'Content-type': 'application/json'
            }
        });

        window.fetch.returns(Promise.resolve(res));
        pluginManager = new PluginManager(getConfigurator(), new APIManager());
    })

    it('Loads a list of plugins from external source and returns JSON format', () => {
        return pluginManager.getListOfPlugins("sinon_is_intercepting").then((json) => {
            expect(json.length).toBe(1)
        })
    });


    it('Gets correct values for data attribute in plugins', () => {

        const plugins = [
            {
                id: 'se.infomaker.dummy',
                name: 'dummy',
                enabled: true,
                configure: () => {
                }
            }
        ]
        // Add a timeout before resolving the promise
        setTimeout(() => {
            pluginManager.registerPlugin(plugins[0])
        }, 100)

        const pluginList = fs.readFileSync('data/writer.json', {encoding: 'UTF-8'})
        return pluginManager.load(JSON.parse(pluginList).plugins).then((_) => {
            expect(pluginManager.getConfigValue('se.infomaker.dummy', 'foo')).toBe('bar')
        })

    })

})
