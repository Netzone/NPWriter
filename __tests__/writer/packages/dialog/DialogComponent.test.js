import Helper from '../../../helpers'
import sinon from 'sinon'
import {Component} from 'substance'
import Api from '../../../../writer/api/Api'

class DummyDialogContent extends Component {

    constructor(...args) {
        super(...args)
    }

    didMount() {
    }

    onClose(action) {
        return true
    }

    render($$) {
        let el = $$('div').addClass('dummy-dialog-content')
        if (this.props.foo) {
            el.append($$('div').attr('id', this.props.foo))
        }
        el.append("My test dialog")

        return el
    }
}

describe('Open a modal window', () => {

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
        app = App.mount({configurator: configurator}, document.body)
    })

    afterEach(() => {
        document.body.innerHTML = '<div></div>';
        app = null
        App = null
        xhr.restore();
    })


    test('It can open a modal window through the API', () => {
        api.ui.showDialog(DummyDialogContent, {}, {})

        const body = document.body
        expect(body.querySelectorAll('.modal').length).toBe(1)
        expect(body.querySelectorAll('.dummy-dialog-content').length).toBe(1)
        const dialogContent = body.querySelector('.dummy-dialog-content')
        expect(dialogContent.textContent).toBe('My test dialog')
    })


    test('It can open modal with passed in props', () => {
        api.ui.showDialog(DummyDialogContent, {foo: 'bar'}, {})
        const body = document.body
        expect(body.querySelector('#bar').getAttribute('id')).toBe('bar')
    })


    test('It can add primary button with onClose called with save action', () => {

        var callback = sinon.spy();

        class Dialog extends DummyDialogContent {
            onClose(action) {
                if (action === 'save') {
                    callback()
                }
                return true
            }
        }

        api.ui.showDialog(Dialog, {}, {primary: "Go"})
        const body = document.body
        const primaryButton = body.querySelectorAll('.btn-primary')[0]

        expect(body.querySelectorAll('.btn-primary').length).toBe(1)

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        primaryButton.dispatchEvent(evt);

        expect(callback.called).toBe(true)
        expect(body.querySelectorAll('.btn-primary').length).toBe(0)
    })


    /**
     * Test so we can add attribute disabled by sending actions
     */
    test('It can disable primary button with actions', () => {

        class Dialog extends DummyDialogContent {
            didMount() {
                this.send('dialog:disablePrimaryBtn')
            }
        }

        api.ui.showDialog(Dialog, {}, {primary: "Go"})
        const body = document.body

        const primaryButton = body.querySelectorAll('.btn-primary')[0]
        expect(primaryButton.getAttribute('disabled')).toBe('true')
    })

    /**
     * Test so we can set a custom label on primary button
     */
    test('It can add button with custom label', () => {
        api.ui.showDialog(DummyDialogContent, {}, {primary: "TestString"})
        const body = document.body

        const primaryButton = body.querySelectorAll('.btn-primary')[0]
        expect(primaryButton.textContent).toBe('TestString')
    })


    test('It adds a title if provided', () => {
        api.ui.showDialog(DummyDialogContent, {}, {title: "My Title"})
        const body = document.body

        expect(body.querySelector('.modal-header').getAttribute('class')).toBe('modal-header')
        expect(body.querySelector('.modal-header > h2').textContent).toBe('My Title')
    })


    test('It does NOT add a title', () => {
        api.ui.showDialog(DummyDialogContent, {}, {})
        const body = document.body

        expect(body.querySelector('.modal-header')).toBe(null)
    })

    test('It adds a custom css class to modal container', () => {
        api.ui.showDialog(DummyDialogContent, {}, {cssClass: 'my-modal'})
        const body = document.body

        expect(body.querySelectorAll('.my-modal').length).toBe(1)
    })


    test('It can add secondary button and onClose called with cancel action', () => {
        var callback = sinon.spy();

        class Dialog extends DummyDialogContent {
            onClose(action) {
                if (action === 'cancel') {
                    callback()
                }
                return true
            }
        }

        api.ui.showDialog(Dialog, {}, {secondary: "Cancel"})
        const body = document.body

        const primaryButton = body.querySelectorAll('.modal-content .btn-secondary')[0]

        expect(body.querySelectorAll('.modal-content .btn-secondary').length).toBe(1)

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        primaryButton.dispatchEvent(evt);

        expect(callback.called).toBe(true)
        expect(body.querySelectorAll('.modal-content .btn-secondary').length).toBe(0)
    })


    test('It can add a single tertiary button with callback', () => {

        const callback = jest.fn()
        const button = [{
            caption: "Third",
            callback: () => {
                callback()
                return true;
            }
        }]

        api.ui.showDialog(DummyDialogContent, {}, {tertiary: button})
        const body = document.body
        const tertiaryButton = body.querySelectorAll('.modal-content  .btn-tertiary')[0]

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        tertiaryButton.dispatchEvent(evt);

        expect(tertiaryButton.textContent).toBe('Third')
        expect(tertiaryButton).not.toBe(null)
        expect(callback).toHaveBeenCalled()

    })


    test('It can add multiple tertiary button with callbacks', () => {
        const sinonCallback = sinon.spy()
        const sinonSecondCallback = sinon.spy()

        const buttons = [{
            caption: "Third",
            callback: () => {
                sinonCallback()
                return true;
            }
        },
            {
                caption: "Fourth",
                callback: () => {
                    sinonSecondCallback()
                    return true;
                }
            }]

        api.ui.showDialog(DummyDialogContent, {}, {tertiary: buttons})
        const body = document.body
        const tertiaryButtons = body.querySelectorAll('.btn-tertiary')

        expect(tertiaryButtons.length).toBe(2)

        const firstTertiaryButton = tertiaryButtons[0]
        const secondTertiaryButton = tertiaryButtons[1]

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        firstTertiaryButton.dispatchEvent(evt);

        var secondevt = document.createEvent('MouseEvents');
        secondevt.initEvent('click', true, false);
        secondTertiaryButton.dispatchEvent(secondevt);

        expect(secondTertiaryButton.textContent).toBe('Fourth')
        expect(sinonCallback.called).toBe(true)
        expect(sinonSecondCallback.called).toBe(true)

        // The modal should been closed
        expect(body.querySelectorAll('.dummy-dialog-content').length).toBe(0)
    })
})


