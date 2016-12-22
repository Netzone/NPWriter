import {Component} from 'substance'

class DialogPlaceholder extends Component {


    getInitialState() {
        return {
            showModal: false
        }
    }

    render($$) {
        const el = $$('div')
        if (this.state.showModal) {
            var dialogComponent = this.getComponent('dialog')
            const dialog = {
                content: this.state.contentComponent,
                contentProps: Object.assign({}, this.state.props, this.context),
                options: this.state.options
            };
            el.append($$(dialogComponent, dialog))
        }

        return el
    }

    willReceiveProps(props) {
        if (props.showModal === true) {
            this.setState({
                showModal: true,
                contentComponent: props.contentComponent,
                props: props.props,
                options: props.options
            })
        } else {
            this.setState({showModal: false})
        }
    }

}

export default DialogPlaceholder