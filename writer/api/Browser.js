import ResourceLoader from '../utils/ResourceLoader'
/**
 * Class used internally to handle browser behaviour.
 */
class Browser {
    constructor(api) {
        this.api = api;
        this.hashChangeEventListener = null;
        this.ignoreNextHashChange = false;
        this.setupHashHandler();
    }

    /**
     * Validate if browser is supported
     *
     * @return {boolean}
     */
    isSupported() {
        var browser = require('detect-browser');
        return browser.name === 'chrome';
    }

    /**
     * Setup handling of hash, article id, in the browser location bar
     */
    setupHashHandler() {
        this.hashChangeEventListener = window.addEventListener(
            'hashchange',
            function () {
                this.reload();
            }.bind(this)
        );
    }


    /**
     * Trigger a reload of the writer based on current hash held internally in the api
     */
    reload() {
        if (this.ignoreNextHashChange) {
            this.ignoreNextHashChange = false;
            return;
        }

        window.location.href = this.api.router.getEndpoint() + "/#" + this.getHash();
        window.location.reload();
    }

    /**
     * Get the hash value in the browser location bar. Even though this is normally
     * the same as the article id it is not guaranteed to be consistent at all times!
     *
     * @return {string}
     */
    getHash() {
        if (!window.location.hash) {
            return '';
        }

        return window.location.hash.slice(1);
    }

    /**
     * Set the hash value in the browser location bar
     *
     * @param {string} hash New hash value to set
     * @return {string}
     */
    setHash(hash) {
        if (typeof hash !== 'string') {
            window.location.hash = '';
        }

        window.location.hash = hash;
        return this.getHash();
    }

    /**
     * Adds a script tag in html document
     * @param scriptSource
     * @returns {Promise}
     */
    addExternalScript(scriptSource) {
        const resourceLoader = new ResourceLoader()
        return resourceLoader.load({url: scriptSource}, 'js')
    }

}
export default Browser
