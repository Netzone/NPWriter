'use strict';


import {Component} from 'substance'
import clone from 'lodash/clone'

/**
 * Props to pass:
 * SearchUrl {string}
 * onSelect {function}
 * onCreate {function} If allowing to create new items - pass this function
 * existingItems {array}
 * placeholderText {string} Placehold text inside input
 * createAllowed {bool} If creation of new elements is allowed
 *
 * When selecting this.props.onSelect
 * @constructor
 */

class FormAddComponent extends Component {

    constructor(...args) {
        super(...args)

        if (this.props.createAllowed && !this.props.onCreate) {
            console.warn("Creation of items is allowed but onCreate method is missing");
        }
    }

    execute(e) {
        switch (e.keyCode) {

            case 9: // tab
            case 13: // enter
                e.preventDefault();
                if (this.state.items.length === 0) return;
                this.select();
                break;

            case 27: // escape
                this.hide();
                break;
            default:
                this.lookup();
        }
    }

    hide() {
        this.refs.searchInput.val("");
        this.extendState({
            items: [],
            currentSelectedIndex: 0
        })

    }

    select() {
        this.doAction(this.currentSelectedItem);
    }

    lookup() {
        let data = [this.getCreateNewItem()];

        this.extendState({
            items: data,
        });
    }

    getInitialState() {
        return {
            items: [],
            currentSelectedIndex: 0
        };
    }

    /**
     * Adds a dummy element to items list which contains a "create item" element
     * @returns {{name: string[], uuid: string, shortDescription: string[]}}
     */
    getCreateNewItem() {
        return {
            name: [this.getLabel("Add") + ": " + this.refs.searchInput.val()],
            value: this.refs.searchInput.val(),
            uuid: "__create-new",
            imType: ["x-im/template"],
            shortDescription: [
                this.getLabel("Add new") + ": " + this.refs.searchInput.val()
            ]
        };
    }



    itemAlreadyExists(items, item) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].uuid !== '__create-new' && items[i].name[0].toLowerCase() === item.value.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    doAction(item) {
        if (item.exists) {
            return;
        }
        if (this.props.onCreate && this.props.createAllowed && item.uuid === '__create-new') {
            this.props.onCreate(item, this.itemAlreadyExists(this.state.items, item));
        } else {
            this.props.onSelect(item);
        }

        this.hide();
    }

    render($$) {

        const formGroup = $$('div').addClass('form-group').ref('formGroup');

        const searchInput = $$('input')
            .addClass('form-control')
            .addClass('form__search')
            .on('keyup', this.execute)
            .attr('autocomplete', 'off')
            .attr({
                type: 'text', id: 'formSearch', placeholder: this.getLabel(this.props.placeholderText)
            })
            .ref('searchInput');

        formGroup.append(searchInput);


        var el = $$('div').addClass('search__container').ref('searchContainer');
        var list = $$('ul').attr('id', 'searchResult').ref('searchResult');

        if (this.state.items.length > 0) {
            list.addClass('isSearching');
        }

        this.state.items.forEach(function (item, idx) {
            var itemToSave = clone(item);

            var name = item.name[0],
                description = item.shortDescription ? item.shortDescription[0] : '',
                itemId = 'item-' + item.uuid;

            itemToSave.inputValue = this.refs.searchInput.val();


            var itemEl = $$('li');
            if (item.exists === true) {
                itemEl.addClass('item__exists');
                itemEl.append($$('span').append("\u2713 ").addClass('item__found'));
            }
            itemEl.append($$('span').append(name).addClass('item__name'))
                .append($$('span').append(description).addClass('item__short-description'))
                .attr('id', itemId);

            itemEl.on('click', function () {
                this.doAction(itemToSave);
            }.bind(this));

            if (this.state.currentSelectedIndex === idx) {
                this.currentSelectedItem = itemToSave;
                itemEl.addClass('active');
            }

            list.append(itemEl);
        }.bind(this));

        el.append(formGroup);
        el.append(list);

        return el;
    }

}
export default FormAddComponent