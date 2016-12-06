import {FileProxy} from 'substance'
import FileService from './FileService'
import isString from 'lodash/isString'

class NPFileProxy extends FileProxy {

    constructor(fileNode, context) {
        super(fileNode, context)


        // 1. A file is considered upstream if it has a uuid set
        // 2. If no uuid but a local file is present, the file needs to be sync'd
        // 3. Due to permission reasons 'url' needs to be retrieved from the server everytime
        //    thus it is a volatile property

        this.fileService = new FileService(this.context.api)
        this.fileNode = fileNode
        // used locally e.g. after drop or file dialog

        // If a file upload is in progress
        this.uploadPromise = null

        // When an url (String) is given as the data an uri needs to be 'uploaded'
        if (fileNode.sourceUrl) {
            this.sourceUrl = fileNode.sourceUrl
        } else {
            this.sourceFile = fileNode.sourceFile
            if (this.sourceFile) {
                this._fileUrl = URL.createObjectURL(this.sourceFile)
            }
        }

        // TODO: this should be consistent: either always fetch the url or never
        this.url = fileNode.url
        if (!this.url && fileNode.uuid) {
            this.fetchUrl()
        }
    }

    getUrl() {
        // if we have fetched the url already, just serve it here
        if (this.url) {
            return this.url
        }
        if (this.sourceUrl) {
            return this.sourceUrl
        }
        // if we have a local file, use it's data URL
        if (this._fileUrl) {
            return this._fileUrl
        }
        // no URL available
        return ""
    }

    fetchUrl() {
        this.fileService.getUrl(this.fileNode.uuid, this.fileNode.imType)
            .then((url) => {
                this.fileNode.url = url
                this.triggerUpdate()
            })
    }

    sync() {

        if(this.uploadPromise){
            return this.uploadPromise
        }

        if (!this.fileNode.uuid && this.sourceFile) { // regular file upload
            this.uploadPromise = new Promise((resolve, reject) => {

                if(!this.fileNode.imType) {
                    reject(new Error('Trying to upload a file without ImType'))
                }
                const params = {
                    imType: this.fileNode.imType
                }

                this.fileService.uploadFile(this.sourceFile, params)
                    .then((xmlString) => {
                        this.fileNode.handleDocument(xmlString)
                        this.uploadPromise = null
                        this.fetchUrl()
                        resolve()
                    })
                    .catch((e) => {
                        console.log("Error uploading", e)
                        this.uploadPromise = null
                        reject(e)
                    })
            })
        } else if (!this.fileNode.uuid && this.sourceUrl) { // uri-based upload

            this.uploadPromise = new Promise((resolve, reject) => {
                this.fileService.uploadURL(this.sourceUrl, this.fileNode.getImType())
                    .then((xmlString) => {
                        this.fileNode.handleDocument(xmlString);
                        this.uploadPromise = null
                        this.fetchUrl()
                        resolve()
                    })
                    .catch((e) => {
                        console.log("Error uploading", e);
                        this.uploadPromise = null
                        reject(e)
                    })
            })


        } else {
            return Promise.resolve()
        }

        return this.uploadPromise
    }


}

export default NPFileProxy