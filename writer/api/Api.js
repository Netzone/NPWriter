import jxon from 'jxon'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'

import Events from './Events'
import Document from './Document'
import NewsItem from './NewsItem'
import Exceptions from './Exceptions'
import Upload from './Upload'
import Article from './Article'
import Browser from './Browser'
import Router from './Router'
import Concept from './Concept'
import Ui from './Ui'
import History from './History'

jxon.config({
    autoDate: false,
    parseValues: false
});

/**
 * @class Api base class
 */
class Api {

    constructor(pluginManager, configurator, apiManager) {
        this.pluginManager = pluginManager
        this.eventListeners = []

        this.document = new Document(this)
        this.newsItem = new NewsItem(this)
        this.events = new Events()
        this.router = new Router()
        this.article = new Article(this)
        this.browser = new Browser(this)
        this.ui = new Ui(this)
        this.upload = new Upload(this)
        this.exceptions = Exceptions
        this.configurator = configurator
        this.concept = Concept
        this.apiManager = apiManager
        this.history = new History(this)
    }

    /**
     * Initialize api and provide it with the current newsItem.
     *
     * @param newsItemArticle
     * @param editorSession
     * @param {object} refs A reference to Writer Controller
     */

    init(newsItemArticle, editorSession, refs) {
        this.newsItemArticle = newsItemArticle
        this.editorSession = editorSession
        this.doc = editorSession.getDocument()
        this.refs = refs
    }

    setWriterReference(writer) {
        this.refs.writer = writer //TODO: Check if we can remove this and just use Writer
        this.writer = writer
    }

    setAppReference(app) {
        this.app = app
    }

    /**
     * Get configuration value in a plugins local configuration data section.
     *
     * @example
     * {
     *    "vendor": "vendor.tld",
     *    "name": "myplugin",
     *    "enabled": true,
     *    "data": {
     *      "mykey": "Configuration value"
     *    }
     *  },
     * @example
     * var apiEndpoint = this.context.api.getConfigValue('myplugin', 'mykey');`
     *
     * @param {string} name Plugin name to fetch configuration value for
     * @param {string} path Configuration path in the data section
     * @param {*} defaultValue Default value if no value is found
     * @return {*} The value of the wanted configuration path or default value
     */
    getConfigValue(name, path, defaultValue) {
        return this.pluginManager.getConfigValue(name, path, defaultValue);
    }

    getLabel(name) {
        var labelProvider = this.configurator.labelProvider
        if (!labelProvider) { throw new Error('Missing labelProvider.') }
        return labelProvider.getLabel(name)
    }

    /**
     * Make a call to a named external backend using provided call configuration.
     *
     * Call configuration properties:
     *  method - Http method used to call backend. Default is GET.
     *  contentType - Set contentType of data to send to backend. Default application/json.
     *  headers - Object with extra http headers in backend call {"headername" : "headervalue"}.
     *  path - Virtual path, endpoint, in backend. Defaults to "/".
     *  query - Http query parameters as object. {"param1": "value1", "param2", "value1"}.
     *  body - Object or text with body data to send with the request to backend.
     *
     * @param {string} name
     * @param {object} config
     */
    call(name, config) {
        var op = {
            method: 'get',
            contentType: 'application/json',
            headers: {},
            path: '/',
            query: {},
            body: null
        };

        if (/[^a-zA-Z0-9]/.test(name)) {
            throw new Error('Backend name must be alphanumeric');
        }

        if (isPlainObject(config)) {
            // HTTP METHOD
            if (isString(config.method) && ['get', 'post', 'put', 'delete'].includes(config.method.toLowerCase())) {
                op.method = config.method.toLowerCase();
            }

            // HTTP ContentType
            if (isString(config.contentType)) {
                op.contentType = config.contentType;
            }

            // Headers
            if (isPlainObject(config.headers)) {
                op.headers = config.headers;
            }

            // HTTP ContentType
            if (isString(config.path)) {
                op.path = config.path;
            }

            // Query parameters
            if (isPlainObject(config.query)) {
                op.query = config.query;
            }

            // Body content
            // TODO: Investigate arrays, numericals and other objects
            if (isPlainObject(config.body)) {
                op.body = btoa(JSON.stringify(config.body));
            }
            else if (isString(config.body)) {
                op.body = btoa(config.body);
            }
            else {
                console.warn('Payload not object or string. Payload ignored');
                op.body = null;
            }
        }


        return this.router.proxy('/api/external/' + name, op);
    }
}

export default Api
