import {SwitchTextTypeCommand} from 'substance'
import NPSwitchTextTypeTool from './NPSwitchTextTypeTool'

export default {
    name: 'switch-text-type',
    configure: function(config) {
        config.addCommand('switch-text-type', SwitchTextTypeCommand)
        config.addTool('switch-text-type', NPSwitchTextTypeTool, {
            toolGroup: 'content-menu'
        })
    }
}