import {FileNode} from 'substance'

class NPFileNode extends FileNode {

    handleDocument(xmlString) {
        return new Promise((resolve, reject) => {
            try {
                let doc = this.document

                if (!doc.get(this.parentNodeId)) {
                    // pdf file node may exists (in order to be able to undo/redo)
                    // but pdf node is not present, just resolve.
                    return resolve()
                }

                const parser = new DOMParser()

                let newsItemDOM = parser.parseFromString(xmlString, 'text/xml')
                let document = newsItemDOM.documentElement
                let uuid = document.getAttribute('guid')

                // Update fileNode
                this.uuid = uuid

                // Get parentNode
                const parentNode = doc.get(this.parentNodeId)
                if(parentNode.handleDOMDocument) {
                    parentNode.handleDOMDocument(newsItemDOM)
                }


                resolve()
            }
            catch (e) {
                reject(e)
            }
        })
    }

}

NPFileNode.type = 'npfile'
NPFileNode.define({
    parentNodeId: {type: 'string', optional: false},
    imType: {type: 'string', optional: false},
    uuid: {type: 'string', optional: true},
    url: {type: 'string', optional: true},
    sourceFile: {type: 'object', optional: true}, // If we upload from a file
    sourceUrl: {type: 'string', optional: true}, // Upload from an url
    sourceUUID: {type: 'string', optional: true} // Added from an existing item that has a UUID
})

export default NPFileNode
