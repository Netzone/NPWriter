import ConfigEditorComponent from './ConfigEditorComponent'

export default {
    name: 'config-editor',
    configure: function(config) {

        config.addSidebarTab('config', 'Konfigurera')

        config.addComponentToSidebarWithTabId('config-editor', 'config', ConfigEditorComponent)
    }
};
