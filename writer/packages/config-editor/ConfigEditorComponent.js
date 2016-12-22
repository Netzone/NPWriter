import {Component} from 'substance'
import './config-editor.scss'

class ConfigEditorComponent extends Component {

    didMount() {

        this.context.api.router.get('/api/config')
            .then(response => response.json())
            .then((json) => {

                this.setState({
                    configJSON: json
                })
            })

    }

    constructor(...args) {
        super(...args)
    }

    render($$) {

        const el = $$('div').addClass('config-editor')

        const textarea = $$('textarea')
            .addClass('config-editor__textarea')
            .val(JSON.stringify(this.state.configJSON, null, 4))
            .ref('config')

        const save = $$('button').addClass('sc-np-btn btn-primary').on('click', this.save).append('Save')
        const validate = $$('button').addClass('sc-np-btn btn-secondary float-xs-right').on('click', this.validateJSON).append('Validate')


        el.append([textarea, validate, save])
        return el
    }

    save() {
        const config = this.refs.config.val()
        if (this.isJsonString(config)) {
            console.log("Save", config);

            const endpoint = this.context.api.router.getEndpoint()
            const url = endpoint + "/api/config"

            fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: config
            }).then((response) => {
                console.log("Response", response);
            })
        } else {
            console.log("Invalid Json");
        }
    }

    isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    validateJSON() {
        const config = this.refs.config.val()
        if (this.isJsonString(config)) {
            console.log("Save", config);
        } else {
            console.log("Invalid Json");
        }
    }


}

export default ConfigEditorComponent