import './styles/app.scss'

import {Component, EditorSession, keys} from 'substance'
import NPWriterComponent from './packages/npwriter/NPWriterComponent'
import NPWriterConfigurator from './packages/npwriter/NPWriterConfigurator'
import AppPackage from './AppPackage'
import UnsupportedPackage from './packages/unsupported/UnsupportedPackage'
import PluginManager from './utils/PluginManager'
import API from './api/Api'
import Start from './packages/load-screens/Start'
import Error from './packages/load-screens/Error'
import SaveHandler from './packages/npwriter/SaveHandler'
import Event from './utils/Event'
import NilUUID from './utils/NilUUID'
import moment from 'moment'
import idGenerator from './utils/IdGenerator'
import APIManager from './api/APIManager'
import lodash from 'lodash'
import SourceComponent from './packages/dialog/SourceComponent'
import jxon from 'jxon'
import Validator from './packages/npwriter/Validator'
import NPWriterCommand from './packages/npwriter/NPWriterCommand'
import NPFileProxy from './packages/npwriter/NPFileProxy'
import uuidv5 from 'uuidv5'


import NPWriterAnnotationCommand from './packages/npwriter/NPWriterAnnotationCommand'

const STATUS_ISREADY = 'isReady',
    STATUS_LOADING = 'loading',
    STATUS_HAS_ERROR = 'hasErrors',
    HAS_DOCUMENT = 'writerHasDocument',
    HAS_NO_DOCUMENT = 'writerHasNoDocument'

class App extends Component {

    constructor(...args) {
        super(...args)

        this.pluginManager = null
        this.api = null

        this.handleActions({
            validate: () => {
                console.warn("Implement Validation")
            }, //this.validate
            save: () => {
                console.warn("Implement save action")
            }, //this.save,
            replacedoc: this.replaceDoc
        });

        console.info("Running writer in environment: ", process.env.NODE_ENV);
    }

    getInitialState() {
        return {
            status: STATUS_LOADING
        }
    }

    /**
     * A Dependency injection mechanism
     * Added objects is reachable from this.context in children
     * @returns {*}
     */
    getChildContext() {
        return Object.assign({}, {
            configurator: this.configurator,
            pluginManager: this.pluginManager,
            api: this.api
        });
    }


    /**
     * If no ID is available in browser hash,
     * check if there is a specified id in the config file
     *
     * @returns {string} hash
     * @throws Error
     */
    getHash() {
        let hash = this.api.browser.getHash();
        if (!hash) {
            if (this.configurator.getNewsItemTemplateId()) {
                hash = this.configurator.getNewsItemTemplateId()
            } else {
                throw new Error('No template was found')
            }
        }
        return hash
    }


    /**
     * Returns the saveHandler or create one if not created
     * @returns {SaveHandler}
     */
    getSaveHandler() {
        if (!this.saveHandler) {
            this.saveHandler = new SaveHandler({
                configurator: this.configurator,
                api: this.api
            })
        }
        return this.saveHandler
    }

    didMount() {

        document.onkeydown = this.handleApplicationKeyCombos.bind(this)

        this.configurator = new NPWriterConfigurator().import(AppPackage)

        this.APIManager = new APIManager()

        this.pluginManager = new PluginManager(this.configurator, this.APIManager)
        this.api = new API(this.pluginManager, this.configurator, this.APIManager)
        const api = this.api

        api.setAppReference(this)

        // Expose classes and endpoint on window.writer
        api.apiManager.expose('api', this.api)
        api.apiManager.expose('NilUUID', NilUUID)
        api.apiManager.expose('event', Event) // Expose the API on the window
        api.apiManager.expose('moment', moment) // Expose moment.js on window
        api.apiManager.expose('idGenerator', idGenerator) // Expose the ID Generator helper method
        api.apiManager.expose('lodash', lodash) // Expose the ID Generator helper method
        api.apiManager.expose('jxon', jxon) // Expose JXON library
        api.apiManager.expose('uuidv5', uuidv5) // Expose a UUID V5 library

        api.apiManager.expose('NPFileProxy', NPFileProxy) // Expose NPFileProxy base class
        api.apiManager.expose('Validator', Validator) // Expose the validator base class
        api.apiManager.expose('WriterCommand', NPWriterCommand) // The NPWriter base class for commands containg commandState method
        api.apiManager.expose('NPWriterAnnotationCommand', NPWriterAnnotationCommand) // Expose NPWriterAnnotationCommand base class

        var promise = this.configurator.loadConfigJSON('/api/config')                     // Load config file and store it in configurator
            .then(() => this.configurator.config.writerConfigFile.plugins)  // Get the plugins section from config (stored in the configurator)
            .then(plugins => this.pluginManager.load(plugins))              // Let the pluginManger load and append the plugins
            .then(() => {

                this.pluginManager.importPluginPackagesSortedByIndex()


                var promise = api.router.get('/api/newsitem/' + this.getHash(), {imType: 'x-im/article'}) // Make request to fetch article
                    .then(response => api.router.checkForOKStatus(response))                // Check if the status is between 200 and 300
                    .then(response => api.router.handleEtag(response, this.getHash()))      // "Save" ETag from response (used for update)
                    .then(response => response.text())                                      // Gets the text/xml in the response
                    .then((xmlStr) => {

                        this.addDefaultConfiguratorComponent()

                        var result = api.newsItem.setSource(xmlStr, {});

                        // Locale for moment
                        moment.locale(this.configurator.config.writerConfigFile.language)

                        this.replaceDoc(result);

                        // Clear guid if hash is empty
                        if (!api.browser.getHash()) {
                            api.newsItem.setGuid(null);
                            api.newsItem.removeDocumentURI();
                        }

                        this.setState({
                            status: STATUS_ISREADY
                        })
                    })

                // Don't catch errors during development as we loose the stacktrace
                if (process.env && process.env.NODE_ENV === 'production') {
                    promise.catch(this.handleError.bind(this));
                }
            })

        // Don't catch errors during development as we loose the stacktrace
        if (process.env && process.env.NODE_ENV === 'production') {
            promise.catch(this.handleError.bind(this));
        }

    }


