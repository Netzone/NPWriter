import {Component} from 'substance'
import BarIconComponent from './../bar-icon/BarIconComponent'
import ButtonComponent from './../button/ButtonComponent'
import './scss/popover.scss'
import Event from '../../utils/Event'

class PopoverComponent extends Component {

    constructor(...args) {
        super(...args)

        this.context.api.events.on('__popover-' + args[1].popover.id, Event.BROWSER_RESIZE, () => {
            this.recalculateOffsets()
        })

        this.context.api.events.on('__popover-' + args[1].popover.id, 'popover:close', () => {
            this.extendState({active: false})
        })
    }

    getInitialState() {
        return {
            enabled: true,
            active: false,
            icon: this.props.popover.icon || null,
            button: this.props.popover.button || null,
            statusText: this.props.popover.statusText || null,
            triggerElement: null
        }
    }

    didMount() {
        document.addEventListener(
            'click',
            (e) => {
                // Listen to clicks outside of the popover only so that we
                // can close non sticky popovers automatically
                if (!this.state.active || this.props.popover.sticky === true) {
                    return
                }

                if (!this.refs.popover.el.el.contains(e.target)) {
                    this.extendState({active: false})
                }
            },
            false
        )
    }

    render($$) {
        let barContainerEl = $$('div')
            .addClass('sc-np-bar-container')

        if (this.state.button) {
            barContainerEl.append(
                this.renderTriggerButton($$)
            )
        }
        else if (this.state.icon) {
            barContainerEl.append(
                this.renderTriggerIcon($$)
            )
        }

        if (this.state.statusText) {
            barContainerEl.append(
                this.renderStatusText($$)
            )
        }

        return $$('div').append([
            barContainerEl,
            this.renderPopoverContent($$)
        ])
    }

    renderTriggerButton($$) {
        return $$(ButtonComponent, {
            contextIcon: this.state.icon,
            label: this.state.button,
            enabled: this.state.enabled,
            contextClick: (evt) => this.togglePopover(evt, this.props.popover.id),
            buttonClick: (evt) => this.buttonClick(evt, this.props.popover.id)
        })
        .ref('btn')
    }

    renderTriggerIcon($$) {
        return $$(BarIconComponent, {
            icon: this.state.icon,
            css: this.props.popover.css,
            enabled: this.state.enabled
        })
        .ref('icon')
        .on('click', (evt) => this.togglePopover(evt))
    }

    renderStatusText($$) {
        return $$('p')
            .ref('statustext')
            .addClass('sc-np-bar-item')
            .append(
                this.state.statusText
            )
    }

    renderPopoverContent($$) {
        var el = $$('div')
            .ref('popover')
            .addClass('sc-np-popover')
            .append(
                $$('div')
                    .ref('popover_top')
                    .addClass('sc-np-popover-arrow')
            )
            .append(
                $$(this.props.popover.component, {
                    popover: {
                        setStatusText: (statusText) => this.onSetStatusText(statusText),
                        setButtonText: (buttonText) => this.onSetButtonText(buttonText),
                        setIcon: (iconClass) => this.onSetIcon(iconClass),
                        disable: () => this.onSetEnabled(false),
                        enable: () => this.onSetEnabled(true),
                        close: () => {
                            if (this.state.active) {
                                this.togglePopover()
                            }
                        }
                    }
                })
                .ref('component')
            )
            .css('left', '-99999px')

        if (this.state.active === true) {
            el.addClass('active');
            window.setTimeout(() => {
                this.positionPopover(
                    this.getOffsets()
                )
            }, 5)
        }

        return el
    }

    positionPopover(offset) {
        let popover = this.el.el.querySelector("div.sc-np-popover"),
            arrow = this.el.el.querySelector("div.sc-np-popover-arrow")

        popover.style.left = offset.box + 'px'
        arrow.style.marginLeft = offset.arrow + 'px'
    }

    buttonClick(evt) {
        if (this.refs['component'].defaultAction) {
            this.refs['component'].defaultAction(evt)
        }
    }

    togglePopover(evt) {
        if (this.state.active === true) {
            this.extendState({active: false})
        }
        else {
            let triggerElement = null

            if (evt.target.nodeName === 'A') {
                triggerElement = evt.target
            }
            else if (evt.currentTarget.nodeName === 'BUTTON') {
                triggerElement = evt.currentTarget
            }
            else {
                return
            }

            this.extendState({
                offsetLeft: triggerElement.offsetLeft,
                offsetWidth: triggerElement.offsetWidth,
                active: true
            })

            // Opening one popover closes others, even the sticky ones, so
            // send an internal close event to all other popovers
            this.context.api.events.triggerEvent(
                '__popover-' + this.props.popover.id,
                'popover:close'
            )

        }

        // Must prevent default and propagation for automatic closing
        // functionality on click outside of the popover
        evt.preventDefault()
        evt.stopPropagation()
    }

    onSetIcon(iconClass) {
        let old = this.state.iconClass
        this.extendState({
            icon: iconClass
        })

        this.onLayoutChange(iconClass, old)
    }

    onSetStatusText(text) {
        let old = this.state.statusText
        this.extendState({
            statusText: text
        })

        this.onLayoutChange(text, old)
    }

    onSetButtonText(text) {
        let old = this.state.button
        this.extendState({
            button: text
        })

        this.onLayoutChange(text, old)
    }

    onSetEnabled(enabled) {
        this.extendState({
            enabled: enabled
        })
    }

    onLayoutChange(newValue, oldValue) {
        if (newValue === oldValue) {
            return
        }

        // Send browser resize event to enforce position recalculations
        // for all active (visible) popovers
        this.context.api.events.triggerEvent(
            '__popover',
            Event.BROWSER_RESIZE
        )
    }

    /*
     * Calculate offsets for popover box (left) and it's arrow (margin)
     */
    getOffsets(offsetLeft, offsetWidth) {
        if (!offsetLeft) {
            offsetLeft = this.state.offsetLeft
        }

        if (!offsetWidth) {
            offsetWidth = this.state.offsetWidth
        }

        let popoverEl = this.refs['popover'].el,
            left = offsetLeft - (popoverEl.width / 2) + offsetWidth / 2,
            margin = 0

        if (left < 10) {
            margin = left - 10
            left = 10
        }
        else if (left + popoverEl.width > document.body.clientWidth) {
            let oldLeft = left
            left = document.body.clientWidth - popoverEl.width - 10
            margin = oldLeft - left
        }

        return {
            box: left,
            arrow: margin
        }
    }

    recalculateOffsets() {
        let triggerElement

        if (this.state.active) {
            triggerElement = this.el.el.querySelector('.sc-np-bar-container > .sc-np-bar-icon')
            if (null === triggerElement) {
                let triggerElements = this.el.el.querySelectorAll('.sc-np-bar-container .sc-np-btn')
                if (triggerElements.length === 2) {
                    triggerElement = triggerElements[1]
                }
            }

            this.positionPopover(
                this.getOffsets(triggerElement.offsetLeft, triggerElement.offsetWidth)
            )
        }
    }
}

export default PopoverComponent
