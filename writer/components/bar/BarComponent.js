import {Component} from 'substance'

import PopoverComponent from './../popover/PopoverComponent'
import './scss/bar.scss'
import Event from '../../utils/Event'

class BarComponent extends Component {

    constructor(...args) {
        super(...args)

        this.context.api.events.on('__barcomponent', Event.DOCUMENT_INVALIDATED, () => {
            this.extendState({barStateValid: false})
        })
    }

    getInitialState() {
        return {barStateValid: true}
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

        const barDiv = $$('div')
            .ref('bar_container')
            .addClass('sc-np-bar')
            .append([
                leftRibbon,
                rightRibbon
            ])

        if (!this.state.barStateValid) {
            leftRibbon.append($$('div').addClass('invalidTextBlock').append(this.getLabel('Article is invalid')))
            barDiv.addClass('barStateInvalid')
        }

        return barDiv
    }

    renderPopover($$, popover) {
        var id = popover.id
        return $$(PopoverComponent, {
            popover: popover
        }).ref('bar_popover_' + id)
    }
}

export default BarComponent
