import './scss/_content-menu.scss'
import './scss/_overlay-menu.scss'
import './scss/_context-menu.scss'
import './scss/_isolated-node.scss'

// Base packages
import {BasePackage,
    StrongPackage, EmphasisPackage, LinkPackage,
    SpellCheckPackage
} from 'substance'

import StrongXmlConverter from '../strong/StrongXMLConverter'
import EmphasisXmlConverter from '../emphasis/EmphasisXMLConverter'
import LinkXMLConverter from '../link/LinkXMLConverter'

import NewsMLArticle from './NewsMLArticle'
import NewsMLImporter from './NewsMLImporter'
import NewsMLExporter from './NewsMLExporter'
import NPFileNode from './NPFileNode'

import BodyPackage from '../body/BodyPackage'
import HeadlinePackage from '../headline/HeadlinePackage'
import SubheadlinePackage from '../subheadline/SubheadlinePackage'
import ParagraphPackage from '../paragraph/ParagraphPackage'
import BlockquotePackage from '../blockquote/BlockquotePackage'
import SwitchTextTypePackage from '../switch-text-type/SwitchTextTypePackage'
import ConfigEditorPackage from '../config-editor/ConfigEditorPackage'
import DialogPackage from '../dialog/DialogPackage'
import AboutPackage from '../about/AboutPackage'
import LabelPackage from '../label/LabelPackage'
import NPWContextMenuPackage from '../npw-context-menu/NPWContextMenuPackage'
import NPWContentMenuPackage from '../npw-content-menu/NPWContentMenuPackage'
import NPWOverlayMenuPackage from '../npw-overlay-menu/NPWOverlayMenuPackage'
import NotificationPackage from '../notification/NotificationPackage'
import FormSearchPackage from '../form-search/FormSearchPackage'




export default {
    name: 'npwriter',
    configure: function (config) {
        config.defineSchema({
            name: 'newsml-article',
            ArticleClass: NewsMLArticle,
            defaultTextType: 'paragraph'
        })

        // basics
        config.import(BasePackage)

        //Content menu, context menu, overlay
        config.addToolGroup('content-menu')
        config.addToolGroup('content-top-menu')

        // core nodes
        config.import(StrongPackage, {toolGroup: 'overlay'})
        config.import(EmphasisPackage, {toolGroup: 'overlay'})
        config.import(LinkPackage, {toolGroup: 'overlay'})

        // content-nodes
        config.import(BodyPackage)
        config.import(HeadlinePackage)
        config.import(SubheadlinePackage)
        config.import(ParagraphPackage)
        config.import(BlockquotePackage)

        config.import(ConfigEditorPackage)

        config.import(DialogPackage)
        config.import(AboutPackage)
        // general purpose
        config.import(SwitchTextTypePackage)

        config.addIcon('content-menu-open', {'fontawesome': 'fa-pencil'});
        config.addIcon('content-menu-close', {'fontawesome': 'fa-times'});

        // Override Importer/Exporter
        config.addImporter('newsml', NewsMLImporter)
        config.addExporter('newsml', NewsMLExporter)

        config.addConverter('newsml', LinkXMLConverter)
        config.addConverter('newsml', StrongXmlConverter)
        config.addConverter('newsml', EmphasisXmlConverter)

        // File store extensions
        config.addNode(NPFileNode)

        config.import(SpellCheckPackage)

        // Add a label package overriding and adding swedish translation to substance
        config.import(LabelPackage)

        //Notification
        config.import(NotificationPackage)

        // Form search
        config.import(FormSearchPackage)

        config.import(NPWContentMenuPackage)
        config.import(NPWContextMenuPackage)
        config.import(NPWOverlayMenuPackage)
    }
}
