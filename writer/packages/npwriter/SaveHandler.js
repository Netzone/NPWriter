import ValidationError from '../../utils/errors/ValidationError'
import FileUploadError from '../../utils/errors/FileUploadError'

class SaveHandler {

    constructor({api, configurator}) {
        this.api = api
        this.configurator = configurator
    }

    /**
     * Returns the newsItem after it has been processed by the exporter
     * @returns {*|String}
     */
    getExportedDocument() {
        const exporter = this.configurator.createExporter('newsml', { api: this.api })
        return exporter.exportDocument(this.api.editorSession.getDocument(), this.api.newsItemArticle)
    }


    /**
     *
     * Runs validate method on all provided validators
     *
     * @param {Array} validators - An array with Validators
     * @returns {Array} Messages - An array with messages objects
     * @throws Error - Error is thrown is the validator class doesn't have a validate method
     */
    runValidatorsForDocument(validators, document) {
        let messages = []

        var parser = new DOMParser();
        var newsItemArticle = parser.parseFromString(document, "text/xml")

        validators.forEach((validatorClass) => {
            const pluginValidator = new validatorClass(newsItemArticle)
            if (pluginValidator.validate) {
                pluginValidator.validate()

                if (pluginValidator.hasMessages()) {
                    messages = [...messages, ...pluginValidator.getMessages()]
                }

            } else {
                throw new Error('Validator missing validate method')
            }
        })

        return messages
    }


    /**
     * Runs all validators and shows messages in a dialog
     * Promise is resolved if user clicks continue
     * Promise is rejected if user clicks cancel
     *
     * If no messages is found in the validators the promise is resolved immediately
     * @param Exported newsItem as XMLString
     * @returns {Promise}
     */
    validateDocument(document) {
        return new Promise((resolve, reject) => {
            const messages = this.runValidatorsForDocument(this.api.configurator.getValidators(), document)

            if (messages.length === 0) {
                resolve(document)
                return
            }

            this.api.ui.showMessageDialog(messages,
                () => {
                    resolve(document)
                },
                () => {
                    reject(new ValidationError(messages))
                })
        })


    }

    /**
     * Saves the current document after run through the NewsML Exporter
     * The UUID is selected from the NewsItem DOM
     * @returns {*}
     */
    saveDocument() {

        this.api.editorSession.fileManager.sync()
            .then(() => {
                const exportedArticle = this.getExportedDocument()
                return this.validateDocument(exportedArticle)
            })
            .then((document) => {

                const uuid = this.api.newsItemArticle.documentElement.getAttribute('guid');

                if (uuid) {
                    return this.updateNewsItem(uuid, document)
                } else {
                    return this.createNewsItem(document)
                }
            })
            .catch((error) => {

                if (error.name === 'ValidationError') {
                    // User canceled the save when on validation errors
                    this.api.events.userActionCancelSave()
                } else if (error.name === 'FileUploadError') {
                    this.api.router.get('/api/err?error=' + error.message)
                    this.api.router.get('/api/err?error=' + JSON.stringify(error.message))
                } else {
                    this.api.router.get('/api/err?error=' + JSON.stringify(error.message))
                }

            })
    }

    createNewsItem(newsItemXmlString) {
        return this.api.router.post('/api/newsitem', { body: newsItemXmlString })
            .then(response => response.text())
            .then((uuid) => {

                // When creating a new article, fetch the newly created article from the
                // backend and replace the document

                this.api.router.get('/api/newsitem/' + uuid, { imType: 'x-im/article' })
                    .then(response => this.api.router.checkForOKStatus(response))
                    .then(response => this.api.router.handleEtag(response, uuid))
                    .then(response => response.text())
                    .then((xmlString) => {
                        const result = this.api.newsItem.setSource(xmlString, {})
                        this.api.browser.ignoreNextHashChange = true
                        this.api.browser.setHash(uuid)
                        this.api.app.replaceDoc(result)
                        this.api.events.documentSaved();
                    })
            })
            .catch((error) => {
                this.api.events.documentSaveFailed(error)
            });
    }

    updateNewsItem(uuid, newsItemXmlString) {
        return this.api.router.put('/api/newsitem/' + uuid, { body: newsItemXmlString, uuid: uuid })
            .then(response => this.api.router.checkForOKStatus(response))
            .then(response => this.api.router.handleEtag(response, uuid))
            .then(() => {
                this.api.events.documentSaved();
            })
            .catch((error) => {
                this.api.events.documentSaveFailed(error)
            })
    }

}

export default SaveHandler
