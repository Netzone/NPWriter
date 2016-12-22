/**
 *
 * A base class for validation plugins
 *
 * @class Validator
 *
 */
class Validator {

    /**
     * Constructor is called by child-class:
     * super(...args)
     * @param newsItemArticle - A newsItemArticle XML Documement
     */
    constructor(newsItemArticle) {
        this.newsItem = newsItemArticle
        this.messages = []
    }


    /**
     * Add a message with type error
     * @param {string} error - A message describing the error
     */
    addError(error) {
        this.messages.push({type: 'error', message: error})
    }


    /**
     * Add a message with type warning to the message list
     * @param {string} warning - A message describing the warning
     */
    addWarning(warning) {
        this.messages.push({type: 'warning', message: warning})
    }

    /**
     *
     * @param {string} info - A message describing the information
     */
    addInfo(info) {
        this.messages.push({type: 'info', message: info})
    }

    /**
     * Check if validator has messages
     * @returns {boolean}
     */
    hasMessages() {
        return this.messages.length > 0
    }

    /**
     * Returns all messages
     * @returns {Array}
     */
    getMessages() {
        return this.messages
    }

}

export default Validator