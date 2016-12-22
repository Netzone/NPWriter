import { EventEmitter, uuid as generateUuid } from 'substance'

class StubFileService {

    constructor() {
        this.urls = {}
    }

    getUrl(uuid, cb) {
        window.setTimeout(() => {
            if (this.urls[uuid]) {
                cb(null, {
                    url: this.urls[uuid]
                })
            } else {
                cb(new Error('File not found.'))
            }
        }, 250)
    }

    /*
      Simulating a file upload.
      If successful, a uuid is returned which is the key to
      identify a resource as being upstream.
      TODO: we need to discuss this life-cycle.
    */
    uploadFile(file, cb) {
        let delay = 50
        let steps = (file.size / 500000) * (1000 / delay)
        let i = 0
        let channel = new EventEmitter()
        let _step = () => {
            if (i++ < steps) {
                channel.emit('progress', (i-1)/(steps))
                window.setTimeout(_step, delay)
            } else {
                let uuid = generateUuid()
                let url = window.URL.createObjectURL(file)
                this.urls[uuid] = url
                cb(null, {
                    uuid: uuid,
                    url: url
                })
            }
        }
        _step()
        return channel
    }
}

export default StubFileService
