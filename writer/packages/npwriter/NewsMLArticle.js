import {Document} from 'substance'

/**
  NewsMLDocument (document) implementation
*/
class NewsMLArticle extends Document {

    constructor(...args) {
        super(...args)

        this.pluginManager = null
        this.xmlDocument = null
    }

}

export default NewsMLArticle
