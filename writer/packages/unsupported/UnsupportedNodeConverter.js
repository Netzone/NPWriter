import {DefaultDOMElement} from 'substance'
export default {

    type: 'unsupported',

    matchElement: function () {
        return true
    },


    import: function (el, node) {
        node.attributes = el.getAttributes()
        node.xmlContent = el.innerHTML
        node.tagName = el.tagName

        if(el.attr('type')) {
            node.tagType = el.attr('type')
        }

    },

    export: function (node, el) {
        let exportElement = DefaultDOMElement.parseXML('<'+node.tagName+'></'+node.tagName+'>')
        // el.tagName = node.tagName

        if (node.attributes) {
            Object.keys(node.attributes).forEach((key) => {
                exportElement.setAttribute(key, node.attributes[key])
            })
        }
        exportElement.innerHTML = node.xmlContent
        return exportElement
    }

}
