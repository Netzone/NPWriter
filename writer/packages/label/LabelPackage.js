export default {
    name: 'label',
    configure: function(config) {
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

    }
};
