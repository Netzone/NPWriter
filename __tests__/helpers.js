var fs = require('fs');
import {Component, EditorSession} from 'substance'
import Api from '../writer/api/Api'
import UnsupportedPackage from '../writer/packages/unsupported/UnsupportedPackage'
import NPWriterCompontent from '../writer/packages/npwriter/NPWriterComponent'
import NPWriterConfigurator from '../writer/packages/npwriter/NPWriterConfigurator'
import AppPackage from '../writer/AppPackage'
import {ParagraphPackage} from 'substance'
class Helper {

    static getContentFromExampleDocument() {
        return fs.readFileSync('data/newsitem-test.xml', {encoding: 'UTF-8'})
    }

    static getParsedExampleDocument() {
        let contents = Helper.getContentFromExampleDocument()
        var parser = new DOMParser();
        return parser.parseFromString(contents, "application/xml")
    }

    static getConfigurator() {
        const configurator = new NPWriterConfigurator().import(AppPackage)
        configurator.import(ParagraphPackage)
        configurator.import(UnsupportedPackage)

        return configurator

    }

    static getApp(api) {

        /*
         Mock the window crypto function
         */
        window.crypto = {
            getRandomValues: function(seed) {
                seed.map((int, idx, array) => {
                    array[idx] = Math.ceil(Math.random()*100);
                });
            }
        }


        class App extends Component {



            getChildContext() {
                return Object.assign({}, {
                    configurator: this.props.configurator,
                    api: api
                });
            }

            render($$) {
                // MOCK
                window.document.createRange = () => {}


                // this.props.configurator.import(UnsupportedPackage)
                var importer = this.props.configurator.createImporter('newsml')
                const idfDocument = importer.importDocument(Helper.getContentFromExampleDocument())

                let editorSession = new EditorSession(idfDocument, {
                    configurator: this.props.configurator,
                    lang: "sv_SE",
                    context: {
                        api: api
                    }
                })

                let writer = $$(NPWriterCompontent, {
                    editorSession: editorSession,
                    configurator: this.props.configurator,
                    api: api
                }).ref('writer')

                return $$('div').attr('id', 'main').ref('app').append(writer)
            }

        }
        return App
    }

    static getLocalStorageMock() {
        return class MockStorage {
            constructor () {
                this.storage = new Map();
            }
            setItem (key, value) {


                this.storage.set(key, value);
            }
            getItem (key) {
                return this.storage.get(key);
            }
            removeItem (key) {
                this.storage.delete(key);
            }
            clear () {
                this.constructor();
            }
        }
    }

}
export default Helper


it('is a helper', () => {

})