import 'whatwg-fetch'
import Api from '../../../writer/api/Api'
import {EditorSession, SurfaceManager} from 'substance'
import NPWriterConfigurator from '../../../writer/packages/npwriter/NPWriterConfigurator'
import AppPackage from '../../../writer/AppPackage'
import UnsupportedPackage from '../../../writer/packages/unsupported/UnsupportedPackage'
import Helper from '../../helpers'
import sinon from 'sinon'
import isObject from 'lodash/isObject'

describe('Router helper methods', () => {
    let api,
        xhr,
        requests,
        refs = {
            writer: {}
        }


    afterEach(() => {
        xhr.restore();
    })

    beforeEach(() => {

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };


        const configurator = new NPWriterConfigurator().import(AppPackage);
        api = new Api({}, configurator)

        let newsItem = Helper.getParsedExampleDocument()

        configurator.import(UnsupportedPackage)

        var importer = configurator.createImporter('newsml', { api: api })
        let idfDocument = importer.importDocument(Helper.getContentFromExampleDocument())
        let editorSession = new EditorSession(idfDocument, {
            configurator: configurator,
            lang: "sv_SE",
            context: {
                api: api
            }
        })

        api.init(newsItem, editorSession, refs)

    })


    it('Can create a querystring of paramaters', () => {
        const parameters = {
            url: 'http://google.com',
            user: 'dummy'
        }
        const router = api.router
        const url = router.getQuerystringFromParameters(parameters)

        expect(url).toBe('?url=http://google.com&user=dummy')

    })

    it('Doesn\'t convert a string', () => {
        const router = api.router
        const url = router.getQuerystringFromParameters("mystring")

        expect(url).toBe('mystring')

    })

  it('Can create a request object for method with headers', () => {
        const parameters = {
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': 1234
            }
        }
        const router = api.router
        const requestObject = router.getRequestPropertiesForMethod('get', parameters)

        expect(requestObject['method']).toBe('GET')
        expect(isObject(requestObject['headers'])).toBe(true)
        expect(requestObject['headers']['Content-Type']).toBe('application/json')
        expect(requestObject['headers']['Content-Length']).toBe(1234)

    })

    it('Doesn\'t convert a string', () => {
        const router = api.router
        const url = router.getQuerystringFromParameters("mystring")

        expect(url).toBe('mystring')

    })


})