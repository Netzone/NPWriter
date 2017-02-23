import './scss/about.scss'

import AboutComponent from './AboutComponent'

export default {
    name: 'about',
    configure: function(config) {
        const aboutVersion = "NP Writer 3.0 beta 1"

        config.addPopover(
            'npwriterabout',
            {
                icon: '/writer/assets/icon.svg',
                align: 'left',
                css: {
                    width: '30px',
                    height: '30px'
                }
            },
            AboutComponent
        )

        config.addLabel('about-header', {
            en: aboutVersion,
            sv: aboutVersion,
            nl: aboutVersion,
            fi: aboutVersion,
            no: aboutVersion,
            dk: aboutVersion
        })

        config.addLabel('Newspilot Writer is brought to you by Infomaker Scandinavia AB and was first released in early 2016.', {
            sv: "Newspilot Writer skapad av Infomaker Scandinavia AB och släpptes första gången våren 2016."
        })

        config.addLabel('Core team and credits', {
            sv: "Team och credits",
        })
    }
}
