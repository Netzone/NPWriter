import {XMLImporter} from 'substance'
import isArray from 'lodash/isArray'
import find from 'lodash/find'
/**
 * NewsMLImporter Importer
 */
class NewsMLImporter extends XMLImporter {

    /**
     *
     * @param newsItemEl
     * @returns {*}
     */
    getFirstElementWithTypeElement(newsItemEl) {
        if (isArray(newsItemEl)) {
            return find(newsItemEl, function (el) {
                try {
                    if (el.nodeType === 'element') {
                        return true;
                    }
                } catch (e) {
                }

            });
        } else {
            return newsItemEl;
        }
    }

    convertDocument(newsItemEl) {
        const newsItemElement = this.getFirstElementWithTypeElement(newsItemEl);
        let itemMetaElement = newsItemElement.find('itemMeta')
        if (!itemMetaElement) throw new Error('<itemMeta> is mandatory.')
        let contentMetaElement = newsItemElement.find('contentMeta')
        if (!contentMetaElement) throw new Error('<contentMeta> is mandatory.')

        let guid = newsItemElement.getAttribute('guid')
        this.createNode({
            type: 'newsItem',
            id: 'newsItem',
            guid: guid
        })
        let itemMeta = this.createNode({
            type: 'container',
            id: 'itemMeta',
            nodes: []
        })
        let contentMeta = this.createNode({
            type: 'container',
            id: 'contentMeta',
            nodes: []
        })

        itemMetaElement.children.forEach((childElement) => {
            let childNode = this.convertElement(childElement)
            itemMeta.nodes.push(childNode.id)
        })

        contentMetaElement.children.forEach((childElement) => {
            let childNode = this.convertElement(childElement)
            contentMeta.nodes.push(childNode.id)
        })

        // TODO: teaser could go into news-item node, by its own editor
        // or pick the first teaser in contentMeta.

        const groups = newsItemElement.findAll('idf > group[type="body"]');
        const headerGroup = newsItemElement.find('idf > group[type="header"]');

        // Convert headergroup if it exist
        if (headerGroup) {
            this.convertElement(headerGroup);
        }

        // Convert body groups
        groups.forEach((groupEl) => {
            const teaserEl = newsItemElement.findAll('contentMeta > metadata > object[type="x-im/teaser"]');
            if (teaserEl && teaserEl.length === 1) {

                const teaser = teaserEl[0]
                const teaserPosition = this.context.api.getConfigValue('se.infomaker.ximteaser', 'teaserPosition', 'bottom')
                // Teaser at top
                if (teaserPosition === 'top') {
                    const parent = groupEl.el
                    const firstChild = groupEl.children[0]
                    parent.insertBefore(teaser.el, firstChild.el)
                } else {

                    // Teaser at the bottom
                    groupEl.append(teaser);
                }
            }

            this.convertElement(groupEl);
        })
    }
}


export default NewsMLImporter
