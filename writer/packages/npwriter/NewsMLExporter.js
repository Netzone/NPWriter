import {XMLExporter, DefaultDOMElement} from 'substance'
import {Fragmenter} from 'substance'
class NewsMLExporter extends XMLExporter {

    constructor(...args) {
        super(...args)
    }

    removeElementIfExists(textEditElement, existingChildren) {
        existingChildren.forEach((child) => {
            if (textEditElement.el.tagName === child.nodeName && textEditElement.el.getAttribute('type') === child.getAttribute('type')) {
                child.remove()
            }
        })
    }

    addHeaderGroup(doc, newsItem, $$, groupContainer) {

        const idfHeaderGroup = newsItem.querySelector('idf group[type="header"]')
        if(!idfHeaderGroup) {
            return
        }

        const textEditComponents = this.context.api.configurator.getTextEditComponents()

        let headerElements = textEditComponents.map((textEditComponent) => {
            const node = doc.get(textEditComponent.nodeType)
            if(node) {
                const convertedTextEdit = this.convertNode(node)
                return convertedTextEdit.childNodes
            }
        }).filter((headerElement) => {
            if(headerElement) {
                return headerElement
            }
        })

        if (headerElements && headerElements.length > 0) {
            headerElements.forEach((elements) => {
                elements.forEach(element => {
                    this.removeElementIfExists(element, idfHeaderGroup.childNodes)
                    idfHeaderGroup.appendChild(element.el)
                })
            })
        }
    }

    addBodyGroup(doc, newsItem, groupContainer) {
        // Get the first group with type body in IDF section
        var idfBodyGroupNode = newsItem.querySelector('idf group[type="body"]');
        if (!idfBodyGroupNode) {
            throw new Error('IDF node not found!');
        }

        // Export article body with substance convert container function
        // Create a substance group element to make life easier
        var bodyElements = this.convertContainer(doc.get('body'));
        var bodyGroup = document.createElement('group')
        bodyGroup.setAttribute('type', 'body');

        for (var node of bodyElements) {
            bodyGroup.appendChild(node.el);
        }

        // Reinsert the body group
        let parser = new DOMParser()
        // var articleDomElement = parser.parseFromString(removeControlCodes(bodyGroup.outerHTML), 'application/xml');

        const articleDomElement = DefaultDOMElement.parseXML(removeControlCodes(bodyGroup.outerHTML))

        groupContainer.removeChild(idfBodyGroupNode);
        // Append body group
        groupContainer.appendChild(articleDomElement.el)


    }

    addTeaser(newsItem, groupContainer) {
        // Extract x-im/teaser object and move it to its correct position if it exists
        var oldTeaser = newsItem.querySelector('contentMeta > metadata > object[type="x-im/teaser"]');
        var metadata = newsItem.querySelector('contentMeta > metadata');
        if (oldTeaser) {
            metadata.removeChild(oldTeaser);
        }

        var newTeaser = groupContainer.querySelector('object[type="x-im/teaser"]');

        if (newTeaser) {
            newTeaser.parentElement.removeChild(newTeaser);
            metadata.appendChild(newTeaser);
        }
    }

    getNodesForPlugin(pluginId) {
        const nodes = this.state.doc.getNodes()

        // get nodes for plugin
        const pluginNodes = Object.keys(nodes).map((nodeKey) => {
            if (nodes[nodeKey].type === pluginId) {
                return nodes[nodeKey]
            }
        }).filter((node) => {
            return node !== undefined
        })

        return pluginNodes
    }

    exportDocument(doc, newsItemArticle) {

        this.state.doc = doc
        const $$ = this.$$

        const auhtorNodes = this.getNodesForPlugin('ximauthor')

        const authorsLinks = auhtorNodes.map((node) => {
            return this.convertNode(node)
        })


        const groupContainer = newsItemArticle.querySelector('idf');

        const itemMetaLinks = newsItemArticle.querySelector('itemMeta > links')
        const itemMetaAuthorLinks = newsItemArticle.querySelectorAll('itemMeta > links link[rel="author"]')

        Array.prototype.forEach.call(itemMetaAuthorLinks, (author) => {
            author.parentElement.removeChild(author)
        })

        authorsLinks.forEach((authorEl) => {
            itemMetaLinks.appendChild(authorEl.el)
        })


        this.addHeaderGroup(doc, newsItemArticle, $$, groupContainer);
        this.addBodyGroup(doc, newsItemArticle, groupContainer);
        this.addTeaser(newsItemArticle, groupContainer);

        // let articleEl = this.convertNode(doc.get('body'))
        return removeControlCodes(newsItemArticle.documentElement.outerHTML);
    }

    convert(doc, options, newsItem) {

        console.info("convert method is deprecated, use exportDocument")

        this.state.doc = doc;
        var $$ = this.$$;

        // Remove the body group and save the parent
        var groupContainer = newsItem.querySelector('idf');

        // Add converted header, body group and add teaser
        // this.addHeaderGroup(doc, newsItem, $$, groupContainer);
        // this.addBodyGroup(doc, newsItem, $$, groupContainer);
        // this.addTeaser(newsItem, groupContainer);


        return removeControlCodes(newsItem.documentElement.outerHTML);
    }

