var fs = require('fs')

import 'whatwg-fetch'
import Api from '../../../writer/api/Api'
import NPWriterConfigurator from '../../../writer/packages/npwriter/NPWriterConfigurator'
import PluginManager from '../../../writer/utils/PluginManager'
import Helper from '../../helpers'
import APIManager from '../../../writer/api/APIManager'

describe('Get config values for plugins', () => {

    let api, pluginManager

    beforeEach(() => {

        var configuratorPackage = { configure: () => { }}

        const configurator = new NPWriterConfigurator().import(configuratorPackage);
        pluginManager = new PluginManager(configurator, new APIManager());

        api = new Api(pluginManager, configurator)

        api.init(Helper.getParsedExampleDocument(), {getDocument:()=>{}}, {})
    })

    it('Sets the newsItem', () => {
        expect(api.newsItemArticle).not.toBe(null)
    })


    it('Gets correct values for data through the API', () => {
        const plugin = {
            id: 'se.infomaker.dummy',
            name: 'dummy',
            configure: () => {
            }
        }

        setTimeout(() => {
            pluginManager.registerPlugin(plugin)
        }, 100)

        const pluginList = fs.readFileSync('data/writer.json', {encoding: 'UTF-8'})
        return pluginManager.load(JSON.parse(pluginList).plugins).then((_) => {
            expect(api.getConfigValue('se.infomaker.dummy', 'foo')).toBe('bar')
        })

    })

})