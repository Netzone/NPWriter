import { Component, FontAwesomeIcon } from 'substance'


class AvatarComponent extends Component {

    getInitialState() {
        return {
            avatarIsLoaded: false,
            loadHasError: false
        }
    }

    render($$) {

        const avatarId = this.props.avatarId
        const avatarSource = this.props.avatarSource

        const el = $$('span')
        let contentElement = this._getDummyAvatarComponent($$)
        switch (avatarSource) {
            case 'twitter':
                if (!this.state.avatarIsLoaded) {
                    this.loadAvatarUrlForAvatarId(avatarId)
                } else if (this.state.avatarIsLoaded && this.state.loadHasError) {
                    contentElement = this._getDummyAvatarComponent($$)
                } else if (this.state.avatarIsLoaded) {
                    contentElement = $$('img').addClass('avatar').attr('src', this.state.avatarUrl)
                }
                break

            default:
                contentElement = this._getDummyAvatarComponent($$)
        }

        return el.append(contentElement)
    }

    /**
     * Returns a component with a Font Awesome showing the fa-user icon
     * @returns {Component} A substance FontAwesomeIcon
     */
    _getDummyAvatarComponent($$) {
        return $$(FontAwesomeIcon, { icon: 'fa-user' })
    }

    /**
     * Triggers an AJAX request to fetch the image url
     * for a avatarId through the concepts backend server
     * If it success it sets the url in the state.
     * If failes if sets the state with error message and error status
     * 
     * @param {string} avatarId - The Twitter handle
     */
    loadAvatarUrlForAvatarId(avatarId) {

        if (!avatarId) {
            this.setState({
                avatarIsLoaded: true,
                loadHasError: true
            })
        }

        var path = '/api/concepts/author/' + avatarId + '/thumbnail';

        this.context.api.router.get(path)
            .then((response) => {
                return this.context.api.router.checkForOKStatus(response)
            })
            .then((response) => {
                return response.text()
            })
            .then(url => {
                this.setState({
                    avatarIsLoaded: true,
                    loadHasError: false,
                    avatarUrl: url
                })

            })
            .catch((error) => {
                this.setState({
                    avatarIsLoaded: true,
                    loadHasError: true,
                    errorMessage: error
                })
            })
    }

}
export default AvatarComponent