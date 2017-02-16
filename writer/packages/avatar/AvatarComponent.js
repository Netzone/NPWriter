import { Component, FontAwesomeIcon } from 'substance'
import { isObject, isArray } from 'lodash'
import md5 from 'md5'

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

        const el = $$('span').addClass('avatar__container')

        if(!avatarId) {
            return el.append(this._getDummyAvatarComponent($$))
        }

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
            case 'gravatar': {
                contentElement = $$('img').addClass('avatar').attr('src', this.generateGravatarUrl(avatarId))
                break
            }
            default:
                contentElement = this._getDummyAvatarComponent($$)
        }

        return el.append(contentElement)
    }

    generateGravatarUrl(email) {
        const hashedEmail = md5(email)
        return `https://www.gravatar.com/avatar/${hashedEmail}?d=${encodeURI('https://dl.dropboxusercontent.com/u/2455273/fa-user-128.png')}`
    }

    /**
     * Returns a component with a Font Awesome showing the fa-user icon
     * @returns {Component} A substance FontAwesomeIcon
     */
    _getDummyAvatarComponent($$) {
        return $$(FontAwesomeIcon, { icon: 'fa-user' }).addClass('avatar--simple')
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

        const path = '/api/concepts/author/' + avatarId + '/thumbnail';

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

    /**
     * Fetches the Twitter url for an author
     * @returns {string|undefined}
     */
    static _getTwitterUrlFromAuhtorLink(link) {
        return AvatarComponent.findAttribute(link, '@url')
    }

    /**
     * Finds a links object for a specific type.
     * Checks if it's array or and object.
     */
    static _getLinkForType(links, type) {
        // const links = this.state.loadedAuhtorLinks.link
        if (!links) {
            return undefined
        }
        if (isObject(links) && links['@type'] === type) {
            return links
        } else if (isArray(links)) {
            return links.find((link) => {
                return link['@type'] === type
            })
        }

    }

    /**
     * Returns the Twitter handle from an URL
     */
    static _getTwitterHandleFromTwitterUrl(url) {

        const twitter = url.match(/twitter\.com\/(\w+)/);
        if (twitter === null) {
            return undefined
        }
        return twitter[1]
    }

    static findAttribute(object, attribute) {
        var match;

        function iterateObject(target, name) {
            Object.keys(target).forEach(function (key) {
                if (isObject(target[key])) {
                    iterateObject(target[key], name);
                } else if (key === name) {
                    match = target[key];
                }
            })
        }

        iterateObject(object, attribute)

        return match ? match : undefined;
    }
}
export default AvatarComponent