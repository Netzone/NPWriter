import ResourceLoader from '../../writer/utils/ResourceLoader'

describe('Appends or remove script and styles to document', () => {

    beforeEach(() => {

        window.document = "<html><head></head><body></body></html>"

    })

    it('Adds a script tag to body', () => {

        let resourceLoader = new ResourceLoader()
        expect(resourceLoader.tags.length).toBe(0)

        return resourceLoader.load({url: "script.js"}, 'js').then(() => {

            const scriptTag = document.querySelector('script')
            expect(resourceLoader.tags.length).toBe(1)
            expect(scriptTag.getAttribute('src')).toBe('script.js')

        })
    })

    it('Adds removes a script tag', () => {

        let resourceLoader = new ResourceLoader()
        return resourceLoader.load({url: "script.js"}, 'js').then(() => {
            expect(resourceLoader.tags.length).toBe(1)
            resourceLoader.unload('script.js')
            expect(resourceLoader.tags.length).toBe(0)

            const scriptTags = document.querySelectorAll('script')
            console.log("ssss", scriptTags);
            expect(scriptTags.length).toBe(0)
        })
    })


})