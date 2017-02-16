import {SplitPane, ScrollPane, SpellCheckManager, AbstractEditor} from "substance";
import SidebarComponent from "./components/SidebarComponent";
import DialogMessageComponent from "../dialog/DialogMessageComponent";
import BarComponent from "./../../components/bar/BarComponent";
import DialogPlaceholder from "../dialog/DialogPlaceholder";
import Event from "../../utils/Event";
import debounce from "../../utils/Debounce";
import NPResourceManager from "./NPResourceManager";

class NPWriter extends AbstractEditor {

    _initialize(...args) {
        super._initialize(...args)

        // Override Substance resource manager(anager)
        this.ResourceManageranager = new NPResourceManager(this.editorSession, this.getChildContext())

        this.props.api.setWriterReference(this);

        // When document is changed we need to save a local version

        let documentIsInvalid = false;

        this.props.api.events.on('npwritercomponent', Event.DOCUMENT_CHANGED, () => {
            if (!documentIsInvalid) {
                this.addVersion()
            }
        })

        this.props.api.events.on('npwritercomponent', Event.DOCUMENT_INVALIDATED, () => {
            documentIsInvalid = true;
        })

        this.spellCheckManager = new SpellCheckManager(this.editorSession, {
            wait: 400,
            // same URL as configured in /server/routes/spellcheck.js
            apiURL: '/api/spellcheck'
        })

        this.addVersion = debounce(() => {
            if (documentIsInvalid) {
                return
            }
            this.props.api.history.snapshot();
        }, 7000)
    }

    constructor(...args) {
        super(...args)

        const actionHandlers = {}

        actionHandlers[Event.DIALOG_CLOSE] = () => {
            this.hideDialog()
        }

        this.handleActions(actionHandlers)

        this.props.api.events.on('__internal', Event.DOCUMENT_SAVE_FAILED, (e) => {

            try {
                const reason = (e.data && e.data.reason) ? e.data.reason : undefined
                const resolverClass = this.props.api.configurator.getConflictHandler(reason)

                if (resolverClass) {

                    const uuid = (e.data && e.data.uuid) ? e.data.uuid : undefined

                    this.props.api.ui.showDialog(
                        resolverClass,
                        {
                            uuid: uuid,
                            error: e,
                            close: this.hideDialog.bind(this)
                        },
                        {
                            title: this.props.api.getLabel("A problem occurred"),
                            primary: false,
                            global: true
                        }
                    )
                    return;
                }

            } catch (e) {
                // Got error when resolving resolver, continuing
                console.log("Error resolving conflict handler", e)
            }

            // Default behavior
            const errorMessages = e.data.errors.map((error) => {
                return {
                    type: 'error',
                    message: error.error
                }
            })
            this.props.api.ui.showMessageDialog(errorMessages)

        })

        // Warn user before navigating away from unsaved article
        this.promptUserBeforeUnload = false

        this.props.api.events.on('__internal', Event.DISABLE_UNLOAD_WARNING, () => {
            this.promptUserBeforeUnload = false
        })

        this.props.api.events.on('__internal', Event.DOCUMENT_CHANGED, () => {
            this.promptUserBeforeUnload = true
        })

        this.props.api.events.on('__internal', Event.DOCUMENT_SAVED, () => {
            this.promptUserBeforeUnload = false
            this.updateTitle()
        })

        window.addEventListener('beforeunload', (e) => {
            if (this.promptUserBeforeUnload) {
                var message = 'Document is not saved'
                e.returnValue = message
                return message
            }
        });

        let resizeTimeout
        window.addEventListener(
            "resize",
            (ev) => {
                if (!resizeTimeout) {
                    resizeTimeout = setTimeout(() => {
                        resizeTimeout = null;
                        this.props.api.events.triggerEvent('__internal', Event.BROWSER_RESIZE, ev);
                    }, 66); // About 15 fps
                }
            },
            false
        )

        this.updateTitle()

        // window.addEventListener('unload', () => {
        //     this.props.api.history.deleteHistory(
        //         this.props.api.newsItem.getIdForArticle()
        //     )
        // })
    }


    didMount() {
        super.didMount()

        this.spellCheckManager.runGlobalCheck()
        this.editorSession.onUpdate(this.editorSessionUpdated, this)
    }


    editorSessionUpdated(data) {
        if (!data._change || data._info.history === false) {
            // Don't trigger document change for internal changes that the user cannot undo/redo
            return
        }

        this.addVersion()

        this.props.api.events.documentChanged(null, {
            type: 'edit',
            action: 'edit',
            data: data._change
        })
    }

    dispose() {
        super.dispose()

        this.props.api.events.off('npwritercomponent', Event.DOCUMENT_CHANGED)
        // this.spellCheckManager.dispose()
    }


    render($$) {

        const el = $$('div')
            .addClass('sc-np-writer').ref('npwriter')


        el.append(
            this._renderMainbarPanel($$),
            $$(SplitPane, {splitType: 'vertical'}).ref('splitPane').append(
                this._renderMainSection($$),
                this._renderSidebarPanel($$)
            ),
            this._renderModalContainer($$),
            this._renderNotificationArea($$)
        )


        return el
    }

