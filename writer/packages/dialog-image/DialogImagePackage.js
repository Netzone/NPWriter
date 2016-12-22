import './scss/index.scss'

import DialogImageComponent from './DialogImageComponent'

export default {
    name: 'dialog',
    configure: function(config) {
        config.addComponent('dialog-image', DialogImageComponent)

        config.addLabel('Photo date', {
            sv: "Fotodatum"
        })

        config.addLabel('Imported', {
            sv: "Importerad"
        })

        config.addLabel('Image description', {
            sv: "Bildbeskrivning"
        })

        config.addLabel('Instructions', {
            sv: "Instruktioner"
        })

        config.addLabel('Object name', {
            sv: "Objektnamn"
        })

        config.addLabel('Add creator', {
            sv: "Lägg till skapare"
        })

        config.addLabel('Unknown name', {
            sv: "Okänt namn"
        })

        config.addLabel('Image data saved to archive', {
            sv: "Bildens arkivdata har sparats i arkivet"
        })

        config.addLabel('Error! Image data could not be saved.', {
            sv: "Ett fel uppstod! Bildens arkivdata kunde inte sparas."
        })
    }
}
