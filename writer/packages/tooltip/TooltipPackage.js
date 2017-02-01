import './scss/index.scss'
import TooltipComponent from './TooltipComponent'

export default {
    name: 'tooltip',
    configure: function(config) {
        config.addComponent('tooltip', TooltipComponent)
    }
}
