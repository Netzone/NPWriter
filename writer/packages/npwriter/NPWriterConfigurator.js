import {Configurator, Component} from 'substance'
import LabelProvider from './LabelProvider'
import Validator from './Validator'
import 'whatwg-fetch'

class NPWriterConfigurator extends Configurator {

    constructor(...args) {
        super(...args)

        this.config.textEditComponents = []
        this.config.popovers = []
        this.config.validators = []
        this.config.sidebarTopBar = []
        this.config.sidebarTabs = []
        this.config.sidebarPanels = []
        this.config.uis = new Map()

        this.config.conflictResolvers = new Map();
    }

    /**
     * @Todo Handle how to configure writer.json
     * @returns {LabelProvider}
     */
    getLabelProvider() {
        let labelLanguage = 'en'
        if (this.config.writerConfigFile && this.config.writerConfigFile.labelLanguage) {
            labelLanguage = this.config.writerConfigFile.labelLanguage
        }

        if (!this.labelProvider) {
            this.labelProvider = new LabelProvider(this.config.labels, labelLanguage)
        }
        return this.labelProvider

    }

    /**
     * Add a substance Component in a popover that is triggered by an
     * icon in the top bar.
     *
     * @param {string} id Package id
     * @param {object} def Definition for the popover trigger icon or button
     * @param {Component} component Substance component
     *
     * @example
     * config.addPopover(
     *      'mypopover-2001',     // Unique id for this popover
     *      {
     *          icon: 'fa-plane', // Font awesome icon class or image url
     *          align: 'left'     // Left or right aligned
     *      },
     *      AboutComponent        // Component to render in popover
     * )
     */
    addPopover(id, def, component) {
        def.align = def.align === 'left' ? 'left' : 'right'
        def.button = def.button || false

        if (!def.icon) {
            throw new Error('Popover trigger must have a default icon')
        }

        this.config.popovers.push({
            id: id,
            icon: def.icon,
            button: def.button,
            align: def.align,
            css: def.css || {},
            component: component
        })
    }

    /**
     * Adds a tab to the right sidebar
     * @param id
     * @param name
     */
    addSidebarTab(id, name) {
        if (!this.config.sidebarTabs.find((tab) => {
                return tab.id === id
            })) {
            this.config.sidebarTabs.push({
                id: id,
                name: name
            })
        }
    }

    /**
     * Adds a Substance Component to a a panel by specifying the tabId
     * @param id
     * @param tabId
     * @param component
     * @param {object} pluginConfigObject Pass the plugin config object
     */
    addComponentToSidebarWithTabId(id, tabId, component, pluginConfigObject) {
        if (typeof component.render !== 'function') {
            throw new Error('Ui must be an instance of Component and have a render function')
        }

        this.addComponent(id + "-tab", component)
        this.config.sidebarPanels.push({
            id: id,
            tabId: tabId,
            component: component,
            pluginConfigObject: pluginConfigObject,
            getCSSFriendlyName: () => {
                return id.replace(/\./g, '-')
            }
        })
    }


    /**
     * Returns a registered sidebarPanels
     * @returns {Array}
     */
    getSidebarPanels() {
        return this.config.sidebarPanels
    }


    addComponentToSidebarTop(pluginId, component) {
        this.addComponent(pluginId + "-topbar", component)

        this.config.sidebarTopBar.push({
            id: pluginId,
            component: component,
            getCSSFriendlyName: () => {
                return pluginId.replace(/\./g, '-')
            }

        })
    }

    addValidator(pluginValidator) {
        this.config.validators.push(pluginValidator)
    }

    getValidators() {
        return this.config.validators
    }

    /**
     * Register a conflict resolver in the writer.
     * The conflict resolver will be called when the server responds with <pre>409 Conflict</pre>
     * when an article is saved.
     * @param resolver The resolver
     */
    registerConflictHandler(reason, resolver) {
        this.config.conflictResolvers.set(reason, resolver)
    }

    getConflictHandler(reason) {
        return this.config.conflictResolvers.get(reason)
    }

    /**
     * Loads /api/config endpoint and stores it in configurator
     * Checks if http status code is 200 otherwise throw an exception
     * @param {string} configURL The URL to the config endpoint
     * @returns {Promise.<TResult>|*}
     * @throws Error
     */
    loadConfigJSON(configURL) {
        return fetch(configURL, {
            credentials: "same-origin"
        })
            .then((response) => {
                if (response.status === 200) {
                    return response
                } else {
                    var error = new Error("Failed to load config file")
                    error.response = response
                    throw error
                }
            })
            .then(response => response.json())
            .then((json) => {
                this.config.writerConfigFile = json
            })
    }

    /**
     * Returns the newsItemTemplateId from the configFile
     * @returns {*}
     */
    getNewsItemTemplateId() {
        try {
            return this.config.writerConfigFile.newsItemTemplateId
        }
        catch (_) {
            throw new Error('Could not find newsItemTemplateId in configuration')
        }

    }

    // Custom tools registration

    /**
     * Adds a tool component to the content menu, aka. pen icon
     * @param toolName
     * @param ToolClass
     */
    addContentMenuTool(toolName, ToolClass) {
        const options = {
            toolGroup: 'content-menu'
        }

        super.addTool(toolName, ToolClass, options)
    }

    addContentMenuTopTool(toolName, ToolClass) {
        const options = {
            toolGroup: 'content-top-menu'
        }

        super.addTool(toolName, ToolClass, options)
    }

    addContextMenuTool(toolName, ToolClass) {
        const options = {
            toolGroup: 'context-menu-primary'
        }

        super.addTool(toolName, ToolClass, options)
    }

    /**
     * Adds a tool that will displayed in overlay/annotations
     * @param toolName
     * @param ToolClass
     */
    addOverlayTool(toolName, ToolClass) {
        const options = {
            toolGroup: 'overlay'
        }

        super.addTool(toolName, ToolClass, options)
    }


    /**
     * Adds a text edit component placed above or below the editor
     * Will be exported into the header group in IDF section
     * @param name
     * @param componentClass
     */
    addTextEditComponent(nodeType, componentClass, options) {

        this.config.textEditComponents.push({
            nodeType: nodeType,
            componentClass: componentClass,
            options: options
        })

        super.addComponent(nodeType, componentClass)
    }

    getTextEditComponents() {
        return this.config.textEditComponents
    }

}

export default NPWriterConfigurator
