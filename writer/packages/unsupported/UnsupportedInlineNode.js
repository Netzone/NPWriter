import {InlineNode} from 'substance'

class UnsupportedInlineNode extends InlineNode {}

UnsupportedInlineNode.type = 'unsupported-inline';

UnsupportedInlineNode.define({
  attributes: { type: 'object', default: {} },
  xmlContent: {type: 'string', default: ''},
  tagName: 'string',
  tagType: { type: 'string', optional: true}
});

export default UnsupportedInlineNode;
