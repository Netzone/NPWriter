import {Component} from 'substance'

class ContextMenuItem extends Component {

    render($$) {

        let listItem = $$('li').append(this.getLabel(this.props.label))

        if(this.props.active) {
            listItem.addClass('active')
        }

        return listItem
    }

}

export default ContextMenuItem