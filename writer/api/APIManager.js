/**
 * APIManager manages wich endpoints available under the window.writer scope
 */
class APIManager {

    constructor() {
        this.endpoints = new Map()
        window.writer = {}
    }

    /**
     * Exposes a function or a class on the writer namespace
     * window.writer
     *
     * @param {string} name - The key that will be on window.key
     * @param apiClass
     */
    expose(name, apiClass) {

        if(this.endpoints.get(name)) {
            throw new Error('Error, Already registered')
        }

        this.endpoints.set(name, apiClass)
        window.writer[name] = apiClass
    }

}

export default APIManager