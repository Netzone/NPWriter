var fs = require('fs')
import sinon from 'sinon'
import {Component} from 'substance'
import NPWriterConfigurator from '../../../../writer/packages/npwriter/NPWriterConfigurator'
import AppPackage from '../../../../writer/AppPackage'

describe('Add Items to configuration', () => {

    let configurator
    beforeEach(() => {
        configurator = new NPWriterConfigurator().import(AppPackage)
    })

    it('Adds a validator to configuration', () => {
        expect(configurator.config.validators.length).toBe(0)
    })

    it('Adds a component to a given tab', () => {

        class dummyComponent extends Component {
        }

        configurator.addComponentToSidebarWithTabId('dummy', 'dummy', dummyComponent)
        expect(configurator.getSidebarPanels().length).toBe(1)
    })

    it('Only add one tabs even if plugins add more', () => {
        class dummyComponent extends Component {
        }
        expect(configurator.config.sidebarTabs.length).toBe(0)
        configurator.addSidebarTab('mytab', 'Tab1')
        configurator.addSidebarTab('mytab', 'Tab1')
        configurator.addSidebarTab('mytab', 'Tab1')
        expect(configurator.config.sidebarTabs.length).toBe(1)
    })

})

describe('Configurator handles load of the config file', () => {

    let configurator

    function getMockedResponseWithStatusCode(config, code) {
        return new window.Response(config, {
            status: code,
            headers: { 'Content-type': 'application/json'}
        });
    }

    function getConfigData() {
        return fs.readFileSync('data/writer.json', {encoding: 'UTF-8'})
    }

    afterEach(() => {
        window.fetch.restore();
    });

    beforeEach(() => {
        configurator = new NPWriterConfigurator().import(AppPackage)
        sinon.stub(window, 'fetch');
    })


    it('Loads Writer config file and stores in property', () => {
        var res = getMockedResponseWithStatusCode(getConfigData(), 200)
        window.fetch.returns(Promise.resolve(res));

        return configurator.loadConfigJSON('/api/config').then(() => {
            expect(configurator.config.writerConfigFile.plugins).not.toBe("hej")
            expect(configurator.config.writerConfigFile.newsItemTemplateId).toBe('dummyId')
        })
    })

    it('Can access newsItemTemplateId through method', () => {
        var res = getMockedResponseWithStatusCode(getConfigData(), 200)
        window.fetch.returns(Promise.resolve(res));

        return configurator.loadConfigJSON('/api/config').then(() => {
            expect(configurator.getNewsItemTemplateId()).toBe('dummyId')
        })
    })

    it('Fails to load config file', () => {
        var res = getMockedResponseWithStatusCode(getConfigData(), 404)
        window.fetch.returns(Promise.resolve(res));

        return configurator.loadConfigJSON('/api/config')
            .then(() => {
            })
            .catch(e => {
                expect(e.name).toEqual('Error')
                expect(e.response.status).toEqual(404)
            });
    })

})