    /**
     * Handles errors from for instance plugin loading
     * @param error
     */
    handleError(error) {
        this.setState({
            status: STATUS_HAS_ERROR,
            statusMessage: error
        })
    }

    handleApplicationKeyCombos(e) {
        let handled = false;
        if (e.keyCode === 83 && (e.metaKey || e.ctrlKey)) { // Save: cmd+s
            this.api.events.userActionSave()
            handled = true;
        } else if (e.keyCode === 85 && (e.metaKey || e.ctrlKey) && !e.altKey) {
            const xml = this.getSaveHandler().getExportedDocument()
            this.api.ui.showDialog(SourceComponent, {message: xml}, {
                title: 'Source',
                primary: 'Ok',
                secondary: false,
                takeover: true
            })

            handled = true;
        } else if (e.keyCode === keys.ESCAPE) {
            this.api.events.triggerEvent('__internal', Event.USERACTION_KEY_ENTER, {})
        } else if (e.keyCode === keys.ENTER) {
            this.api.events.triggerEvent('__internal', Event.USERACTION_KEY_ENTER, {})
        }

        if (handled) {
            e.preventDefault()
            e.stopPropagation()
        }

    }

    /**
     * Replace changes the current newsItem and creates and replaces the document session and then rerenders the writer
     * @param newsItem
     * @param idfDocument
     */
    replaceDoc({newsItemArticle, idfDocument}) {

        this.newsItemArticle = newsItemArticle
        if (this.editorSession) this.editorSession.dispose()
        this.saveHandler = null

        this.editorSession = new EditorSession(idfDocument, {
            configurator: this.configurator,
            lang: this.configurator.config.writerConfigFile.language,
            context: {
                api: this.api
            }
        })
        this.api.editorSession = this.editorSession

        this.editorSession.saveHandler = this.getSaveHandler()
        this.api.init(newsItemArticle, this.editorSession, this.refs)
        // Rerender from scratch
        // NOTE: emptying the component here makes sure that no component survives connected to the old document

        if (this.refs.writer) { // First load we have to reference to writer so we know it's the initial load
            this.api.document._setDocumentStatus(HAS_DOCUMENT)
        } else {
            this.api.document._setDocumentStatus(HAS_NO_DOCUMENT)
        }
        this.empty()
        this.rerender()
    }

    setTemporaryId() {
        if (!this.temporaryArticleID) {
            this.temporaryArticleID = idGenerator();
        }
    }

    render($$) {
        var el = $$('div').addClass('sc-app').ref('app')
        switch (this.state.status) {

            case STATUS_HAS_ERROR:
                el.append($$(Error, {error: this.state.statusMessage, getLabel: this.getLabel.bind(this)}))
                break

            case STATUS_ISREADY:

                if (!this.api.browser.getHash()) {
                    this.setTemporaryId();
                }

                el.append($$(NPWriterComponent, {
                    pluginManager: this.pluginManager,
                    editorSession: this.editorSession,
                    configurator: this.configurator,
                    api: this.api
                }).ref('writer'))
                break

            case STATUS_LOADING:
            default:
                el.append($$(Start, {}))
        }
        return el
    }


    getLabel(label) {
        const labelLanguage = this.configurator.config.writerConfigFile.labelLanguage
        if (labelLanguage) {
            if (this.configurator.config.labels[labelLanguage][label]) {
                label = this.configurator.config.labels[labelLanguage][label]
            }
        }

        return label
    }
    /**
     * Adds a couple of defaults component to our configurator
     */
    addDefaultConfiguratorComponent() {
        // Adds package for unsupported elements in document
        this.configurator.import(UnsupportedPackage)

        // This is a HACK to get labels for the metadata tab
        // The API and LabelProvider is not quite finished in this situation
        // So the read directly from the labels property in the configurator



        this.configurator.addSidebarTab('main', this.getLabel('Meta'))

    }
}

export default App

window.onload = () => {
// /
    // if(window.PRODUCTION) {
    //     if('serviceWorker' in navigator) {
    //         navigator.serviceWorker.register('serviceworker.js')
    //             .then(() => {
    //                 console.log("Registration done");
    //                 showNotification()
    //             })
    //             .catch((error) => {
    //                 console.log("Registrsation of serviceworker failed")
    //             })
    //     }
    // }


    //
    /*    function showNotification() {
     Notification.requestPermission(function (result) {
     if (result === 'granted') {
     navigator.serviceWorker.ready.then(function (registration) {
     registration.showNotification('Service worker is installed and ready to use');
     });
     }
     });
     }
     */
    App.mount({}, document.body)
}
