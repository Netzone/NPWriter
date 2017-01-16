import { createAnnotation, insertText, NodeSelection, deleteNode, insertNode } from 'substance'
import idGenerator from '../utils/IdGenerator'

/**
 * @class Document
 *
 * Document manipulation methods. All methods available directly in the
 * context.api object.
 */
class Document {

    constructor(api) {
        this.api = api
    }


    triggerFetchResourceNode(node, info) {

        this.api.writer.ResourceManageranager.triggerFetch(node, info)
    }

    /**
     * Insert an inline node at current selection
     * @param {string} name The plugin which inserts inline node
     * @param {object} data Data defined by node schema
     * @returns {*}
     */
    insertInlineNode(name, data) {

        const surface = this.api.editorSession.getFocusedSurface();
        if (!surface) {
            throw new Error("Trying to insert node with no active surface");
        }
        return surface.transaction((tx, args) => {
            // 1. Insert fake character where the citation should stick on
            args = insertText(tx, {
                selection: args.selection,
                text: '$'
            });
            var citationSel = this.api.editorSession.createSelection({
                type: 'property',
                path: args.selection.path,
                startOffset: args.selection.endOffset - 1,
                endOffset: args.selection.endOffset
            });

            // 2. Create citation annotation
            args.annotationType = name;
            args.annotationData = data;
            args.selection = citationSel;
            args.splitContainerSelections = false;
            args.containerId = surface.getContainerId();

            args = createAnnotation(tx, args);
            return args;
        });
    }


    /**
     * Function to insert block node at current selection
     *
     * @param {string} name Plugin that's inserting block node
     * @param {object} data Data defined by node
     */
    insertBlockNode(name, data) {

        let editorSession = this.api.editorSession;
        let surface = editorSession.getFocusedSurface();
        let result;

        if (!surface) {
            throw new Error("Trying to insert node with no active surface");
        }

        // Add type and a generated id if not provided
        data.type = !data.type ? name : data.type;
        data.id = !data.id ? idGenerator() : data.id;

        editorSession.transaction((tx, args) => {
            args.node = data;
            args.containerId = 'body';
            result = insertNode(tx, args);
            // NOTE: need to return result here, so that the selection is set
            return result
        });

        return result;
    }


    /**
     * Retrieve the previous node.
     * Uses the focused surface to get all nodes in that surface/container and
     * then returns the previous node from the one sent in
     * @param {string} nodeId
     * @returns {*}
     */
    getPreviousNode(nodeId) {
        const editorSession = this.api.editorSession;
        const surface = editorSession.surfaceManager.getFocusedSurface()
        const doc = editorSession.getDocument()
        const surfaceNode = doc.get(surface.id)
        const surfaceNodes = surfaceNode.nodes
        const currentNodeIndex = surfaceNodes.indexOf(nodeId)
        const previousNodeId = surfaceNodes[currentNodeIndex - 1]

        if (currentNodeIndex === 0 || currentNodeIndex === -1) {
            return undefined
        }
        return doc.get(previousNodeId)
    }

    /**
     * Deletes a node from the document.
     * Triggers a 'document:changed' event to all document:changed listeners except
     * the plugin making the change.
     *
     * @param {string} name Plugin name
     * @param {object} node Node to delete, must contain an id
     * @example this.context.api.deleteNode(this.props.node);
     * @fires document:changed
     */
    deleteNode(name, node) {
        // TODO: is this actually always a node in the body?
        // i.e. the surface is always the body editor?
        const editorSession = this.api.editorSession;

        editorSession.transaction((tx) => {
            const surface = tx.get(tx.surfaceId)
            tx.delete(node.id)
            surface.hide(node.id)
        })

        const event = {
            type: 'document',
            action: 'delete',
            data: node.id
        }
        this.api.events.documentChanged(name, event);
    }

    /**
     * Get all nodes in the document
     * Get all nodeId:s from body container and fetch the actual node by Id
     *
     * @returns {Array}
     */
    getDocumentNodes() {
        const doc = this.api.editorSession.getDocument()

        const docNodes = doc.getNodes()['body'].nodes;
        return docNodes.map((nodeId) => {
            return doc.get(nodeId)
        })
    }


    _setDocumentStatus(newStatus) {
        this.status = newStatus
    }

    getDocumentStatus() {
        return this.status
    }

}

export default Document
