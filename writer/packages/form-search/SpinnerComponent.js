
import {Component} from 'substance'

class SpinnerComponent extends Component {

    constructor(...args) {
        super(...args)
    }

    render($$) {
        var el = $$('i').addClass('fa fa-spinner fa-spin form__search--spinner').ref('searchInputSpinner');
        if(this.props.isSearching) {
            el.addClass('active');
        }
        return el;
    }
}
export default SpinnerComponent