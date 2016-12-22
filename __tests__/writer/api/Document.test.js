import 'whatwg-fetch'
import Api from '../../../writer/api/Api'
import {EditorSession, ContainerEditor, Component} from 'substance'
import {SurfaceManager} from 'substance'
import NPWriterConfigurator from '../../../writer/packages/npwriter/NPWriterConfigurator'
import AppPackage from '../../../writer/AppPackage'
import UnsupportedPackage from '../../../writer/packages/unsupported/UnsupportedPackage'
import Helper from '../../helpers'
import sinon from 'sinon'

var fs = require('fs');


describe('Loads newsItem', () => {

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


    it('Gets a list of document nodes from document', () => {
        let nodes = api.editorSession.getDocument().getNodes()['body'].nodes;
        expect(nodes.length).toBe(4)
    })

    /*
     it('Can insert a node', () => {

     //@TODO: Implement test of inserting nodes
     const node = {
     id: 'randomID',
     type: 'object',
     data: {
     foo: 'bar'
     }
     }
     api.document.insertBlockNode('dummy', node)

     })
     */

})
