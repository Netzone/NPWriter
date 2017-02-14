import Event from "../utils/Event";

/**
 * @class Article
 */
class Article {
    constructor(api) {
        this.api = api;
    }

    /**
     * Clear the article and create a new based on the configured base template.
     *
     * @param {bool} disableWarning Optional, default false. If true, the article will be cleared without warning
     */
    clear(disableWarning) {
        if (!this.api.browser.getHash()) {
            this.api.browser.reload();
        }
        else {
            if (disableWarning) {
                this.api.events.triggerEvent(
                    null,
                    Event.DISABLE_UNLOAD_WARNING,
                    {}
                )
            }

            this.api.browser.setHash('');
        }
    }

    /**
     * Create a new, unsaved, article based on the current article.
     */
    copy() {
        this.api.newsItem.setGuid(null);
        this.api.newsItem.removeDocumentURI();

        this.api.browser.ignoreNextHashChange = true;
        this.api.browser.setHash('');
        this.api.ui.showNotification(
            'publish',
            null,
            this.api.getLabel('Copy created. You are now working on a new unsaved copy of the original article.')
        );
    }

    openInNewWindow(uuid) {
        this.api.browser.openInNewWindow({hash: uuid, url: 'current'});
    }
}

export default Article
