import './scss/_notifications.scss'
import NotificationListComponent from './NotificationListComponent'
import NotificationComponent from './NotificationComponent'

export default {
    name: 'notification',
    configure: function(config) {
        config.addComponent('notification-list', NotificationListComponent)
        config.addComponent('notification', NotificationComponent)
    }
}