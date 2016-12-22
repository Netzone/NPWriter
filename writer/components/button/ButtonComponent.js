import {Component} from 'substance'
import './scss/button.scss'

class ButtonComponent extends Component {

    constructor(...args) {
        super(...args)
    }

    getInitialState() {
        return {
            active: false
        }
    }

    render($$) {
        let buttonEl = $$('button')
            .addClass('sc-np-btn')
            .append(
                this.props.label
            )
            .on('click', evt => this.onButtonClick(evt))

        if (!this.props.contextIcon) {
            if (this.props.enabled === false) {
                buttonEl.addClass('disabled')
            }
            return buttonEl
        }

        let buttonGroupEl = $$('div')
            .addClass('sc-np-btn-group')
            .append([
                buttonEl,
                $$('button').addClass('sc-np-btn').append(
                    $$('i')
                        .addClass('fa ' + this.props.contextIcon)
                )
                .on('click', evt => this.onContextClick(evt))
            ])

        if (this.props.enabled === false) {
            buttonGroupEl.addClass('disabled')
        }

        return buttonGroupEl
    }

    onButtonClick(evt) {
        try {
            if (this.props.enabled === false) {
                return false
            }

            if (this.props.buttonClick) {
                this.props.buttonClick(evt)
            }
        }
        catch(ex) {}
    }

    onContextClick(evt) {
        try {
            if (this.props.enabled === false) {
                return false
            }

            if (this.props.contextClick) {
                this.props.contextClick(evt)
            }

            // HACK: Avoid having the element detached before calculations
            window.setTimeout(() => {
                this.setState({
                    active: !this.state.active
                })
            }, 50)
        }
        catch(ex) {}

        return false;
    }
}

export default ButtonComponent
