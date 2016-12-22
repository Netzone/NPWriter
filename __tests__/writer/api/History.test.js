import Helper from '../../helpers'
import sinon from 'sinon'
import Api from '../../../writer/api/Api'

describe('Save history to local storage', () => {

    let xhr, requests, App, app, api
    beforeEach(() => {

        // Mock window.localstorage
        const localStorage = Helper.getLocalStorageMock()
        window.localStorage = new localStorage()

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

    it('localStorage is available', () => {
        var history = api.history
        expect(history.isAvailable()).toBe(true)
    })



})