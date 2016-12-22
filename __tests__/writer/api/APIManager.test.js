import APIManager from '../../../writer/api/APIManager'

describe('Test for the API Manager Exposing methods on window', () => {


    it('Can instansiate a new APIManager', () => {
        let apiManager = new APIManager()
        expect(apiManager.endpoints.size).toBe(0)

    })

    it('Can add an endpoint on key', () => {
        let apiManager = new APIManager()
        expect(apiManager.endpoints.size).toBe(0)
        apiManager.expose('api', {api: {}})
        expect(apiManager.endpoints.size).toBe(1)
    })

    it('Can add Writer namespace on window', () => {
        let apiManager = new APIManager()
        expect(window.writer).not.toBe(undefined)
    })


    it('Throws error when registering class under same name', () => {
        let apiManager = new APIManager()
        apiManager.expose('api', {dummy: {}})

        expect(() => {
            apiManager.expose('api', {dummy: {}})
        }).toThrow();
    })


    it('Adds registerted classes to window under writer namespace', () => {
        let apiManager = new APIManager()
        apiManager.expose('api', {dummy: {}})
        expect(window.writer.api).not.toBe(undefined)
        expect(window.writer.api.dummy).not.toBe(undefined)
        expect(typeof window.writer.api.dummy).toBe('object')
    })


})