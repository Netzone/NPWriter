import NPWriterPackage from './packages/npwriter/NPWriterPackage'

export default {
    name: 'app',
    configure: function (config) {
        config.import(NPWriterPackage)
    }
}