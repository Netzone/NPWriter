import './scss/sidebar.scss'
import {Component, ScrollPane, TabbedPane} from 'substance'

class SidebarComponent extends Component {

    constructor(...args) {
        super(...args)

        this.handleActions({
            switchTab: this.switchContext
        })
    }

    getInitialState() {
        return {
            tabId: "main"
        }
    }

    getTabs() {
        const tabs = this.context.configurator.config.sidebarTabs
        const sidebarTabs = tabs.slice(0) // Create of copy of the array to not reverse the original tabs array
        return sidebarTabs.reverse()

    }
    render($$) {

        const el = $$('div').addClass('se-context-section').ref('sidebar');
        const scrollPane = $$(ScrollPane, {
            scrollbarType: 'native', //or substance
            scrollbarPosition: 'left'
        }).ref('sidebarScrollpane');

        var tabId = this.state.tabId;

        let panels = this.getSidebarPanelsForTabId($$, tabId)
        let topBars = this.getTopBarComponents($$)


        let tabsPanel = $$(TabbedPane, {activeTab: tabId, tabs: this.getTabs()})
            .ref(String(this.state.tabId))
            .append(panels)

        let topBar = $$('div').addClass('sidebar-top').append(topBars)

        scrollPane.append([topBar, tabsPanel])

        el.append(scrollPane)
        return el
    }

    switchContext(tabId) {
        this.extendState({tabId: tabId})
    }

    getTopBarComponents($$) {
        return this.context.configurator.config.sidebarTopBar.map((plugin) => {
            return $$('div')
                .addClass('plugin plugin-' + plugin.getCSSFriendlyName())
                .append($$(plugin.component, {panel: plugin}))
        })
    }

    /**
     * Get alll registered sidebar panels and then filter by the current tab id
     *
     * @param $$
     * @param tabId
     * @returns {Array} - Returns an array with components
     */
    getSidebarPanelsForTabId($$, tabId) {
        return this.context.configurator.getSidebarPanels().filter((plugin) => {
            return plugin.tabId === tabId
        }).map((plugin) => {
            return $$('div')
                .addClass('plugin plugin-' + plugin.getCSSFriendlyName())
                .append($$(plugin.component, {pluginConfigObject: plugin}))
        })
    }
}

export default SidebarComponent
