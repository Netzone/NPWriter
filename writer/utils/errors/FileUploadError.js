class FileUploadError extends Error {

    constructor(message) {
        super(message)
        this.name = 'FileUploadError';
        this.message = message || 'File upload failed';
        this.stack = (new Error()).stack;
    }
}

export default FileUploadError