describe('Open a dialog with messages', () => {

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
        app = App.mount({configurator: configurator}, document.body)
    })

    afterEach(() => {
        document.body.innerHTML = '<div></div>';
        xhr.restore();
    })

    it('Opens a messageDialog', () => {
        api.ui.showMessageDialog([], () => {
        }, () => {
        })

        const body = document.body
        expect(body.querySelectorAll('.modal').length).toBe(1)
        expect(body.querySelectorAll('.modal-messages').length).toBe(1)
    })


    it('Opens a messageDialog', () => {

        const messages = [
            {
                "type": "info",
                "message": "This is an info message"
            },
            {
                "type": "warning",
                "message": "This is a warning message"
            },
            {
                "type": "error",
                "message": "This is an error message"
            }
        ]

        api.ui.showMessageDialog(messages, () => {
        }, () => {
        })

        const body = document.body
        expect(body.querySelectorAll('.modal').length).toBe(1)

        expect(body.querySelectorAll('.modal-messages').length).toBe(1)
        expect(body.querySelectorAll('ul.info').length).toBe(1)
        expect(body.querySelectorAll('ul.warning').length).toBe(1)
        expect(body.querySelectorAll('ul.error').length).toBe(1)

        let first = body.querySelectorAll('ul.error')[0].children[0].nodeName

        expect(first = body.querySelectorAll('ul.info')[0].children[0].nodeName).toBe('LI')
        expect(first = body.querySelectorAll('ul.info')[0].children[0].textContent).toBe('This is an info message')

        expect(first = body.querySelectorAll('ul.warning')[0].children[0].nodeName).toBe('LI')
        expect(first = body.querySelectorAll('ul.warning')[0].children[0].textContent).toBe('This is a warning message')

        expect(first = body.querySelectorAll('ul.error')[0].children[0].nodeName).toBe('LI')
        expect(first = body.querySelectorAll('ul.error')[0].children[0].textContent).toBe('This is an error message')

    })


    /**
     * When showing messages with an error message should result in just primary button showing with label Cancel
     * And click should result in calling cancel callback
     */
    it('Opens message dialog and with error message calling callback functions properly', () => {

        let primaryCallback = sinon.spy()
        let cancelCallback = sinon.spy()

        const messages = [
            {
                "type": "error",
                "message": "This is an error message"
            }
        ]

        api.ui.showMessageDialog(messages, primaryCallback, cancelCallback)

        const body = document.body
        const button = body.querySelectorAll('.modal-content .btn-primary')[0]

        expect(body.querySelectorAll('.btn-primary').length).toBe(1)
        expect(button.textContent).toBe('Cancel')

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        button.dispatchEvent(evt);

        expect(primaryCallback.called).toBe(false)
        expect(cancelCallback.called).toBe(true)
    })

    /**
     * When showing messages with an warning message should result in both buttons is showing
     * And click on primary should result in cancel
     * Click on secondary should result in primary
     */
    it('Opens message dialog and with warning message calling callback functions properly', () => {

        let primaryCallback = sinon.spy()
        let cancelCallback = sinon.spy()

        const messages = [
            {
                "type": "warning",
                "message": "This is an warning message"
            }
        ]

        api.ui.showMessageDialog(messages, primaryCallback, cancelCallback)

        const body = document.body
        const button = body.querySelectorAll('.modal-content .btn-primary')[0]
        const secondary = body.querySelectorAll('.modal-content .btn-secondary')[0]

        expect(body.querySelectorAll('.modal-content .btn-primary').length).toBe(1)
        expect(body.querySelectorAll('.modal-content .btn-secondary').length).toBe(1)

        expect(button.textContent).toBe('Cancel')
        expect(secondary.textContent).toBe('Continue')

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        button.dispatchEvent(evt);

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        secondary.dispatchEvent(evt);


        expect(primaryCallback.called).toBe(true)
        expect(cancelCallback.called).toBe(true)
    })

    /**
     * When showing messages with an warning message should result in both buttons is showing
     * And click on primary should result in cancel
     * Click on secondary should result in primary
     */
    it('Opens message dialog and with info message calling callback functions properly', () => {

        let primaryCallback = sinon.spy()
        let cancelCallback = sinon.spy()

        const messages = [
            {
                "type": "info",
                "message": "This is an warning message"
            }
        ]

        api.ui.showMessageDialog(messages, primaryCallback, cancelCallback)

        const body = document.body
        const button = body.querySelectorAll('.modal-content .btn-primary')[0]
        const secondary = body.querySelectorAll('.modal-content .btn-secondary')[0]

        expect(body.querySelectorAll('.modal-content .btn-primary').length).toBe(1)
        expect(body.querySelectorAll('.modal-content .btn-secondary').length).toBe(1)

        expect(button.textContent).toBe('Continue')
        expect(secondary.textContent).toBe('Cancel')

        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        secondary.dispatchEvent(evt);

        expect(primaryCallback.called).toBe(true)
    })


})