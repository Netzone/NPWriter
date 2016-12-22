import './scss/about.scss'

import AboutComponent from './AboutComponent'

export default {
    name: 'about',
    configure: function(config) {
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

        config.addLabel('version', {
            en: "NP Writer 3.0 alpha",
            sv: "NP Writer 3.0 alpha"
        })

        config.addLabel('about-header', {
            en: "NP Writer 3.0 alpha",
            sv: "NP Writer 3.0 alpha"
        })

        config.addLabel('about-description', {
            en: "Newspilot Writer is brought to you by Infomaker Scandinavia AB and was first released in early 2016.",
            sv: "Newspilot Writer skapad av Infomaker Scandinavia AB och släpptes första gången våren 2016."
        })

        config.addLabel('about-credits', {
            en: "Core team and credits",
            sv: "Team och credits",
        })
    }
}
