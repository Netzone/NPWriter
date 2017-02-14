import {XMLExporter, DefaultDOMElement} from 'substance'
import {Fragmenter} from 'substance'
class NewsMLExporter extends XMLExporter {

    constructor(...args) {
        super(...args)
    }

    removeElementIfExists(textEditElement, existingChildren) {
        existingChildren.forEach((child) => {
            if (textEditElement.tagName === child.tagName && textEditElement.getAttribute('type') === child.getAttribute('type')) {
                child.remove()
            }
        })
    }

    addHeaderGroup(doc, newsItem) {

        const idfHeaderGroup = newsItem.find('idf group[type="header"]')
        if(!idfHeaderGroup) {
            return
        }

        const textEditComponents = this.context.api.configurator.getTextEditComponents()

        let headerElements = []
        textEditComponents.forEach(textEditComponent => {
            const node = doc.get(textEditComponent.nodeType)
            if(node) {
                const convertedTextEdit = this.convertNode(node)
                headerElements.push(convertedTextEdit.childNodes)
            }
        })

        if (headerElements && headerElements.length > 0) {
            headerElements.forEach((elements) => {
                elements.forEach(element => {
                    this.removeElementIfExists(element, idfHeaderGroup.childNodes)
                    idfHeaderGroup.appendChild(element)
                })
            })
        }
    }

    addBodyGroup(doc, newsItem, groupContainer) {
        // Get the first group with type body in IDF section
        var idfBodyGroupNode = newsItem.find('idf group[type="body"]');
        if (!idfBodyGroupNode) {
            throw new Error('IDF node not found!');
        }

        // Export article body with substance convert container function
        // Create a substance group element to make life easier
        var bodyElements = this.convertContainer(doc.get('body'));
        var bodyGroup = newsItem.createElement('group')
        bodyGroup.setAttribute('type', 'body');

        bodyGroup.append(bodyElements)

        // Reinsert the body group
        const articleDomElement = DefaultDOMElement.parseXML(removeControlCodes(bodyGroup.outerHTML))

        groupContainer.removeChild(idfBodyGroupNode);
        // Append body group
        groupContainer.appendChild(articleDomElement)
    }

    addTeaser(newsItem, groupContainer) {
        // Extract x-im/teaser object and move it to its correct position if it exists
        var oldTeaser = newsItem.find('contentMeta > metadata > object[type="x-im/teaser"]');
        var metadata = newsItem.find('contentMeta > metadata');
        if (oldTeaser) {
            metadata.removeChild(oldTeaser);
        }

        var newTeaser = groupContainer.find('object[type="x-im/teaser"]');

        if (newTeaser) {
            newTeaser.parentElement.removeChild(newTeaser);
            metadata.appendChild(newTeaser);
        }
    }


    exportDocument(doc, newsItemArticle) {

        this.state.doc = doc
        var groupContainer = newsItemArticle.find('idf');

        this.addHeaderGroup(doc, newsItemArticle);
        this.addBodyGroup(doc, newsItemArticle, groupContainer);
        this.addTeaser(newsItemArticle, groupContainer);

        return removeControlCodes(newsItemArticle.outerHTML);
    }

    /**
     * @deprecated
     */
    convert(doc, options, newsItem) {
        console.info("convert method is deprecated, use exportDocument")
        this.state.doc = doc;
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
