import { DocumentNode } from 'substance'

class NewsItemNode extends DocumentNode {}

NewsItemNode.type = 'newsItem'

NewsItemNode.schema = {
    guid: { type: 'string', default: '' },
    xmlLang: { type: 'string', default: 'sv' }
}

export default NewsItemNode
