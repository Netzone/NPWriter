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
     */
    clear() {
        if (!this.api.browser.getHash()) {
            this.api.browser.reload();
        }
        else {
            this.api.browser.setHash('');
        }
    }

    /**
     * Create a new, unsaved, article based on the current article.
     */
    copy() {
        this.api.setGuid(null);
        this.api.removeDocumentURI();

        this.api.browser.ignoreNextHashChange = true;
        this.api.browser.setHash('');
        this.api.ui.showNotification(
            'publish',
            null,
            this.api.i18n.t('Copy created. You are now working on a new unsaved copy of the article.')
        );
    }
}

export default Article
