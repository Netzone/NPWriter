import { Component, EditorSession } from 'substance'
import NPWriterConfigurator from '../../../../writer/packages/npwriter/NPWriterConfigurator'
import AppPackage from '../../../../writer/AppPackage'
import Api from '../../../../writer/api/Api'
import sinon from 'sinon'
import Helper from '../../../helpers'
import NPWriterCompontent from '../../../../writer/packages/npwriter/NPWriterComponent'

window.crypto = {
    getRandomValues: function(seed) {
        seed.map((int, idx, array) => {
            array[idx] = Math.ceil(Math.random()*100);
        });
    }
}
// MOCK
window.document.createRange = () => {}


describe('Start a Writer', () => {

    let xhr, requests, api, app, App
    beforeEach(() => {

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };
        let configurator = Helper.getConfigurator()
        api = new Api({}, configurator)
        api.init(Helper.getParsedExampleDocument(), {getDocument:()=>{}}, {}) // Mocking documentSession parameter

        App = Helper.getApp(api)
        app = App.mount({configurator: configurator}, document.body)

    })

    afterEach(() => {
        document.body.innerHTML = '<div></div>';
        app = null
        App = null
        xhr.restore();
    })

    it('Mounts a writer to document', () => {
        // var configurator = new NPWriterConfigurator().import(AppPackage)
        // App.mount({configurator: configurator}, document.body)

        expect(document.getElementById('main').nodeName).toBe('DIV')
        expect(document.getElementById('main').getAttribute('id')).toBe('main')
        expect(document.getElementsByClassName('sc-np-writer').length).toBe(1)


    })

})

