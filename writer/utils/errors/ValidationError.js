class ValidationError extends Error {

    constructor(message) {
        super(message)
        this.name = 'ValidationError';
        this.message = message || 'Validation failed';
        this.stack = (new Error()).stack;
    }
}

export default ValidationError