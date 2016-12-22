'use strict';

import { Component, ContainerEditor } from 'substance'

class UnsupportedNodeComponent extends Component {
  render($$) {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-unsupported-node')
        .attr('style', 'border: 1px solid #efefef; display:block; padding: 5px;')
      .attr('data-id', this.props.node.id);

    el.append('Unsupported Content' + this.props.node.tagType)
    return el;
  }
}

export default UnsupportedNodeComponent