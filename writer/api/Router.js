import 'whatwg-fetch'
import isObject from 'lodash/isObject'

/**
 * @class Api.Router
 *
 * Router api class with functions for communication with the backend.
 * All router functions are available through the context.api.router object.
 */
class Router {

    /**
     * Creates a querystring from an object, starting with a ?
     * If a string is passed as parameter i will just be returned
     *
     * @note If parameters contains 'headers' it will not be added to the querystring
     *
     * @param {object} parameters
     * @returns {string}
     */
    getQuerystringFromParameters(parameters) {
        if (!parameters) return ''
        if (!isObject(parameters)) return parameters

        if (isObject(parameters)) {
            let query = []

            for (const name in parameters) {
                if (name !== 'headers' && name !== 'body') { // Dont add the headers key to the querystring
                    query.push(name + '=' + encodeURIComponent(parameters[name]));
                }
            }

            return query.length === 0 ? '' : '?' + query.join('&')
        }

        throw new Error('Could not convert parameters of type', typeof parameters)
    }


    /**
     *
     * @param {string} method - GET, POST, PUT, DELETE, HEAD
     * @param {object} parameters Object containing a headers-property
     * @returns {{method: string}}
     */
    getRequestPropertiesForMethod(method, parameters) {

        let requestProperties = {
            method: method.toUpperCase()
        }

        // If headers is sent pass them
        if (parameters && parameters.headers) {
            requestProperties['headers'] = parameters.headers
        }

        // Add a body if there is one provided
        if (parameters && parameters.body) {
            requestProperties['body'] = parameters.body
        }

        if (!parameters || !parameters.credentials) {
            requestProperties['credentials'] = 'same-origin'
        }

        return requestProperties
    }

    /**
     * Post a binary file object to the backend
     *
     * @param {string} path
     * @param {object} file File object from file input or file drop
     * @param {Function} onProgress Callback function for progress event
     * @param {Function} onLoad Callback function for onload event
     */
    postBinary(path, file, onProgress, onLoad, onError, params) {
        var xhr = new XMLHttpRequest(); //jshint ignore:line

        xhr.onload = onLoad;
        xhr.onError = onError;
        xhr.addEventListener('progress', onProgress);

        xhr.open('POST', path, true);

        xhr.setRequestHeader("x-infomaker-type", params.imType);
        xhr.setRequestHeader("content-type", file.type);
        xhr.setRequestHeader("x-filename", encodeURIComponent(file.name));
        xhr.send(file);
    }

    /**
     * Post data to specified backend endpoint
     *
     * @param {string} path
     * @param {object} parameters
     *
     * @return {object} jQuery ajax object
     */
    post(path, parameters) {
        let url = this.getEndpoint() + path + this.getQuerystringFromParameters(parameters)
        let requestProperties = this.getRequestPropertiesForMethod('POST', parameters)
        return fetch(url, requestProperties)

    }

    /**
     * Put data to specified backend endpoint
     *
     * @param {string} path
     * @param {object} parameters
     *
     * @return {object} jQuery ajax object
     */
    put(path, parameters) {
        let url = this.getEndpoint() + path + this.getQuerystringFromParameters(parameters)
        let requestProperties = this.getRequestPropertiesForMethod('PUT', parameters)
        return fetch(url, requestProperties)

    }

    /**
     * Get data from specified backend endpoint
     *
     *
     *
     * @param {string} path
     * @param {object} parameters - Could contain headers that will be passed along parameters.headers
     *
     * @return {promise} window fetch promise
     *
     * @example
     * this.context.api.router.get('/api/image/url/' + uuid)
     *     .done(function (url) {
 *         // Handle url
 *     }.bind(this))
     *     .error(function (error, xhr, text) {
 *         console.error(error, xhr, text);
 *     }.bind(this));
     */
    get(path, parameters) {
        let url = this.getEndpoint() + path + this.getQuerystringFromParameters(parameters)
        let requestProperties = this.getRequestPropertiesForMethod('GET', parameters)

        return fetch(url, requestProperties)
    }

