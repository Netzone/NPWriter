import {Component, FontAwesomeIcon} from 'substance'
import Event from '../../utils/Event'

class DialogComponent extends Component {

    constructor(...args) {
        super(...args)

        // When esc:pressed event close the dialog
        this.context.api.events.on('__dialog', Event.USERACTION_KEY_ESCAPE, () => {
            this.close()
        })

         // When esc:pressed event close the dialog
        this.context.api.events.on('__dialog', Event.USERACTION_KEY_ENTER, () => {
            this.save()
        })

        // action handlers
        this.handleActions({
            'close': this.close,
            'dialog:enablePrimaryBtn': this.enablePrimaryBtn,
            'dialog:disablePrimaryBtn': this.disablePrimaryBtn
        });
    }



    didMount() {
        this.changeModalHeight()

        window.onresize = () => {
            this.changeModalHeight()
        }
    }

    dispose() {
        this.context.api.events.off('__dialog', Event.USERACTION_KEY_ESCAPE)
        this.context.api.events.off('__dialog', Event.USERACTION_KEY_ENTER)
        window.onresize = null
    }

    enablePrimaryBtn() {
        this.extendState({
            primaryBtnEnabled: true
        })
    }

    disablePrimaryBtn() {
        this.extendState({
            primaryBtnEnabled: false
        })
    }

    getInitialState() {
        return {
            primaryBtnEnabled: true
        }
    }

    render($$) {

        /**
         * [
         {
           "type": "info",
           "message": "This is a info message."
         },
         {
           "type": "warning",
           "message": "This is a warning message."
         },
         {
           "type": "error",
           "message": "Artikeln saknar titel vilket kan göra den svår att hitta."
         }
         ]
         */

        const props = this.props;
        const options = props.options;

        const modal = $$('div').attr('id', 'im-modal-default').addClass('modal').ref('modal')

        const modalDialog = $$('div').addClass('modal-dialog').attr('role', 'document');
        const modalContent = $$('div').addClass('modal-content');

        const modalBody = $$('div').addClass('modal-body');
        const modalFooter = $$('div').addClass('modal-footer');

        const contentComponent = props.content;
        const modalInnerContent = $$(contentComponent, props.contentProps).addClass('modal-inner-content').ref('contentComponent')

        if (props.options.takeover) {
            modal.addClass('global takeover')
        }
        if (props.options.cssClass) {
            modal.addClass(options.cssClass)
        }

        modalBody.append(modalInnerContent)
        this.addTertiaryButtons($$, modalFooter, options)
        this.addSecondaryButtonIfExist($$, modalFooter, options)
        this.addPrimaryButtonIfExist($$, modalFooter, options)
        this.addTitleIfExist($$, modalContent, options)

        modalContent.append([modalBody, modalFooter])

        modalDialog.append(modalContent)
        modal.append(modalDialog);

        return modal
    }

    /**
     * If a title is provided in the options object it will create a
     * modal-header and append provided title through the label system
     * @param $$
     * @param modalContent
     * @param options
     */
    addTitleIfExist($$, modalContent, options) {
        if (options.title) {

            let title = ''
            if (options.icon) {
                title = $$('span').append($$(FontAwesomeIcon, {icon: options.icon})).append(' ' + this.getLabel(options.title))
            } else {
                title = this.getLabel(options.title)
            }
            modalContent.append(
                $$('div').addClass('modal-header').append(
                    $$('h2').append(
                        title
                    )
                )
            );
        }
    }


    /**
     * Recalculate the height of the modal window depending on the resolution on the client.innerHeight
     */
    changeModalHeight() {
        const clientHeight = window.innerHeight;
        if (clientHeight < 700) {
            this.el.find('.modal-content').addClass('small-screen');
            this.el.find('.modal-content').css('height', (parseInt(clientHeight - 60, 10)) + "px")
        } else {
            this.el.find('.modal-content').removeClass('small-screen');
            this.el.find('.modal-content').css('max-height', clientHeight - 120 + "px");
            this.el.find('.modal-content').css('height', 'auto')
        }
    }


    addPrimaryButtonIfExist($$, modalFooter, options) {
        if (options.primary !== false) {
            modalFooter.append(this.renderPrimaryButton($$, options).ref('primaryButton'));
        }
    }

    addSecondaryButtonIfExist($$, modalFooter, options) {
        if (options.secondary !== false) {
            modalFooter.append(this.renderSecondaryButton($$, options).ref('secondaryButton'));
        }
    }

    addTertiaryButtons($$, modalFooter, options) {
        if (options.tertiary) {
            modalFooter.append(this.renderTertiaryButtons($$, options));
        }
    }

    save() {
        if (this.state.primaryBtnEnabled) {
            this.extendState({
                saveInProgress: true
            })
            // this.showPrimaryButtonLoader($$)
            if (this.refs.contentComponent.onClose && this.refs.contentComponent.onClose('save') !== false) {
                this.send(Event.DIALOG_CLOSE) // Send this close to Writer can reset state
                this.remove();
            }
        }
    }

    close() {
        if(this.props.options.disableEscKey) {
            return
        }
        if (this.refs.contentComponent.onClose && this.refs.contentComponent.onClose('cancel') !== false) {
            this.send(Event.DIALOG_CLOSE) // Send this close to Writer can reset state
            this.remove();
        }
    }

    renderPrimaryButton($$, options) {
        const caption = (options.primary) ? options.primary : this.getLabel('ok');
        let button = $$('button')
            .attr('type', 'button')
            .addClass('btn sc-np-btn btn-primary')
            .on('click', this.save);

        if(this.state.saveInProgress) {
            button.addClass('disabled');
            button.append($$(FontAwesomeIcon, {icon: 'fa-spinner fa-spin'}))
        } else {
            button.append(caption)
        }
        if (!this.state.primaryBtnEnabled) {
            button.attr('disabled', true)
        }

        return button
    }

    renderSecondaryButton($$, options) {
        var caption = (options.secondary) ? options.secondary : this.getLabel('Cancel');
        return $$('button').attr('type', 'button')
            .addClass('btn sc-np-btn btn-secondary')
            .attr('data-dismiss', 'modal')
            .append(caption)
            .on('click', this.close);
    }

    renderTertiaryButtons($$, options) {
        if (!Array.isArray(options.tertiary)) {
            return $$('span');
        }

        return options.tertiary.map((btn) => {
            return $$('button').attr('type', 'button')
                .addClass('btn sc-np-btn btn-secondary btn-tertiary')
                .attr('data-dismiss', 'modal')
                .append(btn.caption)
                .on('click', () => {
                    var ret = btn.callback();
                    if (ret === true) {
                        this.close();
                    }
                })

        })
    }
}

export default DialogComponent