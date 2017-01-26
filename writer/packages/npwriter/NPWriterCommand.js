import {Command} from 'substance'

class NPWriterCommand extends Command {

    getCommandState(params) {

        let isDisabled = true

        // Check if this is a nodeSelection, in that case the contentMenu tools should be disabled
        if(params.surface && params.selection.isNodeSelection()) {
            isDisabled = true
        } else if(params.surface && params.surface.name === 'body') {
            isDisabled = false
        }

        return {
            disabled: isDisabled
        }
    }

}

export default NPWriterCommand