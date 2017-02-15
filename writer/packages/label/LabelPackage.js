export default {
    name: 'label',
    configure: function (config) {
        config.addLabel('undo', {
            en: 'Undo',
            sv: 'Ångra'
        })

        config.addLabel('redo', {
            en: 'Redo',
            sv: 'Upprepa'
        })

        config.addLabel('No suggestions', {
            en: 'No suggestions',
            sv: 'Inga förslag'
        })
        config.addLabel('select-all', {
            en: 'Select all',
            sv: 'Markera allt'
        })
        config.addLabel('paragraph', {
            en: 'Body',
            sv: 'Brödtext'
        })


        // --------------------------------------
        // Labels In Error and start loading pages
        // --------------------------------------

        config.addLabel('error-page-Error', {
            en: 'An error occured',
            sv: 'Något gick fel'
        })

        config.addLabel('error-page-error-description', {
            en: 'Error description',
            sv: 'Felbeskrivning'
        })

        config.addLabel('error-page-status-code', {
            en: 'Error status code',
            sv: 'Felmeddelandekod'
        })

        config.addLabel('error-page-status-url', {
            en: 'Requested URL',
            sv: 'Efterfrågad URL'
        })

        config.addLabel('error-page-human-readable-404', {
            en: 'The requested article could not be found',
            sv: 'Artikeln du försökte öppna kunde inte hittas.'
        })

        // --------------------------------------
        // Labels specified in API
        // --------------------------------------

        config.addLabel('message', {
            en: 'Message',
            sv: 'Meddelande'
        })

        config.addLabel('cancel', {
            en: 'Cancel',
            sv: 'Avbryt'
        })

        config.addLabel('continue', {
            en: 'Continue',
            sv: 'Fortsätt'
        })

        config.addLabel('Meta', {
            en: 'Meta',
            sv: 'Meta'
        })

        config.addLabel('Copy created. You are now working on a new unsaved copy of the original article.', {
            en: 'Copy created. You are now working on a new unsaved copy of the original article.',
            sv: 'En kopia har skapats. Du arbetar nu med en osparad kopia av den ursprungliga artikeln.'
        })

        config.addLabel('error-human-readable-409-conflict', {
            en: 'The article has been updated. Please save your work and reload the article to get latest changes.',
            sv: 'Artikeln har uppdaterats. Vänligen spara dina ändringar och ladda om artikeln för att få de senaste ändringarna.'
        })

        config.addLabel('Article is invalid', {
            en: 'Article is invalid',
            sv: 'Artikeln är ogiltig'
        })

        config.addLabel('This article is no longer valid', {
            en: 'Article is marked invalid and can no longer be saved',
            sv: 'Artikeln är markerad som ogiltig och går ej att spara'
        })

        config.addLabel('Conflict detected while saving article', {
            en: 'Conflict detected while saving the document',
            sv: 'En konflikt uppstod när dokumentet skulle sparas'
        })
    }
};
