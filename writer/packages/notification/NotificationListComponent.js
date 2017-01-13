// var Notification = require('./Notification');
import Event from '../../utils/Event'
import {Component} from 'substance'
import moment from 'moment'

class NotificationListComponent extends Component {

    getInitialState() {
        return {
            notifications: []
        }
    }

    didMount() {
        this.context.api.events.on('__internal', Event.NOTIFICATION_ADD, (event) => {
            let notifications = this.state.notifications
            notifications.push({
                display: true,
                title: event.data.title || null,
                message: event.data.message,
                timestamp: moment().format('X')
            })
            this.setState({notifications: notifications})
        })
    }

    removeNotification(notification) {
        notification.display = false
        this.rerender()
    }

    render($$) {

        const el = $$('div').addClass('imc-notifications light').ref('notification-list');

        let activeNotifications = this.state.notifications.filter((notification) => {
            return notification.display !== false
        }).map((notification, idx) => {
            let Notification = this.context.componentRegistry.get('notification')
            return $$(Notification, {
                sequence: idx,
                notification: notification,
                hideNotification: this.removeNotification.bind(this)
            }).ref('notification_'+idx)
        })
        el.append(activeNotifications)
        return el;
    }
}

export default NotificationListComponent
