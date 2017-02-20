var WebSocket = require('ws')

const ws = new WebSocket('ws://127.0.0.1:5000', {
    perMessageDeflate: false
});


ws.on('open', function incoming(data, flags) {
    // flags.binary will be set if a binary data is received.
    // flags.masked will be set if the data was masked.
    console.log("da", data);
    ws.send('{"type":"sync","documentId":"example-doc","version":1,"scope":"substance/collab"}')

    var version = 2
    const messge = '{"type":"sync","documentId":"example-doc","version":'+version+',"change":{"sha":"71f16c8a7dc3079a626cbf70087959dd","before":{"selection":null},"ops":[{"type":"set","path":["newsvalue","score"],"val":{"@type":"x-im/newsvalue","data":{"description":"1D","end":"","format":"lifetimecode","score":5,"duration":"84600"}},"original":{"@type":"x-im/newsvalue","data":{"description":"1D","end":"","format":"lifetimecode","score":3,"duration":"84600"}}}],"info":{},"after":{"selection":null}}}'
    setTimeout(function() {
        console.log("Emit in 2 sec");
        ws.send(messge)
    }, 2000)


});

ws.on('message', function incoming(data, flags) {
    // flags.binary will be set if a binary data is received.
    // flags.masked will be set if the data was masked.

    var json = JSON.parse(data)
    var version = json.version

    console.log("Latest version_", version);

    // const messge = '{"type":"sync","documentId":"example-doc","version":'+version+',"change":{"sha":"71f16c8a7dc3079a626cbf70087959df","before":{"selection":null},"ops":[{"type":"set","path":["newsvalue","score"],"val":{"@id":"NzgsNDEsMjIwLDg1","@type":"x-im/newsvalue","data":{"description":"1D","end":"","format":"lifetimecode","score":5,"duration":"84600"}},"original":{"@id":"NzgsNDEsMjIwLDg1","@type":"x-im/newsvalue","data":{"description":"1D","end":"","format":"lifetimecode","score":3,"duration":"84600"}}}],"info":{},"after":{"selection":null}}}'
    // ws.emit(messge)
});