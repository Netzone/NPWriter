import {Component} from 'substance'

class SourceComponent extends Component {

    constructor(...args) {
        super(...args)
    }

    getInitialState() {
        return {
            pretty: true
        }
    }

    render($$) {

        var xmlRaw = (this.props.message) ? this.props.message : this.getLabel('No source specified'),
            lines = xmlRaw.split("\n"),
            el = $$('div').addClass('source');

        el.on('dblclick', () => {
            if (this.state.pretty) {
                this.setState({
                    pretty: false
                })
            } else {
                this.setState({
                    pretty: true
                })
            }

        })

        if (this.state.pretty) {
            el.append(lines.map(function (line) {
                return $$('span').append(line)
            }))
        } else {
            el.append($$('textarea').css('width', '100%').css('height', '500px').append(xmlRaw))
        }


        return $$('div').addClass('message').append(el);
    }

    onClose() {
    }

}

export default SourceComponent