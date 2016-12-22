import ResourceLoader from '../../writer/utils/ResourceLoader'

describe('Appends or remove script and styles to document', () => {

    beforeEach(() => {

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

    it('Adds and removes a script tag', () => {
        //@Todo Seems to be a bug when unloading tags, or maybe just in JSDOM test environment
        let resourceLoader = new ResourceLoader()
        return resourceLoader.load({url: "script.js"}, 'js').then(() => {
            expect(resourceLoader.tags.length).toBe(1)
            resourceLoader.unload('script.js')
            expect(resourceLoader.tags.length).toBe(0)

        })
    })

    it('Adds a style to head', () => {

        const resourceLoader = new ResourceLoader()

         return resourceLoader.load({style: 'style.css'}, 'css').then(() => {
             expect(resourceLoader.tags.length).toBe(1)

             const linkTag = document.querySelector('link')
             expect(linkTag.getAttribute('href')).toBe('style.css')
        })
    })


})