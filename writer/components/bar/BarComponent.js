import {Component} from 'substance'

import PopoverComponent from './../popover/PopoverComponent'
import './scss/bar.scss'

class BarComponent extends Component {

    constructor(...args) {
        super(...args)
    }

    render($$) {
        let popovers = this.props.popovers.length ? this.props.popovers : [],
            leftRibbon = $$('div').ref('bar_left_ribbon'),
            rightRibbon = $$('div').ref('bar_right_ribbon')

        popovers.forEach(popover => {
            let el = this.renderPopover($$, popover)
            if (popover.align === 'left') {
                leftRibbon.append(el)
            }
            else {
                rightRibbon.append(el)
            }
        })

        return $$('div')
            .ref('bar_container')
            .addClass('sc-np-bar')
            .append([
                leftRibbon,
                rightRibbon
            ])
    }

    renderPopover($$, popover) {
        var id = popover.id
        return $$(PopoverComponent, {
            popover: popover
        }).ref('bar_popover_' + id)
    }
}

export default BarComponent
