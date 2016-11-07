'use strict';

import { Component, ContainerEditor } from 'substance'

class BodyComponent extends Component {
  render($$) {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-body')
      .attr('data-id', this.props.node.id);

    el.append(
      $$(ContainerEditor, {
        disabled: this.props.disabled,
        node: node,
        commands: this.props.commands,
        textTypes: this.props.textTypes,
        spellcheck: this.props.spellcheck
      }).ref('body')
    );
    return el;
  }
}


export default BodyComponent