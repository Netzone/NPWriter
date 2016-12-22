import './scss/_form-search.scss'
import FormSearchComponent from './FormSearchComponent'

export default {
    name: 'form-search',
    configure: function(config) {
        config.addComponent('form-search', FormSearchComponent)
    }
}