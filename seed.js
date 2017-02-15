import { documentHelpers, series, DocumentChange, DefaultDOMElement } from 'substance'
import fs from 'fs'
import NPWriterConfigurator from './writer/packages/npwriter/NPWriterConfigurator'
import NPWriterPackage from './writer/packages/npwriter/NPWriterPackage'
import UnsupportedPackage from './writer/packages/unsupported/UnsupportedPackage'
import ParagraphPackage from '../NPWriterPluginBundle/plugins/textstyles/se.infomaker.paragraph/ParagraphPackage.js'
import HeadlinePackage from '../NPWriterPluginBundle/plugins/textstyles/se.infomaker.headline/HeadlinePackage.js'
import NewsPriorityNode from '../NPWriterPluginBundle/plugins/se.infomaker.newspriority/NewsPriorityNode'
import NewsPriorityConverter from '../NPWriterPluginBundle/plugins/se.infomaker.newspriority/NewsPriorityConverter'

let configurator = new NPWriterConfigurator()
    .import(NPWriterPackage)
    .import(ParagraphPackage)
    .import(HeadlinePackage)

configurator.addNode(NewsPriorityNode)
configurator.addConverter('newsml', NewsPriorityConverter)

configurator.import(UnsupportedPackage)

// Given that exportDocument returns an HTML string
// HACK: this should work without using [0]
DefaultDOMElement._useXNode()

// this would be a customer's  template
var exampleXML = fs.readFileSync('./data/newsitem-empty.xml', 'utf8')

export function buildSnapshot(initSnapshot, changes) {
    let doc
    if (initSnapshot) {
        let importer = configurator.createImporter('newsml')
        doc = importer.importDocument(initSnapshot)
    } else {
        doc = configurator.createArticle()
    }
    console.log('building snapshot', changes)
    changes.forEach((change) => {
        change = DocumentChange.fromJSON(change)
        doc._apply(change)
    })
    let exporter = configurator.createExporter('newsml')
    let xmlDoc = DefaultDOMElement.parseXML(exampleXML)
    // HACK: workaround for DOMElement incosistency between browser/node
    xmlDoc = DefaultDOMElement.wrap(xmlDoc)
    console.log('### doc', doc.getNodes())
    let xml = exporter.exportDocument(doc, xmlDoc)
    console.log('### BUILDSNAPSHOT', xml)
    return xml
}

export function seed(changeStore, snapshotStore, cb) {
    let xml = buildSnapshot(exampleXML, [])
    let importer = configurator.createImporter('newsml')
    let doc = importer.importDocument(xml)
    let initialChange = documentHelpers.getChangeFromDocument(doc)
    series([
        (cb) => {
            changeStore.addChange('example-doc', initialChange, cb)
        },
        (cb) => {
            snapshotStore.saveSnapshot('example-doc', 1, xml, cb)
        }
    ], cb)
}