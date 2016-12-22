/**
 Default label provider implementation

 @internal
 */
class LabelProvider {
    constructor(labels, lang) {
        this.lang = lang || 'en'
        this.labels = labels
    }

    getLabel(name) {
        let labels = this.labels[this.lang]
        if (!labels) return name

        if(labels[name]) {
            return labels[name]
        }
        // console.warn('No label exists for', name)
        return name
    }
}

export default LabelProvider
