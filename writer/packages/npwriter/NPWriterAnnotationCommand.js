import {AnnotationCommand} from 'substance'

class NPWriterAnnotationCommand extends AnnotationCommand {

    constructor(...args) {
        super(...args)
    }

    isDisabled(sel) {
        if(sel.isNull()) {
            return true
        }

        // If srufaceId contains body/XXX its inside a isolated node
        // Then get the current node from selection
        // Find the plugin with that name
        // Check if there is a disableUseOfAnnotationTools parameter in the config
        if(sel.surfaceId.indexOf('body/') >= 0) {
            const doc = sel.getDocument()
            const nodeId = sel.getNodeId()
            const path = sel.path
            const nodeField = path[1]
            const currentNode = doc.get(nodeId)
            const pluginName = currentNode.type
            const plugins = writer.api.pluginManager.pluginPackages.find((pluginPackage) => {
                return pluginPackage.pluginConfigObject.name === pluginName
            })

            if(!plugins.pluginConfigObject.data) {
                return false
            }

            try {
                // If we want to disable annotation tools for plugin
                if(plugins.pluginConfigObject.data && plugins.pluginConfigObject.data.disableUseOfAnnotationTools) {
                    return true
                }
                // If we want to disable anootations tools for some fields in the plugin
                else if(plugins.pluginConfigObject.data && plugins.pluginConfigObject.data.disableUseOfAnnotationToolsForFields) {
                    const fields = plugins.pluginConfigObject.data.disableUseOfAnnotationToolsForFields
                    if(fields.indexOf(nodeField) >= 0) {
                        return true
                    }
                }
            }
            catch(_) {
            }

        }

        // TODO: Container selections should be valid if the annotation type
        // is a container annotation. Currently we only allow property selections.
        if (!sel || sel.isNull() || !sel.isAttached() || sel.isCustomSelection()||
            sel.isNodeSelection() || sel.isContainerSelection()) {
            return true
        }
        return false
    }
}

export default NPWriterAnnotationCommand