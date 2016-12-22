import {Component} from 'substance'

class DialogMessageComponent extends Component {

    constructor(...args) {
        super(...args)
    }


    render($$) {
        const el = $$('div').addClass('modal-messages')

        this.renderMessages($$, el, 'error', this.props.messages.error);
        this.renderMessages($$, el, 'warning', this.props.messages.warning);
        this.renderMessages($$, el, 'info', this.props.messages.info);

        return el
    }

    renderMessages($$, el, type, messages) {
        if (!messages.length) {
            return;
        }

        const ul = $$('ul').addClass(type);

        let message = messages.map((message) => {
            return $$('li').append(message.message)
        })
        ul.append(message)

        el.append(ul)

    }

    onClose(action) {
        if (action === 'save') {
            if (this.props.cbPrimary) {
                this.props.cbPrimary();
            }
        }

        else if (typeof this.props.level !== 'undefined' && this.props.level === 0 && this.props.cbPrimary) {
            // When ESC is pressed, and a level 0 message dialog is shown, primary callback
            // should be called as there is only continue give to the user as an option
            this.props.cbPrimary();
        }
        else if (this.props.cbSecondary) {
            this.props.cbSecondary();
        }
    }
}

export default DialogMessageComponent