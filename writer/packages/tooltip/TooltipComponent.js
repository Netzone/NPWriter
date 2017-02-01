import {Component} from 'substance'

class TooltipComponent extends Component {

    /**
     * Default state of tooltip is invisible
     * @returns {{show: boolean}}
     */
    getInitialState() {
        return {show: false}
    }

    /**
     * Owner can use extendProps method to toggle
     * visibility of the tooltip component
     * @param props
     * @param old
     */
    willReceiveProps(props, old) {
        if (props.hasOwnProperty('show')) {
            this.setState({
                show: this.state.show ? false : true
            })
        }

    }

    render($$) {
        const el = $$('span').ref('tooltip').addClass('tooltip')

        // Hack: If somehow the tooltip is stuck in display mode
        // we solve it by removing when mouseover.
        el.on('mouseover', () => {
            this.setState({
                show: false
            })
        })
        el.append(this.props.title)

        const parent = this.props.parent ? this.props.parent.el : this.parent.el
        if (this.state.show) {
            el.addClass('active')

            const width = this.el.width // Width of the tooltip
            const left = (parent.width / 2) - (width / 2) // Calculate left position by the tooltip width and parent width
            el.css('left', left + 'px')
        }
        return el
    }

}

export default TooltipComponent