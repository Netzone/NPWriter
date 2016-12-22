import UnsupportedNode from './UnsupportedNode'
import UnsupportedInlineNode from './UnsupportedInlineNode'
import UnsupportedNodeConverter from './UnsupportedNodeConverter'
import UnsupportedInlineNodeConverter from './UnsupportedInlineNodeConverter'
import UnsupportedNodeComponent from './UnsupportedNodeComponent'

export default {
    name: 'unsupported',
    configure: function (config) {
        config.addNode(UnsupportedNode)
        config.addNode(UnsupportedInlineNode)
        config.addComponent('unsupported', UnsupportedNodeComponent)
        config.addConverter('newsml', UnsupportedNodeConverter)
        config.addConverter('newsml', UnsupportedInlineNodeConverter)
    }
}
