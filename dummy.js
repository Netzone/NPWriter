var { DefaultDOMElement } = require('substance')
var { buildSnapshot } = require('./seed.cjs')
var fs = require('fs')
var exampleXML = fs.readFileSync('./data/newsitem-empty.xml', 'utf8')

debugger
let xml = buildSnapshot(exampleXML, [])