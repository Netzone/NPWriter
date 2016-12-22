import Api from '../../../writer/api/Api'
import NPWriterConfigurator from '../../../writer/packages/npwriter/NPWriterConfigurator'
import PluginManager from '../../../writer/utils/PluginManager'
import sinon from 'sinon'
import Event from '../../../writer/utils/Event'
import APIManager from '../../../writer/api/APIManager'

describe('Get config values for plugins', () => {

    let api, pluginManager

    beforeEach(() => {
        var configuratorPackage = { configure: () => { }}
        const configurator = new NPWriterConfigurator().import(configuratorPackage);
        pluginManager = new PluginManager(configurator, new APIManager());

        api = new Api(pluginManager, configurator)
    })


    it('Adds an event listener', () => {
        expect(api.events.eventListeners.length).toBe(0)
        api.events.on('dummy', 'test:Executed', () => {})
        expect(api.events.eventListeners.length).toBe(1)
    })


    it('Removes an event listener', () => {
        api.events.on('dummy', 'test:Executed', () => {})
        expect(api.events.eventListeners.length).toBe(1)
        api.events.off('dummy', 'test:Executed')
        expect(api.events.eventListeners.length).toBe(0)
    })


    it('Triggers an event', () => {
        var callback = sinon.spy();

        api.events.on('dummy', 'test:Executed', callback)
        expect(api.events.eventListeners.length).toBe(1)

        api.events.triggerEvent('_', 'test:Executed', {})

        expect(callback.called).toBe(true)
    })


    it('It registers and Triggers documentChanged', () => {
        var callback = sinon.spy();
        api.events.on('dummy', Event.DOCUMENT_CHANGED, callback)
        api.events.documentChanged(null, {})
        expect(callback.called).toBe(true)

    })


    it('Does not add two listeners for smae name on same event', () => {
        api.events.on('dummy', Event.DOCUMENT_CHANGED, () => {})
        expect(api.events.eventListeners.length).toBe(1)
        api.events.on('dummy', Event.DOCUMENT_CHANGED, () => {})
        expect(api.events.eventListeners.length).toBe(1)
    })

})
