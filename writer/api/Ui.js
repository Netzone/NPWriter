import Event from '../utils/Event'
class Ui {

    /**
     * Constructor takes a reference to the API
     * @param api
     */
    constructor(api) {
        this.api = api
    }

    /**
     * Show a notification
     *
     * @param {string} name - The plugin ID
     * @param title
     * @param message
     */
    showNotification(name, title, message) {
        this.api.events.triggerEvent(name, Event.NOTIFICATION_ADD, {
            plugin: name,
            title: title,
            message: message
        });
    }

    // addSidebarTab(name) {
    //     console.log("This", this.api.configurator.addSidebarTab({id: 'tester', name: 'hello'}));
    // }

    /**
     * Display a dialog with the specified content.
     *
     * Supported dialog actions:
     * <dl>
     *     <dt>dialog:enablePrimaryBtn</dt>
     *      <dd>Enables the primary button</dd>
     *     <td>dialog:disablePrimaryBtn</dt>
     *      <dd>Disables the primary button
     * </dl>
     *
     *
     * Options parameters
     *
     * title: string
     *  Optional. Dialog title
     *
     * primary: string|boolean
     *  Optional. Primary button caption, default is i18n representation of Ok, set to false to disable button
     *
     * secondary: string|boolean
     *  Optional. Secondary button caption, default is i18n representation of Cancel, set to false to disable button
     *
     * tertiary: string|object
     *  Optional: Third button
     *
     * center: boolean
     *  Optional. As default the dialog is centered over the editor area, set to true to center over the full writer
     *
     * @example
     * var tertiary = [{
     *      caption: this.context.i18n.t('Remove'),
     *      callback: function() {
     *          // Do something
     *      }.bind(this)
     * }];
     * this.context.api.showDialog(
     *   require('./XimimageSoftcropComponent'),
     *   {
     *       src: img.src,
     *       width: this.props.node.width,
     *       height: this.props.node.height,
     *       crops: this.props.node.crops,
     *       callback: this.setSoftcropData.bind(this)
     *   },
     *   {
     *       tertiary: tertiary
     *   }
     * );
     *
     * @param {*} contentComponent A substance component or tool that will be rendered inside the dialog
     * @param {object} props A object that will be passed as props to contentComponent
     * @param options
     * @oaram {object} options Options passed to dialog
     */
    showDialog(contentComponent, props, options) {
        const writer = this.api.refs.writer;
        writer.showDialog(contentComponent, props, options);
    }

    /**
     * Display a number of messages and different options depending on the
     * severity on each message. Messages can be of type info, warning or error.
     *
     * If there are error messages the user will not be able to continue.
     * If there are warnings the user can continue but suggested to cancel.
     * If only info messages only a continue is possible.
     *
     * @example
     * context.api.showMessageDialog(
     *    validationResponses,
     *    function () {
     *      // The user wants to contine
     *    }.bind(this),
     *    function () {
     *      // The user wants to cancel
     *    }.bind(this)
     * );
     *
     * @param {array} messages An array of message objects. Each object have the properties type (string: info, warning, error), plugin (string: the plugin name) and message (string)
     * @param {Function} cbContinue Callback function for when the user press continue
     * @param {Function} cbCancel Callback function for when the user press cancel
     */

    showMessageDialog(messages, cbContinue, cbCancel) {
        var level = 0; // 0 = info, 1 = warning, 2 = error
        for (var n = 0; n < messages.length; n++) {
            if (level < 1 && messages[n].type === 'warning') {
                // Show both continue and cancel buttons if exists
                level = 1;
            }
            else if (level < 2 && messages[n].type === 'error') {
                // Only show cancel button
                level = 2;
                break;
            }
        }

        var props = {
                level: level
            },
            options = {
                global: true,
                title: this.api.getLabel('message'),
                primary: false,
                secondary: false
            };


        const cancelLabel = this.api.getLabel('cancel')
        const continueLabel = this.api.getLabel('continue')
        if (level === 2) {
            options.primary = cancelLabel
            props.cbPrimary = cbCancel;
        }
        else if (level === 1) {
            options.primary = cancelLabel
            props.cbPrimary = cbCancel;

            options.secondary = continueLabel
            props.cbSecondary = cbContinue;
        }
        else {
            options.primary = continueLabel
            props.cbPrimary = cbContinue;

            if (cbCancel) {
                options.secondary = cancelLabel
                props.cbSecondary = cbCancel;
            }
        }

        const writer = this.api.writer;
        writer.showMessageDialog(
            messages,
            props,
            options
        );
    }

    /**
     * Returns a registered component from component registry
     * Can then be used the appending to a existing component
     *
     * @param {string} name - The key that component was registered with
     * @returns {*}
     */
    getComponent(name) {
        return this.api.writer.componentRegistry.get(name)
    }

}
export default Ui