import Helper from '../../../helpers'
import sinon from 'sinon'
import Api from '../../../../writer/api/Api'

describe('Add notifications', () => {

    let xhr, requests, App, app, api
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
        App.mount({configurator: configurator}, document.body)
    })

    afterEach(() => {
        document.body.innerHTML = '<div></div>';
        app = null
        App = null
        xhr.restore();
    })

    it('Adds and show a notification', () => {

        // Add an eventlistener
        let event = {
            title: "NoticationTitle",
            message: "NotificationMessage"
        }

        api.ui.showNotification('test', event.title, event.message)

        const body = document.body

        let notificationDom = body.querySelectorAll('.imc-visible')[0]
        let title = body.querySelectorAll('.imc-notification strong')[0]
        let message = body.querySelectorAll('.imc-notification span')[0]

        expect(title.textContent).toBe(event.title)
        expect(message.textContent).toBe(event.message)


    })
})