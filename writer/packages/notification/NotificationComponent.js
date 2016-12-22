import {Component} from 'substance'

class Notification extends Component {
    getInitialState() {
        return {
            visible: null
        }
    }

    didMount() {
        this.setState({visible: 0});
    }

    updateState(visibleValue) {
        this.setState({
            visible: visibleValue
        })
    }

    render($$) {
        var outer = $$('div').append(
            $$('i').addClass('fa fa-comment')
        );

        var inner = $$('div').addClass('imc-notification');
        if (this.props.notification.title) {
            inner.append(
                $$('strong').append(this.props.notification.title)
            );
        }

        inner.append(
            $$('span').append(
                this.props.notification.message
            )
        );

        if (0 === this.state.visible) {

            outer.addClass('imc-visible')
                .on('click', () => {
                    outer.addClass('imc-disposed')
                    this.updateState(2)
                });

            if (!this.props.sticky) {
                setTimeout(() => {
                    outer.addClass('imc-disposed')
                    this.updateState(2)
                }, 5500)
            }
        }
        else {
            outer.addClass('imc-init');
        }

        return outer.append(inner);
    }
}

export default Notification