    // TODO Remove when/if substance has fixed the double encoding problem
    /**
     * This code is copied from DOMExporter.js in substance. This is because
     * removing the encodeXMLEntities() invocation fixed the double encoding problem (WRIT-255).
     */
    _annotatedText(text, annotations) {
        var self = this

        var annotator = new Fragmenter()
        annotator.onText = function(context, text) {
            // context.children.push(encodeXMLEntities(text))
            context.children.push(text)
        }
        annotator.onEnter = function(fragment) {
            var anno = fragment.node
            return {
                annotation: anno,
                children: []
            }
        }
        annotator.onExit = function(fragment, context, parentContext) {
            var anno = context.annotation
            var converter = self.getNodeConverter(anno)
            if (!converter) {
                converter = self.getDefaultPropertyAnnotationConverter()
            }
            var el
            if (converter.tagName) {
                el = this.$$(converter.tagName)
            } else {
                el = this.$$('span')
            }
            el.attr(this.config.idAttribute, anno.id)
            el.append(context.children)
            if (converter.export) {
                el = converter.export(anno, el, self) || el
            }
            parentContext.children.push(el)
        }.bind(this)
        var wrapper = { children: [] }
        annotator.start(wrapper, text, annotations)
        return wrapper.children
    }

}

export default NewsMLExporter


/**
 * Removes for XML illegal control codes from text (range from 0x00 - 0x1F with the exception of
 * TAB, CR and LF). See http://www.w3.org/TR/xml/#charsets
 * @param {string} text to process
 * @return {string} Text without control codes
 */
function removeControlCodes(text) {
    var regex = new RegExp("[\x00-\x08\x0b\x0c\x0e-\x1f]|(\&nbsp\;{1})", "g");
    if (text !== undefined) {
        if (regex.exec(text) != null) {
            console.log("Removing illegal XML character in content");
            return text.replace(regex, "");
        }
    }

    return text;
}

/*
 function NewsMLExporter(writerConfig) {
 var DocumentSchema = require('substance/model/DocumentSchema');

 var schema = new DocumentSchema("idf-article", "1.0.0");
 schema.getDefaultTextType = function () {
 return "paragraph";
 };

 NewsMLExporter.super.call(this, {
 schema: schema,
 converters: writerConfig.converters
 });
 }

 NewsMLExporter.Prototype = function () {


 this.addHeaderGroup = function(doc, newsItem, $$, groupContainer) {
 if (doc.get('metadata')) {
 var idfHeaderGroup = newsItem.querySelector('idf group[type="header"]');
 var headerElements = this.convertNode(doc.get('metadata'));
 var headerGroup = $$('group').attr('type', 'body');
 headerGroup.append(headerElements);
 var headerDomElement = $.parseXML(headerGroup.innerHTML).firstChild;
 groupContainer.removeChild(idfHeaderGroup);
 groupContainer.appendChild(headerDomElement);
 }
 };

 this.addBodyGroup = function(doc, newsItem, $$, groupContainer) {
 // Get the first group with type body in IDF section
 var idfBodyGroupNode = newsItem.querySelector('idf group[type="body"]');
 if(!idfBodyGroupNode) {
 throw new Error('IDF node not found!');
 }

 // Export article body with substance convert container function
 // Create a substance group element to make life easier
 var bodyElements = this.convertContainer(doc.get('body'));
 var bodyGroup = $$('group').attr('type', 'body');
 bodyGroup.append(bodyElements);

 // Reinsert the body group
 var articleDomElement = $.parseXML(bodyGroup.outerHTML).firstChild;

 groupContainer.removeChild(idfBodyGroupNode);
 // Append body group
 groupContainer.appendChild(articleDomElement);


 };

 this.addTeaser = function(newsItem, groupContainer) {
 // Extract x-im/teaser object and move it to its correct position if it exists
 var oldTeaser = newsItem.querySelector('contentMeta > metadata > object[type="x-im/teaser"]');
 var metadata = newsItem.querySelector('contentMeta > metadata');

 if (oldTeaser) {
 metadata.removeChild(oldTeaser);
 }

 var newTeaser = groupContainer.querySelector('object[type="x-im/teaser"]');
 if (newTeaser) {
 newTeaser.parentElement.removeChild(newTeaser);
 metadata.appendChild(newTeaser);
 }
 };

 this.convert = function (doc, options, newsItem) {

 this.state.doc = doc;
 var $$ = this.$$;

 // Remove the body group and save the parent
 var groupContainer = newsItem.querySelector('idf');

 // Add converted header, body group and add teaser
 this.addHeaderGroup(doc, newsItem, $$, groupContainer);
 this.addBodyGroup(doc, newsItem, $$, groupContainer);
 this.addTeaser(newsItem, groupContainer);

 return newsItem.documentElement.outerHTML;
 };
 };

 HtmlExporter.extend(NewsMLExporter);

 module.exports = NewsMLExporter;
 */