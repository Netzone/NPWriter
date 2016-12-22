import {SwitchTextTypeTool} from 'substance'
import ContentMenuItem from './ContextMenuItem'

class NPSwitchTextTypeTool extends SwitchTextTypeTool {
    render($$) {
        var el = $$("ul").addClass('context-menu');

        const textTypes = this.props.textTypes.map((textType) => {
            return $$(ContentMenuItem, {
                label: textType.name,
                active: textType.name === this.props.currentTextType.name
            }).on('click', this.handleClick).attr('data-type', textType.name)
        })

        el.append(textTypes)

        return el;
    }
}

export default NPSwitchTextTypeTool
