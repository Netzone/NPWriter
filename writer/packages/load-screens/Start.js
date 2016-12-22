import { Component } from 'substance'
import './scss/start.scss'

class Start extends Component {

    render($$) {
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
                this.renderLoader($$)
            ])

        return el
    }

    renderLoader($$) {
        return $$('div').addClass('npw-start-splash')
            .append($$('div').addClass('headline flash'))
            .append($$('ul')
                .append($$('li').addClass('medium flash'))
                .append($$('li').addClass('short flash'))
                .append($$('li').addClass('long flash'))
                .append($$('li').addClass('medium flash'))
                .append($$('li').addClass('medium flash'))
                .append($$('li').addClass('long flash'))
                .append($$('li').addClass('short flash'))
            )
    }
}

export default Start
