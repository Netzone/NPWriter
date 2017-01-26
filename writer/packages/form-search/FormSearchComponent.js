'use strict';

var _ = require('lodash');

import SpinnerComponent from "./SpinnerComponent";
import {Component} from "substance";
import clone from "lodash/clone";
import debounce from "../../utils/Debounce";

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

class FormSearchComponent extends Component {

    constructor(...args) {
        super(...args)

        if (this.props.createAllowed && !this.props.onCreate) {
            console.warn("Creation of items is allowed but onCreate method is missing");
        }
    }

    next() {
        //noinspection JSJQueryEfficiency
        const selectedDomItem = document.getElementById('item-' + this.currentSelectedItem.uuid)
        let currentSelectedItem = this.currentSelectedItem && selectedDomItem
        if (currentSelectedItem) {
            let searchResultElement = this.refs.searchResult.el.el;
            let selectedItem = selectedDomItem
            let items = this.state.items

            if (this.state.currentSelectedIndex >= 0) {
                let idx = parseInt(this.state.currentSelectedIndex)
                idx++;

                searchResultElement.scrollTop = selectedItem.offsetTop;
                this.extendState({
                    currentSelectedIndex: idx
                });

                if (idx === items.length) {
                    this.extendState({
                        currentSelectedIndex: 0
                    });
                    searchResultElement.scrollTop = 0
                }
            }
        }
    }

    prev() {
        //noinspection JSJQueryEfficiency
        const selectedDomItem = document.getElementById('item-' + this.currentSelectedItem.uuid)
        let currentSelectedItem = this.currentSelectedItem && selectedDomItem
        if (currentSelectedItem) {
            let searchResultElement = this.refs.searchResult.el.el
            let selectedItemPrevSibling = selectedDomItem.previousSibling

            let items = this.state.items;
            if (this.state.currentSelectedIndex >= 0) {
                var idx = parseInt(this.state.currentSelectedIndex)

                if (selectedItemPrevSibling === null) {
                    searchResultElement.scrollTop = searchResultElement.lastChild.offsetTop
                    this.extendState({
                        currentSelectedIndex: items.length - 1
                    });

                } else {
                    let offsetTop = selectedItemPrevSibling.offsetTop
                    let offsetHeight = selectedItemPrevSibling.offsetHeight

                    searchResultElement.scrollTop = offsetTop - offsetHeight
                    idx--;

                    this.extendState({
                        currentSelectedIndex: idx
                    });
                }
            }
        }
    }

    search(e) {
        switch (e.keyCode) {

            case 38: // up arrow
                if (e.shiftKey) return;
                e.preventDefault();
                this.prev();
                break;

            case 40: // down arrow
                if (e.shiftKey) return;
                e.preventDefault();
                this.next();
                break;

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
                debounce(() => this.lookup(), 300)()
        }
    }

    clearItems() {
        this.extendState({
            items: [],
            isSearching: false,
            currentSelectedIndex: 0
        })
    }

    hide() {
        this.refs.searchInput.val("");
        this.clearItems()
    }

    select() {
        this.doAction(this.currentSelectedItem);
    }

    lookup() {
        var input = this.refs.searchInput.val(),
            originalInput = input;

        if (input.length === 0) {
            this.clearItems()
            return;
        }

        this.extendState({
            isSearching: true
        });

        // Might pass a boolean from parent to search with wildcard?
        var wildcardSearch = true;
        if (wildcardSearch) {
            input += '*';
        }

        if (this.props.searchUrl === null) {
            this.handleSearchResult([]);
        }
        else {
            const fetchParameters = {
                headers: {
                    contentType: 'application/json',
                    dataType: 'application/json'
                }
            }

            this.context.api.router.get(this.props.searchUrl + input, fetchParameters)
                .then(response => this.context.api.router.checkForOKStatus(response))
                .then(response => this.context.api.router.toJson(response))
                .then((json) => {
                    if (originalInput === this.refs.searchInput.val()) {
                        // Search should be handled, it is the same input as when the request was sent
                        this.handleSearchResult(json);
                    } else {
                        // input differs from search request, skip it.
                        this.extendState({
                            isSearching: false
                        });
                    }
                })
                .catch((e) => {
                    console.error(e)
                    this.extendState({
                        isSearching: false
                    });
                })
        }
    }

    handleSearchResult(data) {
        this.extendState({
            items: this.getItemsThatNotExisting(data),
            isSearching: false
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
            name: [this.getLabel("Create") + ": " + this.refs.searchInput.val()],
            value: this.refs.searchInput.val(),
            uuid: "__create-new",
            imType: ["x-im/template"],
            shortDescription: [
                this.getLabel("Create new") + ": " + this.refs.searchInput.val()
            ]
        };
    }

    getItemsThatNotExisting(data) {
        var existingItems = this.props.existingItems;

        if (this.props.onCreate && this.props.createAllowed) {
            data.push(this.getCreateNewItem());
        }

        var existingItemsMap = {};
        if (existingItems) {
            existingItems.forEach(function (item) {
                existingItemsMap[item.uuid] = item.uuid;
            });
        }

        data.forEach(function (item) {
            if (existingItemsMap[item.uuid]) {
                item.exists = true;
            }
        });

        return data;

        // return _.differenceWith(data, existingItems, function (a, b) {
        //     return a.uuid === b.uuid;
        // });
    }


    itemAlreadyExists(items, item) {
        for (var i = 0; i < items.length; i++) {
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
            this.props.onCreate(item, true);
        } else {
            this.props.onSelect(item);
        }

        this.hide();
    }

    render($$) {

        var formGroup = $$('div').addClass('form-group').ref('formGroup');

        var searchInput = $$('input')
            .addClass('form-control')
            .addClass('form__search')
            .on('keyup', this.search)
            .attr('autocomplete', 'off')
            .attr({
                type: 'text', id: 'formSearch', placeholder: this.getLabel(this.props.placeholderText)
            })
            .ref('searchInput');

        var inlineIcon = $$(SpinnerComponent, {isSearching: this.state.isSearching});

        formGroup.append(inlineIcon);
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
export default FormSearchComponent