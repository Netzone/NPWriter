import moment from 'moment'
import Event from '../utils/Event'
const HST_KEY = "__history__"
const HST_MAX_LENGTH = 15


/**
 * @class Api.History
 *
 * History api class handles local changes to a document and allows access
 * to a limited versioning of local changes.
 */
class History {

    /**
     * Constructor
     * @param {object} api An instance of the Api class
     */
    constructor(api) {
        this.api = api
        this.storage = null
    }

    /**
     * Check that local storage is available before any operation is performed
     *
     * @returns {boolean}
     */
    isAvailable() {
        if (this.storage !== null) {
            return (this.storage !== false)
        }

        try {
            var storage = window['localStorage'],
                x = '__storage_test__'

            storage.setItem(x, x)
            storage.removeItem(x)
            this.storage = storage

            return true;
        }
        catch (e) {
            this.storage = false
            return false
        }
    }


    /**
     * Get a history object for uuid
     * @returns {*}
     * @param id
     * @param historyList
     */
    get(id, historyList) {
        if (!this.isAvailable()) {
            return false;
        }

        let doc = this.getHistoryForArticle(id)
        return doc || this.createAndAddEmptyHistory(id);
    }




    createAndAddEmptyHistory(id) {

        let articleHistory = []
        if (!this.isAvailable()) {
            return false;
        }
        let history = {id: id, versions: [], updated: moment()};

        // If this is temporary, add a property to keep track
        if (this.api.newsItem.hasTemporaryId()) {
            history['unsavedArticle'] = true;
        }

        articleHistory.push(history)

        return history;
    }


    /**
     * Deletes history for an ID
     * @param id
     */
    deleteHistory(id) {

        if (!this.isAvailable()) {
            return false;
        }

        const historyId = HST_KEY+id
        this.storage.removeItem(historyId)
        this.api.events.triggerEvent(null, Event.HISTORY_CLEARED, {historyId: historyId});
    }


    /**
     * Get history from local storage for all articles and JSON Parse to Object
     * @returns {Array}
     */
    getHistory() {
        if (!this.isAvailable()) {
            return false;
        }

        const history = Object.keys(this.storage).filter((key) => {
            return key.indexOf('__history__') >= 0
        }).map((historyKey)=> {
            return this.storage[historyKey]
        }).map((article) => {
            try {
                return JSON.parse(article)
            } catch(e) {
                this.api.ui.showNotification('history', null, "Error loading history");
            }

        })
        return (!history) ? [] : history;
    }

    getHistoryForArticle(id) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            let articleHistory = this.storage.getItem(HST_KEY+id)
            return (!articleHistory) ? null : JSON.parse(articleHistory);
        }
        catch (e) {
            this.api.ui.showNotification('history', null, "Error loading history");
        }
    }


    /**
     * Removed half the list of articles based on the updated property
     * @param historyObj
     * @returns {boolean}
     */
    cleanOldVersions(historyObj) {
        if (!this.isAvailable()) {
            return false;
        }

        var versions = historyObj.sort(function (a, b) {
            var dateA = moment(a.updated),
                dateB = moment(b.updated)

            if (dateA.isBefore(dateB)) {
                return -1;
            } else {
                return 1;
            }
        });
        versions.splice(0, versions.length / 2);

        try {
            this.saveHistory(versions)
        } catch (e) {
            this.api.ui.showNotification('history', null, "Could not save version to local storage");
        }
    }


    /**
     * Save history to local storage
     * @param history
     * @returns {boolean}
     */
    saveHistory(id, history) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            let historyJson = JSON.stringify(history)
            this.storage.setItem(HST_KEY+id, historyJson)

            const eventData = {
                type: 'add',
                action: 'add',
                data: null
            }
            this.api.events.triggerEvent(null, Event.HISTORY_SAVED, eventData);
        }
        catch (e) {
            throw e;
        }
    }


    snapshot(action) {
        if (!this.isAvailable()) {
            return false;
        }

        let id = this.api.newsItem.getIdForArticle()


        // var _lsTotal = 0, _xLen, _x;
        // for (_x in localStorage) {
        //     _xLen = ((localStorage[_x].length + _x.length) * 2);
        //     _lsTotal += _xLen;
            // console.info(_x.substr(0, 50) + " using " + (_xLen / 1024).toFixed(2) + " KB")
        // }

        let doc = this.get(id)

        // Don't grow the version list too much
        if (doc.versions.length >= HST_MAX_LENGTH) {
            doc.versions.shift()
        }

        // Check if version already exists among versions
        let existingVersion = doc.versions.find((version) => {
            return version.src === this.api.newsItem.getSource();
        });

        if (!existingVersion) {
            // Add the new version
            doc.updated = moment()
            doc.versions.push({
                time: moment(),
                src: this.api.newsItem.getSource(),
                action: action || null
            })
        }

        try {
            this.saveHistory(id, doc)
        } catch (e) {
            if (e instanceof window.DOMException) {
                this.cleanAndRetry(historyObj);
            } else {
                this.api.ui.showNotification('history', null, e.message);
            }
        }

    }

    cleanAndRetry(historyObj) {
        try {
            this.cleanOldVersions(historyObj);
        } catch (e) {
            this.api.ui.showNotification('history', null, "Error saving version to local storage");
        }
        finally {
            this.api.ui.showNotification('history', null, "Error");
        }

    }


}

export default History