    del(path, parameters) {
        let url = this.getEndpoint() + path + this.getQuerystringFromParameters(parameters)
        let requestProperties = this.getRequestPropertiesForMethod('DELETE', parameters)

        return fetch(url, requestProperties)
    }


    /**
     * Return api backend url
     * @todo Specify api endpoint in config file
     *
     * @return {string}
     */
    getEndpoint() {
        var location = window.location;
        return location.protocol + "//" + location.hostname + ":" + location.port;
    }


    /**
     * Proxy ajax call to external backend
     *
     * @param {string} path
     * @param {object} op
     *
     * @return {object} jQuery ajax object
     */
    proxy(path, op) {
        var url = this.getEndpoint();

        if (typeof(path) !== 'undefined') {
            url += path;
        }

        return $.ajax({
            method: 'post',
            dataType: 'text',
            url: url,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(op)
        });
    }

    _getItem(uuid, imType) {
        return this.get('/api/newsitem/' + uuid, {imType: imType, headers: {'Content-Type': 'text/xml'}}, null)
            .then(response => this.checkForOKStatus(response))
            .then(response => response.text())
            .then(text => {
                const parser = new DOMParser()
                return parser.parseFromString(text, 'text/xml')
            })
    }

    /**
     * Fetch a ConceptItem from the backend
     * @param id The id of the concept
     * @param imType The x-im/type
     * @return {*}
     */
    getConceptItem(id, imType) {
        return this._getItem(id, imType)
    }

    /**
     * Fetch a NewsItem from the backend
     * @param id The id of the news item
     * @param imType The x-im/type
     * @return {*}
     */
    getNewsItem(id, imType) {
        return this._getItem(id, imType)
    }


    /**
     * Updates a Concept Item
     * @param id The ID of the Concept Item to update
     * @param concept The updated XML
     * @return A promise with no data
     */
    updateConceptItem(id, concept) {
        return this.put('/api/newsitem/' + id, {body: concept})
            .then(response => this.checkForOKStatus(response))
    }

    /**
     * Creates a Concept Item
     * @param concept The concept to create
     * @return {*|Promise.<TResult>} containing the resulting UUID
     */
    createConceptItem(concept) {
        return this.post('/api/newsitem', {body: concept})
            .then(response => this.checkForOKStatus(response))
            .then(response => response.text())
    }

    /**
     * Method checks for a status code between 200 and 299
     * Throws error if otherwise.
     *
     * Use for example when you want to reject a fetch promise
     *
     * * @example
     * fetch(...)
     *  .then(response => checkForOKStatus(response)
     *  .then(response => toJson(response)
     *  .then(json => ...)
     *  .catch((error) => {
     *
     *  }
     *
     *
     * @param response
     * @returns {*}
     */
    checkForOKStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response
        } else {
            console.log("Not OK status: " + response.status)
            return new Promise((resolve, reject) => {
                response.text()
                    .then(text => {
                        if (text.startsWith("{")) {
                            try {
                                reject(JSON.parse(text))
                            } catch (e) {
                                console.log("Unparseable json in error message")
                                reject(text)
                            }
                        } else {
                            if(text.length === 0) {
                                reject(response);
                            } else {
                                reject(text)
                            }

                        }
                    })
                    .then(message => reject(message))
                    .catch(e => {
                        reject(response.statusText)
                    })
            })
        }
    }


    /**
     * Tries to convert response to json and logs the result to console if it fails and throws
     * original exception.
     *
     *
     * @param response The response to convert to Json
     * @return {*}
     */
    toJson(response) {
        return new Promise((resolve, reject) => {
            response.json()
                .then(json => resolve(json))
                .catch(e => {
                        response.text()
                            .then(text => {
                                console.log(text)
                                return text
                            })
                            .then(reject(e))
                            .catch(e2 => reject(e))
                    }
                )
        })
    }
}

export default Router
