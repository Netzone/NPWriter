import includes from 'lodash/includes'
import isArray from 'lodash/isArray'

/**
 * @class Upload
 */
class Upload {

    constructor(api) {
        this.api = api
    }

    uploadFile(file, params) {
        try {
            return new Promise((resolve, reject) => {

                this.api.router.postBinary(
                    '/api/binary',
                    file,
                    function (evt) {
                        var progress = (evt.loaded / evt.total) * 100;
                        console.log("Progress", progress);
                    },
                    function (evt) {
                        try {
                            // If status ok, update document with image and return
                            if (evt.target.status === 200) {

                                resolve(evt.target.responseText)

                                // var dom = parser.parseFromString(evt.target.responseText, 'text/xml'),
                                //     newsItem = dom.querySelector('newsItem'),
                                //     uuid = newsItem.getAttribute('guid'),
                                //     itemClass = dom.querySelector(
                                //         'newsItem > itemMeta > itemClass').getAttribute('qcode');


                                // var allowedItemClasses = getParam(params, 'allowedItemClasses', undefined);
                                //
                                // if (allowedItemClasses) {
                                //     if (!includes(allowedItemClasses, itemClass)) {
                                //         if (observer.error) {
                                //             observer.error("Item class " + itemClass + " not supported");
                                //         }
                                //         return;
                                //     }
                                // }
                                //
                                //
                                // var w = getParam(params, 'imageSize/w', undefined);
                                // var h = getParam(params, 'imageSize/h', undefined);
                                //
                                // var url = '/api/image/url/' + uuid;
                                // if (h) {
                                //     url = url + '/' + h;
                                // }
                                // if (w) {
                                //     url = url + "?width=" + w;
                                // }

                                // router.get(url)
                                //     .done(
                                //         function (imageUrl) {
                                //             if (observer.done) {
                                //                 observer.done({dom: dom, imageUrl: imageUrl});
                                //             } else {
                                //                 console.log("Missing 'done'");
                                //             }
                                //         }
                                //     )
                                //     .error(function (e) {
                                //         if (observer.error) {
                                //             observer.error(e);
                                //         }
                                //     });
                                // return true;
                            } else {
                                reject('Status code !== 200')
                            }

                        }
                        catch (ex) {
                            reject(ex)
                        }
                    },
                    function (e) {
                        reject(e)
                    },
                    params
                );
            })

        } catch (e) {
            if (observer.error) {
                observer.error(e.message);
            }
        }
    }


    uploadUri(uri, params, observer) {

        var router = this.api.router;

        return new Promise((resolve, reject) => {

            router.get('/api/binary', {source: uri, imType: params.imType})
                .then(response => router.checkForOKStatus(response))
                .then(response => response.text())
                .then(function (xmlString) {
                    resolve(xmlString)
                })
                .catch((error) => {
                    reject(error)
                })

        })
    }
/*
        this.router.get('/api/image', {source: uri}).done(function (data) {
            if (observer.progress) {
                observer.progress(100);
            }

            if (observer.done) {

                var dom = $.parseXML(data),
                    newsItem = dom.querySelector('newsItem'),
                    uuid = newsItem.getAttribute('guid'),
                    itemClass = dom.querySelector(
                        'newsItem > itemMeta > itemClass').getAttribute('qcode');

                var allowedItemClasses = getParam(params, 'allowedItemClasses', undefined);

                if (allowedItemClasses) {
                    if (!includes(allowedItemClasses, itemClass)) {
                        if (observer.error) {
                            observer.error("Item class " + itemClass + " not supported");
                        }
                        return;
                    }
                }

                var w = getParam(params, 'imageSize/w', undefined);
                var h = getParam(params, 'imageSize/h', undefined);

                var url = '/api/image/url/' + uuid;
                if (h) {
                    url = url + '/' + h;
                }
                if (w) {
                    url = url + "?width=" + w;
                }

                router.get(url)
                    .done(
                        function (imageUrl) {
                            if (observer.done) {
                                observer.done({dom: dom, imageUrl: imageUrl});
                            } else {
                                console.log("Missing 'done'");
                            }
                        }
                    );
            }

        }).error(function (e) {
            if (observer.error) {
                observer.error(e);
            }
        });
    }*/
}


function getParam(params, keys, defaultValue) {
    var result = params;
    var keysArray = keys.split('/');
    for (var i = 0; i < keysArray.length; i++) {
        if (result[keysArray[i]]) {
            result = result[keysArray[i]];
        } else {
            return defaultValue;
        }
    }

    return result;
}


function uploadFile(router, file, observer, params) {
    try {
        router.postBinary(
            '/api/image',
            file,
            function (evt) {
                // Never set 100% as that is only set in onLoad
                var progress = (evt.loaded / evt.total) * 100;
                if (observer.progress) {
                    observer.progress(progress);
                }
            },
            function (evt) {

                try {
                    // If status ok, update document with image and return
                    if (evt.target.status === 200) {

                        var dom = $.parseXML(evt.target.responseText),
                            newsItem = dom.querySelector('newsItem'),
                            uuid = newsItem.getAttribute('guid'),
                            itemClass = dom.querySelector(
                                'newsItem > itemMeta > itemClass').getAttribute('qcode');

                        var allowedItemClasses = getParam(params, 'allowedItemClasses', undefined);

                        if (allowedItemClasses) {
                            if (!includes(allowedItemClasses, itemClass)) {
                                if (observer.error) {
                                    observer.error("Item class " + itemClass + " not supported");
                                }
                                return;
                            }
                        }


                        var w = getParam(params, 'imageSize/w', undefined);
                        var h = getParam(params, 'imageSize/h', undefined);

                        var url = '/api/image/url/' + uuid;
                        if (h) {
                            url = url + '/' + h;
                        }
                        if (w) {
                            url = url + "?width=" + w;
                        }

                        router.get(url)
                            .done(
                                function (imageUrl) {
                                    if (observer.done) {
                                        observer.done({dom: dom, imageUrl: imageUrl});
                                    } else {
                                        console.log("Missing 'done'");
                                    }
                                }
                            )
                            .error(function (e) {
                                if (observer.error) {
                                    observer.error(e);
                                }
                            });
                        return true;
                    } else {
                        if (observer.error) {
                            observer.error(evt.target);
                        }
                    }

                }
                catch (ex) {
                    if (observer.error) {
                        observer.error(ex.message);
                    }
                }
            },
            function (e) {
                if (observer.error) {
                    console.log(e);
                    observer.error(e);
                }
            }
        );
    } catch (e) {
        if (observer.error) {
            observer.error(e.message);
        }
    }
}

export default Upload