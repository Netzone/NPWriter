import { documentHelpers, series } from 'substance'
import fs from 'fs'
import NPWriterConfigurator from './writer/packages/npwriter/NPWriterConfigurator'
import NPWriterPackage from './writer/packages/npwriter/NPWriterPackage'
import ParagraphPackage from '../NPWriterPluginBundle/plugins/textstyles/se.infomaker.paragraph/ParagraphPackage.js'

let configurator = new NPWriterConfigurator()
.import(NPWriterPackage)
.import(ParagraphPackage)

var exampleXML = fs.readFileSync('./data/newsml-empty.xml', 'utf8')

let newsmlImporter = configurator.createImporter('newsml')
let doc = newsmlImporter.importDocument(exampleXML)
let initialChange = documentHelpers.getChangeFromDocument(doc)

export default function seed(changeStore, snapshotStore, cb) {
    series([
        (cb) => {
            changeStore.addChange('example-doc', initialChange, cb)
        },
        (cb) => {
            snapshotStore.saveSnapshot('example-doc', 1, exampleXML, cb)
        }
    ], cb)
}
