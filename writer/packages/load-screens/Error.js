import { Component } from 'substance'

class Error extends Component {

    render($$) {
        const error = this.props.error
        const errorContainer = $$('div').addClass('npw-error-container')

        // Create and append the Error header
        const title = $$('h1').append(this.props.getLabel('error-page-Error'))
        errorContainer.append(title)

        /*
            Check if this error is an instance of Response, this means that
            a fetch has gone bad and we have certain information available
            such as the status code, url and status text from the server
         */
        if(error instanceof Response) {

            // If status is 404 which means that the article wasn't found we provide a human readable message
            if(error.status === 404) {
                const humanMessage = $$('p').addClass('error-human-readable').append(this.props.getLabel('error-page-human-readable-404'))
                errorContainer.append(humanMessage)
            }

            // Error description
            const errorDescription = $$('p').append([
                $$('span').addClass('error-label').append(this.props.getLabel('error-page-error-description')),
                $$('span').append(error.statusText)
            ])

            // Status code
            const errorCode =  $$('p').append([
                $$('span').addClass('error-label').append(this.props.getLabel('error-page-status-code')),
                $$('span').append(String(error.status))
            ])

            // Requested URL
            const errorUrl =  $$('p').append([
                $$('span').addClass('error-label').append(this.props.getLabel('error-page-status-url')),
                $$('span').append(String(error.url))
            ])

            errorContainer.append([errorDescription, errorCode, errorUrl])
        } else {
            errorContainer.append($$('p').append(error))
        }

        let el = $$('div')
            .addClass('npw-start-container')
            .append([
                $$('div')
                    .addClass('npw-start-top')
                    .append(
                        $$('div')
                            .append(
                                $$('img')
                                    .attr({
                                        src: '/writer/assets/icon.svg'
                                    })
                            )
                    ),
                errorContainer
            ])

        return el

    }
}

export default Error