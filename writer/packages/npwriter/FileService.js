
class FileService {

    constructor(api) {
        this.api = api
    }

    getUrl(uuid, imType) {

        return this.api.router.get('/api/binary/url/' + uuid+'?imType='+imType)
            .then(response => this.api.router.checkForOKStatus(response))
            .then(response => {
                return response.text()
            })

        // return promise

    }

    /**
     *
     * @param file
     * @param params
     * @returns {Promise}
     */
    uploadFile(file, params) {
        return this.api.upload.uploadFile(file, params)

    }

    uploadURL(url, imType) {
        const queryParams = {
            imType: imType
        }
        return this.api.upload.uploadUri(url, queryParams)
    }
}
export default FileService