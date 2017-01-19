import './scss/avatar.scss'

import AvatarComponent from './AvatarComponent'

export default {
    name: 'avatar',
    configure: function(config) {

        config.addComponent('avatar', AvatarComponent)
    }
}
