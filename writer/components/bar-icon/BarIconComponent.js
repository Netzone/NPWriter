import {Component} from 'substance'
import './scss/bar-icon.scss'

class BarIconComponent extends Component {

    constructor(...args) {
        super(...args)
    }

    getInitialState() {
        return {
            active: false
        }
    }

    render($$) {
        let triggerEl = null

        if (this.props.icon.substring(0, 3) === 'fa-') {
            triggerEl = $$('a').addClass('fa ' + this.props.icon)
        }
        else {
            let css = this.props.css || {}
            css['background-image'] = 'url("' + this.props.icon + '")'

            triggerEl = $$('a')
                .addClass('img')
                .css(css)
        }

        triggerEl.on('click', evt => this.onClick(evt))

        var el = $$('div').addClass('sc-np-bar-icon')
            .append(triggerEl)

        if (this.state.active) {
            el.addClass('active')
        }

        if (this.props.enabled === false) {
            el.addClass('disabled')
        }

        return el
    }

    onClick() {
        try {
            if (this.props.enabled === false) {
                return false
            }

            // HACK: Avoid having the element detached before calculations
            window.setTimeout(() => {
                this.extendState({
                    active: !this.state.active
                })
            }, 50)
        }
        catch(ex) {}

        return false;
    }
}

export default BarIconComponent
