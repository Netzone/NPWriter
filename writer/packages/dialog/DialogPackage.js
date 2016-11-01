import './scss/index.scss'

import DialogComponent from './DialogComponent'

export default {
    name: 'dialog',
    configure: function(config) {
        config.addComponent('dialog', DialogComponent)
    }
}
