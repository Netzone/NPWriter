import {Command} from 'substance'

class NPWriterCommand extends Command {

    getCommandState(params) {
        return {
            disabled: params.surface && params.surface.name === 'body' ? false : true
        }
    }

}

export default NPWriterCommand