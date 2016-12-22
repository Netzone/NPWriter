import {Component} from 'substance'

class AboutComponent extends Component {

    constructor(...args) {
        super(...args)
    }

    didMount() {
        this.props.popover.setStatusText(
            this.getLabel('version')
        )
    }

    render($$) {
        return $$('div')
            .addClass('sc-np-about-popover')
            .append([
                $$('img').attr({
                    src: '/writer/assets/icon.svg',
                    width: '18px'
                }),
                $$('h2').append(
                    this.getLabel('about-header')
                ),
                $$('p').append(
                    this.getLabel('about-description')
                ).css('margin', '20px 0'),
                $$('h3').addClass('clear').append(
                    this.getLabel('about-credits')
                ),
                this.appendCredits($$),
                $$('p').append([
                    $$('a').attr({
                        'href': 'http://www.infomaker.se',
                        'target': '_blank'
                    }).append('Infomaker Scandinavia AB')
                ]).css('text-align', 'right'),
                $$('div').append(
                    $$('button')
                        .addClass('sc-np-btn btn-secondary')
                        .append(
                            this.getLabel('Ok')
                        )
                        .on('click', () => {
                            this.props.popover.close()
                        })
                )
            ])
    }

    appendCredits($$) {
        let el = $$('ul').addClass('fa-ul')

        el.append(
            $$('li').append(
                'Danne Lundqvist'
            )
            .addClass('fa-li fa fa-user')
        )

        el.append(
            $$('li').append(
                'Andreas Kihlberg'
            )
            .addClass('fa-li fa fa-user')
        )

        el.append(
            $$('li').append(
                'Ola Andersson'
            )
            .addClass('fa-li fa fa-user')
        )

        el.append(
            $$('li').append(
                'Tobias Södergren'
            )
            .addClass('fa-li fa fa-user')
        )

        el.append(
            $$('li').append(
                'Substance.io, FontAwesome.io'
            )
            .addClass('fa-li fa fa-code')
        )

        return $$('p')
            .addClass('credits').append(el)
    }
}

export default AboutComponent