    /**
     * This renders a placeholder for the modal window that's always available
     * @param $$
     * @returns {*}
     * @private
     */
    _renderModalContainer($$) {
        return $$(DialogPlaceholder, {}).addClass('modal-placeholder').ref('modalPlaceholder')

    }

    _renderNotificationArea($$) {
        const NotificationList = this.getComponent('notification-list')

        return $$(NotificationList).ref('notification-area')
    }

    _renderMainbarPanel($$) {
        return $$(BarComponent, {
            popovers: this.props.configurator.config.popovers
        }).ref('topBar')
    }

    _renderSidebarPanel($$) {
        return $$(SidebarComponent).ref('sidebar')
    }

    _renderMainSection($$) {
        let mainSection = $$('div').addClass('se-main-section').ref('main-section')

        mainSection.append(
            this._renderContentPanel($$)
        )
        return mainSection
    }

    getComponent(name) {
        return this.componentRegistry.get(name)
    }

    _renderHeaderEditors($$) {

        const headerEditorContainer = $$('div').addClass('se-header-editor-container')

        const doc = this.editorSession.getDocument()
        var textEditComponents = this.props.configurator.getTextEditComponents()

        let textEditors = textEditComponents.map((editTextComponent) => {

            let node = doc.get(editTextComponent.nodeType)
            if (!node) {
                return null
            }
            let component = this.getComponent(editTextComponent.nodeType)

            return $$(component, {
                node: node,
                name: 'headerEditor',
                containerId: 'headereditor',
            })
        });

        headerEditorContainer.append(textEditors)

        return headerEditorContainer
    }

    _renderContentPanel($$) {
        const doc = this.editorSession.getDocument()
        const body = doc.get('body')
        let configurator = this.props.configurator
        let ContextMenu = this.getComponent('npw-context-menu')
        const OverlayMenu = this.getComponent('npw-overlay-menu')
        const ContentMenu = this.getComponent('npw-content-menu')
        const BodyComponent = this.getComponent('body')
        const DropTeaser = this.getComponent('drop-teaser')

        let contentPanel = $$(ScrollPane, {
            scrollbarType: 'native',
            contextMenu: 'custom'
        }).ref('contentPanel')

        let layout = $$('div').addClass('se-layout')

        layout.append(
            $$(BodyComponent, {
                node: body,
                commands: configurator.getSurfaceCommandNames(),
                textTypes: configurator.getTextTypes(),
                // spellcheck: 'native'
            })
        )

        contentPanel.append([
            this._renderHeaderEditors($$),
            layout,
            $$(ContextMenu),
            $$(OverlayMenu),
            $$(ContentMenu),
            $$(DropTeaser)

        ])
        return contentPanel
    }

    _scrollTo(nodeId) {
        this.refs.contentPanel.scrollTo(nodeId)
    }


    hideDialog() {
        if (this.refs.modalPlaceholder) {
            this.refs.modalPlaceholder.setProps({
                showModal: false
            })
        }

    }

    /**
     *
     * @param {Component} contentComponent The component passed in by the user, Should be instance of a Substance Component
     * @param {object} props An object passed by user that is later reached by this.props in the contentComponent
     * @param {object} options Options passed to the DialogComponent
     */
    showDialog(contentComponent, props, options) {
        this.refs.modalPlaceholder.setProps({
            showModal: true,
            contentComponent: contentComponent,
            props: props,
            options: options
        })
    }

    showMessageDialog(messages, props, options) {
        props.messages = {
            error: [],
            warning: [],
            info: [],
            title: []
        };

        for (var n = 0; n < messages.length; n++) {
            switch (messages[n].type) {
                case 'error':
                    props.messages.error.push(messages[n]);
                    break;
                case 'warning':
                    props.messages.warning.push(messages[n]);
                    break;
                case 'title':
                    props.messages.title.push(messages[n]);
                    break;
                default:
                    props.messages.info.push(messages[n]);
            }
        }
        this.refs.modalPlaceholder.setProps({
            showModal: true,
            contentComponent: DialogMessageComponent,
            props: props,
            options: options
        })

    }

    /**
     * Uses the document nodes to set the browser tab/window title
     * Uses an array to specify which nodeType that should be used as title
     * Uses only the first nodeType in the array and omits the others
     *
     * If no nodeType is found the title should be "Newspilot Writer"
     */
    updateTitle() {
        const documentNodes = this.props.api.document.getDocumentNodes()
        const nodeTypeToUseForTitle = [
            'headline',
            'preamble',
            'paragraph'
        ]

        let nodeToUse
        nodeTypeToUseForTitle.some((nodeType) => {
            const docNode = documentNodes.find((node) => {
                return node.type === nodeType ? node : false
            })

            if (docNode) {
                nodeToUse = docNode
                return true
            }
        })
        let title = 'Newspilot Writer'
        if (nodeToUse) {
            title = nodeToUse.content.substr(0, 100)
        }
        this.props.api.browser.setTitle(title)
    }
}

export default NPWriter
