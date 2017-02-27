function generateOperationId() { // Public Domain/MIT
    var d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

var generateAndLogOperation = function (log, req, operation, context) {
    var operationId = generateOperationId();
    log.info({
        url: req.url,
        method: req.method,
        forwardedHost: req.headers['x-forwarded-for'],
        operationId: operationId,
        context: context
    }, operation)
    return {operation: operation, operationId: operationId, context}
}

module.exports = generateAndLogOperation