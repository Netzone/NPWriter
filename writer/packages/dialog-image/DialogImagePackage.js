import './scss/index.scss'

import DialogImageComponent from './DialogImageComponent'

export default {
    name: 'dialog',
    configure: function(config) {
        config.addComponent('dialog-image', DialogImageComponent)

        config.addLabel('ok', {
            en: "Ok",
            sv: "Ok"
        })
    }
}
