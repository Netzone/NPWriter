import idGenerator from '../../../writer/utils/IdGenerator'

describe('Test IDGenerator', () => {

    it('generates a uuid', () => {

        /*
            Mock the window crypto function
         */
        window.crypto = {
            getRandomValues: function(seed) {
                seed.map((int, idx, array) => {
                    array[idx] = Math.ceil(Math.random()*100);
                });
            }
        }

        const id = idGenerator()
        expect(id.length).toBeGreaterThanOrEqual(10)
        expect(id.indexOf('=')).toBe(-1)
    })


})