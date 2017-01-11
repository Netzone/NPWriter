import './scss/_form-add.scss'
import FormAddComponent from './FormAddComponent'

export default {
    name: 'form-add',
    configure: function(config) {
        config.addComponent('form-add', FormAddComponent)
    }
}