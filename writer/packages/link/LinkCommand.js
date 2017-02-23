import NPWriterAnnotationCommand from '../npwriter/NPWriterAnnotationCommand'

class LinkCommand extends NPWriterAnnotationCommand {
    /*
     On link creation we collapse the selection, as this is a condition for the
     EditLinkTool to be shown (see EditAnnotationCommand)
     */
    executeCreate(params) {
        let result = super.executeCreate(params)
        let editorSession = this._getEditorSession(params)
        editorSession.transaction((tx) => {
            tx.setSelection(tx.selection.collapse())
        })
        return result
    }
}

export default LinkCommand
