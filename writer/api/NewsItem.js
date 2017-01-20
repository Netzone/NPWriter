import jxon from 'jxon'
import omit from 'lodash/omit'
import startsWith from 'lodash/startsWith'
import replace from 'lodash/replace'

import isObject from 'lodash/isObject'
import isArray from 'lodash/isArray'

import Validator from '../packages/npwriter/Validator'

import NewsMLExporter from '../packages/npwriter/NewsMLExporter'

jxon.config({
    autoDate: false,
    parseValues: false,
    lowerCaseTags: false,
    trueIsEmpty: false,
    valueKey: 'keyValue',
    attrPrefix: '@'
})

/**
 * @class NewsItem
 *
 * News item manipulation methods. All methods available directly in the
 * context.api object.
 */
class NewsItem {

    constructor(api) {
        this.api = api
    }


    /**
     * Save news item. Triggers a validation of the news item.
     */
    save() {
        if (this.api.browser.isSupported()) {
            this.api.editorSession.saveHandler.saveDocument()
        }
        else {
            // TODO: Display nicer error dialog
            console.log('Unsupported browser. Document not saved!')
        }

    }

    getSource() {
        var exporter = this.api.configurator.createExporter('newsml', {
            api: this.api
        })
        return exporter.exportDocument(this.api.editorSession.getDocument(), this.api.newsItemArticle);
    }

    /**
     * Set the NewsML source. Will effectively replace the current article with
     * anything in the incoming NewsML. Should normally always be followed by sending
     * Event.DOCUMENT_CHANGED event as this is not done automatically.
     *
     * @param {string} newsML The NewsML source
     * @param {object} writerConfig Optional, explicit writer config used internally only, should be empty.
     *
     * @return {object | null}
     */
    setSource(newsML, writerConfig) {
        var newsMLImporter = this.api.configurator.createImporter('newsml', {
            api: this.api
        })

        var parser = new DOMParser();
        var newsItemArticle = parser.parseFromString(newsML, "application/xml"),
            idfDocument = newsMLImporter.importDocument(newsML);

        if (writerConfig) {
            return {
                newsItemArticle: newsItemArticle,
                idfDocument: idfDocument
            };
        }

        this.api.newsItemArticle = newsItemArticle;
        this.api.doc = idfDocument;

        this.api.writer.send('replacedoc', {
            newsItemArticle: newsItemArticle,
            idfDocument: idfDocument
        });
    }


    /**
     * Return the GUID in the NewsItemArticle
     * Can return null if no GUID is found in NewsItem
     *
     * @returns {guid|null}
     */
    getGuid() {
        for (var n in this.api.newsItemArticle.childNodes) {
            if (this.api.newsItemArticle.childNodes[n].nodeName === 'newsItem') {
                const guid = this.api.newsItemArticle.childNodes[n].getAttribute('guid')
                if (guid) {
                    return guid
                }
                return null
            }
        }
    }

    /**
     * Set news item guid (uuid)
     *
     * @param {String} New uuid or null to clear
     */
    setGuid(uuid) {
        const newsItemArticle = this.api.newsItemArticle

        for (var n in newsItemArticle.childNodes) {
            if (newsItemArticle.childNodes[n].nodeName === 'newsItem') {
                newsItemArticle.childNodes[n].setAttribute(
                    'guid',
                    (uuid ? uuid : '')
                );
                break;
            }
        }
    }


    /*
     <?xml version="1.0" encoding="UTF-8"?><newsItem xmlns="http://iptc.org/std/nar/2006-10-01/" conformance="power" guid="2e6cd937-f366-4b5c-8b4a-fd2cc38245b1" standard="NewsML-G2" standardversion="2.20" version="1">
     <catalogRef href="http://www.iptc.org/std/catalog/catalog.IPTC-G2-Standards_27.xml"/>
     <catalogRef href="http://infomaker.se/spec/catalog/catalog.infomaker.g2.1_0.xml"/>
     <itemMeta>
     <itemClass qcode="ninat:text"/>
     <provider literal="testdata-1.0"/>
     <versionCreated>2016-03-03T16:09:55+01:00</versionCreated>
     <firstCreated>2016-03-03T16:09:55+01:00</firstCreated>
     <pubStatus qcode="stat:usable"/>
     <service qcode="imchn:sydsvenskan"/>
     <service qcode="imchn:hd"/>
     <title>Ola testar torsdag</title>
     <itemMetaExtProperty type="imext:uri" value="im://article/2e6cd937-f366-4b5c-8b4a-fd2cc38245b1"/>
     */

    removeDocumentURI() {
        var node = this.api.newsItemArticle.querySelector('itemMeta > itemMetaExtProperty[type="imext:uri"]');
        if (node) {
            node.parentNode.removeChild(node);
        }
    }

    /**
     * Get news priority.
     *
     * @return {Object} News priority object
     */
    getNewsPriority() {
        var node = this.api.newsItemArticle.querySelector(
            'contentMeta metadata object[type="x-im/newsvalue"]');
        if (!node) {
            console.warn('News Priority not found in document');
            return null;
        }

        return jxon.build(node);
    }


    /**
     * Create and insert a new newsPriority object into the news item content meta data.
     * Triggers a documentChanged event to all documentChanged listeners except
     * the plugin making the change.
     *
     * @param {string} name Plugin name
     * @param {object} newsPriority
     *
     * @fires event.DOCUMENT_CHANGED
     */
    createNewsPriority(name, newsPriority) {

        var metaDataNode = this.api.newsItemArticle.querySelector('contentMeta metadata'),
            newsValueNode = jxon.unbuild(newsPriority, null, 'object');

        if (!metaDataNode) {
            var contentMetaNode = this.api.newsItemArticle.querySelector('contentMeta');
            metaDataNode = this.api.newsItemArticle.createElement('metadata');
            contentMetaNode.appendChild(metaDataNode);
        }

        metaDataNode.appendChild(newsValueNode.childNodes[0]);

        this.api.events.documentChanged(
            name,
            {
                type: 'newsPriority',
                action: 'add',
                data: this.getNewsPriority(name)
            }
        );
    }


    /**
     * Set news priority.
     *
     * @fixme jxon.unbuild() creates object elements from empty strings which is WRONG
     *
     * @todo Validate in data format object.data.links etc
     * @todo Break out metaDataNode check so more functions can use it
     *
     * @param {string} name Name of the plugin making the call
     * @param {Object} newsPriority News priority object
     *
     * @fires event.DOCUMENT_CHANGED
     */
    setNewsPriority(name, newsPriority) {
        if ('undefined' === typeof newsPriority) {
            throw new Error('Undefined value');
        }

        var metaDataNode = this.api.newsItemArticle.querySelector('contentMeta metadata'),
            newsValueNode = this.api.newsItemArticle.querySelector(
                'contentMeta metadata object[type="x-im/newsvalue"]');

        if (!metaDataNode) {
            var contentMetaNode = this.api.newsItemArticle.querySelector('contentMeta');
            metaDataNode = this.api.newsItemArticle.createElement('metadata');
            contentMetaNode.appendChild(metaDataNode);
        }
        else if (newsValueNode) {
            metaDataNode.removeChild(newsValueNode);
        }

        newsValueNode = jxon.unbuild(newsPriority, null, 'object');
        metaDataNode.appendChild(newsValueNode.childNodes[0]);

        this.api.events.documentChanged(
            name,
            {
                type: 'newsPriority',
                action: 'update',
                data: this.getNewsPriority(name)
            }
        );
    }

    /**
     * Get main channel (channel with attribute why="imext:main")
     *
     * @returns {object}
     */
    getMainChannel() {
        var obj = null,
            node = this.api.newsItemArticle.querySelector('itemMeta service[why="imext:main"]');

        if (node) {
            obj = jxon.build(node);
            obj['qcode'] = obj['@qcode'];
            delete obj['@qcode'];
        }

        return obj;
    }

    /**
     * Get Sections.
     * Finds all the service nodes with a qCode containing imsection:
     *
     * Renames @qcode to qcode so plugins doesn't have to handle
     *
     * @returns {Array}
     * @return {*}
     */
    getSections() {
        return this._getServices('imsection')
    }

    /**
     * Get Section.
     *
     * Find section on article if any. If no section null is returned.
     * Note that by using this function it is presumed that there can
     * be max one section on an article.
     *
     * @return {*}
     */
    getSection() {
        let sections = this.getSections()

        if (sections.length > 1) {
            throw new Error('Only one section is allowed on an article');
        } else if (sections.length == 1) {
            return sections[0]
        } else {
            return null;
        }
    }

    /**
     * Get Channels
     * Finds all the service nodes with a qCode containing imchn:
     *
     * Renames @qcode to qcode so plugins doesn't have to handle
     *
     * @returns {Array}
     */
    getChannels() {

        // TODO: Use internal _getServices('imchn')...
        var nodes = this.api.newsItemArticle.querySelectorAll('itemMeta service[qcode]');
        if (!nodes) {
            console.warn('No services with qcode found');
            return [{}];
        }

        var wrapper = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i],
                qCode = node.getAttribute('qcode');

            if (qCode.indexOf('imchn') >= 0) {
                var json = jxon.build(node);

                json['qcode'] = json['@qcode'];
                delete json['@qcode'];

                wrapper.push(json);
            }
        }

        return wrapper;
    }

    /**
     * Get Services.
     * Finds all the service nodes with a qCode containing qcode prefix sent in as parameter:
     *
     * Renames @qcode to qcode so plugins doesn't have to handle
     *
     * @qcodePrefix QCode prefix to look for in service elements.
     *
     * @returns {Array}
     * @return {*}
     */
    _getServices(qcodePrefix) {
        const nodes = this.api.newsItemArticle.querySelectorAll('itemMeta service[qcode]')
        if (!nodes) {
            console.warn('No services with qcode found')
            return [{}]
        }

        let wrapper = []
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i],
                qCode = node.getAttribute('qcode'),
                pubConstraint = node.getAttribute('pubconstraint')

            // Attribute "qcode" mandatory
            if (qCode.indexOf(qcodePrefix) >= 0) {
                let json = jxon.build(node);

                json['qcode'] = json['@qcode'];
                delete json['@qcode'];

                // Optional attribute
                if (pubConstraint) {
                    json['pubconstraint'] = json['@pubconstraint']
                    delete json['@pubconstraint']
                }

                wrapper.push(json);
            }
        }

        return wrapper;
    }

    /**
     * Update Section.
     * Removes existing section and add new. Note expects article to only allow
     * one section.
     * @param name Name of plugin.
     * @param section Section object to set on article.
     *
     * @fires event.DOCUMENT_CHANGED
     * @throws Error
     */
    updateSection(name, section) {
        if (!isObject(section)) {
            throw new Error('There can be only one section')
        }

        // Remove existing section if any
        let currentSection = this.getSection()
        if (currentSection) {
            this.removeSection(name, currentSection)
        }

        // Update section
        let itemMetaNode = this.api.newsItemArticle.querySelector('itemMeta'),
            service = {},
            serviceNode

        // Create service element
        service['@qcode'] = section.qcode

        // If product parent exists set attribute to reflect this
        if (section.product) {
            service['@pubconstraint'] = section.product
        }

        service.name = section.name
        serviceNode = jxon.unbuild(service, null, 'service');

        // Add service to itemMeta element
        itemMetaNode.appendChild(serviceNode.childNodes[0]);

        this.api.events.documentChanged(
            name,
            {
                type: 'section',
                action: 'update',
                data: section
            }
        );
    }

    /**
     * Removes <service>.
     *
     * @param {string} name Name of plugin.
     * @param {string} section Section object to remove.
     * @param {boolean} muteEvent Optional. Mute event if set to true, only used internally.
     *
     * @fires event.DOCUMENT_CHANGED
     * @throws Error
     */
    removeSection(name, section, muteEvent) {
        let query = 'itemMeta service[qcode="' + section['qcode'] + '"]'
        let service = this.api.newsItemArticle.querySelector(query);

        if (!service) {
            // Silently ignore request
            return;
        }

        service.parentElement.removeChild(service);

        if (muteEvent === true) {
            return;
        }

        this.api.events.documentChanged(
            name,
            {
                type: 'section',
                action: 'delete',
                data: section
            }
        );
    }

    /**
     * Add a channel as a <service>.
     * Renaming qcode to @qcode.
     *
     * @param {string} name Name of plugin
     * @param {string} channel Name of channel
     * @param {boolean} setAsMainChannel Set this channel as main channel
     *
     * @fires event.DOCUMENT_CHANGED
     * @throws Error
     */
    addChannel(name, channel, setAsMainChannel) {
        if (!isObject(channel)) {
            throw new Error('addChannel only supports adding one channel at a time');
        }

        var currentChannels = this.getChannels(),
            itemMetaNode = this.api.newsItemArticle.querySelector('itemMeta'),
            service = {};

        if (currentChannels.some(currentChannel => channel.qcode === currentChannel['qcode'])) {
            this.removeChannel(name, channel);
        }

        service['@qcode'] = channel.qcode;

        var mainNodes = this.api.newsItemArticle.querySelectorAll('itemMeta > service[why="imext:main"]');
        if (setAsMainChannel) {
            service['@why'] = 'imext:main';

            for (var n = 0; n < mainNodes.length; n++) {
                mainNodes[n].removeAttribute('why');
            }
        }

        var serviceNode = jxon.unbuild(service, null, 'service');
        itemMetaNode.appendChild(serviceNode.childNodes[0]);

        this.api.events.documentChanged(
            name,
            {
                type: 'channel',
                action: 'add',
                data: channel
            }
        );
    }


    /**
     * Removes <service>.
     *
     * @param {string} name Name of plugin
     * @param {string} channel Name of channel
     * @param {boolean} muteEvent Optional. Mute event if set to true, only used internally.
     *
     * @fires event.DOCUMENT_CHANGED
     * @throws Error
     */
    removeChannel(name, channel, muteEvent) {
        var query = 'itemMeta service[qcode="' + channel['qcode'] + '"]';
        var service = this.api.newsItemArticle.querySelector(query);

        if (!service) {
            // Silently ignore request
            return;
        }

        service.parentElement.removeChild(service);

        if (muteEvent === true) {
            return;
        }

        this.api.events.documentChanged(
            name,
            {
                type: 'channel',
                action: 'delete',
                data: channel
            }
        );
    }


    /**
     * Get the pubStatus of document
     *
     * @returns {Object} Return object with current pubStatus of document
     */
    getPubStatus() {
        let newsItem = this.api.newsItemArticle,
            node = newsItem.querySelector('itemMeta pubStatus')

        if (!node) {
            return null
        }

        var pubStatusNode = jxon.build(node)
        pubStatusNode.qcode = pubStatusNode['@qcode']
        delete pubStatusNode['@qcode']

        return pubStatusNode
    }


    /**
     * Set pubStatus
     * Creates a pubStatus node in itemMeta if it not exists
     *
     * @param {string} name
     * @param {object} pubStatus
     *
     * @fires event.DOCUMENT_CHANGED
     */
    setPubStatus(name, pubStatus) {
        let newsItem = this.api.newsItemArticle,
            node = newsItem.querySelector('itemMeta pubStatus')

        if (!node) {
            let itemMetaNode = newsItem.querySelector('itemMeta')
            node = newsItem.createElement('pubStatus')
            itemMetaNode.appendChild(node)
        }

        node.setAttribute('qcode', pubStatus.qcode)
        this.api.events.documentChanged(name, {
            type: 'pubStatus',
            action: 'set',
            data: pubStatus
        })
    }


    /**
     * Get pubStart
     *
     * @returns {object} Object {value: "2016-02-08T20:37:25 01:00", type: "imext:pubstart"}
     */
    getPubStart() {
        let pubStartNode = this._getItemMetaExtPropertyByType('imext:pubstart')
        if (!pubStartNode) {
            return null
        }

        let pubStartJson = jxon.build(pubStartNode)
        pubStartJson.value = pubStartJson['@value']
        pubStartJson.type = pubStartJson['@type']
        pubStartJson = omit(pubStartJson, ['@type', '@value'])

        return pubStartJson
    }


    /**
     * Set pubStart
     *
     * @param {string} name Plugin name
     * @param {object} pubStart Expect object with value property. Type is ignored. Object {value: "2016-02-08T20:37:25 01:00"}
     *
     * @fires event.DOCUMENT_CHANGED
     */
    setPubStart(name, pubStart) {
        let newsItem = this.api.newsItemArticle,
            pubStartNode = this._getItemMetaExtPropertyByType('imext:pubstart')

        if (!pubStartNode) {
            let itemMetaNode = newsItem.querySelector('itemMeta')
            pubStartNode = newsItem.createElement('itemMetaExtProperty')
            itemMetaNode.appendChild(pubStartNode)
        }

        pubStartNode.setAttribute('value', pubStart.value)
        pubStartNode.setAttribute('type', 'imext:pubstart')

        this.api.events.documentChanged(name, {
            type: 'pubStart',
            action: 'set',
            data: pubStart
        })
    }


    /**
     * Remove the node for the pubStart
     *
     * @param name
     *
     * @fires event.DOCUMENT_CHANGED
     */
    removePubStart(name) {
        let pubStartNode = this._getItemMetaExtPropertyByType('imext:pubstart')

        if (pubStartNode) {
            pubStartNode.parentElement.removeChild(pubStartNode)
        }

        this.api.events.documentChanged(name, {
            type: 'pubStart',
            action: 'delete',
            data: {}
        });
    }


    /**
     * Get pubStop
     *
     * @returns {object}
     */
    getPubStop() {
        let pubStopNode = this._getItemMetaExtPropertyByType('imext:pubstop')

        if (!pubStopNode) {
            return null
        }

        let pubStartJson = jxon.build(pubStopNode)
        pubStartJson.type = pubStartJson['@type']
        pubStartJson.value = pubStartJson['@value']
        delete pubStartJson['@type']
        delete pubStartJson['@value']

        return pubStartJson
    }


    /**
     * Set pubStop.
     *
     * @param {string} name Plugin name
     * @param {object} pubStop
     *
     * @fires event.DOCUMENT_CHANGED
     */
    setPubStop(name, pubStop) {
        let newsItem = this.api.newsItemArticle,
            pubStopNode = this._getItemMetaExtPropertyByType('imext:pubstop')

        if (!pubStopNode) {
            let itemMetaNode = newsItem.querySelector('itemMeta')
            pubStopNode = newsItem.createElement('itemMetaExtProperty')
            itemMetaNode.appendChild(pubStopNode)
        }

        pubStopNode.setAttribute('value', pubStop.value)
        pubStopNode.setAttribute('type', 'imext:pubstop')

        this.api.events.documentChanged(name, {
            type: 'pubStop',
            action: 'set',
            data: pubStop
        })
    }


    /**
     * Remove the node for pubStop.
     *
     * @param {string} name Plugin name
     */
    removePubStop(name) {
        let pubStopNode = this._getItemMetaExtPropertyByType('imext:pubstop')
        if (pubStopNode) {
            pubStopNode.parentElement.removeChild(pubStopNode)
        }

        this.api.events.documentChanged(name, {
            type: 'pubStop',
            action: 'delete',
            data: {}
        });
    }


    /**
     * Get all author links in itemMeta links
     *
     * @returns {*}
     */
    getAuthors(/*name*/) {

        /*jshint validthis:true */
        function normalizeObject(object) {
            Object.keys(object).forEach(function (key) {
                if (startsWith(key, '@')) {
                    var newKey = replace(key, '@', '');
                    object[newKey] = object[key];
                    delete object[key];
                }
            }.bind(this));
            return object;
        }

        var authorNodes = this._getLinksByType('x-im/author');
        if (!authorNodes) {
            return null;
        }

        var authors = [];
        var length = authorNodes.length;
        for (var i = 0; i < length; i++) {
            var author = jxon.build(authorNodes[i]);

            var normalizedAuthor = normalizeObject(author);

            authors.push(normalizedAuthor);
        }

        return authors;
    }


    /**
     * Remove an author from newsItem.
     *
     * @param {string} name Name of the plugin
     * @param {string} uuid The UUID of the author to be deleted
     *
     * @fires event.DOCUMENT_CHANGED
     * @throws {NotFoundException}  When no node is found by provided UUID the NotFoundException is thrown
     */
    removeAuthorByUUID(name, uuid) {
        var authorNode = this.api.newsItemArticle.querySelector(
            'itemMeta links link[type="x-im/author"][uuid="' + uuid + '"]');

        if (authorNode) {
            authorNode.parentElement.removeChild(authorNode);
            this.api.events.documentChanged(name, {
                type: 'author',
                action: 'delete',
                data: authorNode
            });
        }
        else {
            throw new this.NotFoundException('Could not find authorNode with UUID: ' + uuid);
        }
    }


    /**
     * Add an known author with a specified uuid to the newsItem
     *
     * @param {string} name Plugin name
     * @param {object} author Author object with the properties name and uuid
     *
     * @fires event.DOCUMENT_CHANGED
     */
    addAuthor(name, author) {
        var newsItem = this.api.newsItemArticle;
        var linksNode = newsItem.querySelector('itemMeta links');
        var authorLinkNode = newsItem.createElement('link');

        authorLinkNode.setAttribute('title', author.name);
        authorLinkNode.setAttribute('uuid', author.uuid);
        authorLinkNode.setAttribute('rel', 'author');
        authorLinkNode.setAttribute('type', 'x-im/author');

        linksNode.appendChild(authorLinkNode);

        this.api.events.documentChanged(name, {
            type: 'author',
            action: 'add',
            data: author
        });
    }

    /**
     * Add an simple/unknown author to the newsItem
     *
     * @param {string} name Plugin name
     * @param {object} author Author object with the properties name and uuid
     *
     * @fires event.DOCUMENT_CHANGED
     */
    addSimpleAuthor(name, authorName) {
        var newsItem = this.api.newsItemArticle;
        var linksNode = newsItem.querySelector('itemMeta links');
        var authorLinkNode = newsItem.createElement('link');

        authorLinkNode.setAttribute('title', authorName);
        authorLinkNode.setAttribute('uuid', '00000000-0000-0000-0000-000000000000');
        authorLinkNode.setAttribute('rel', 'author');
        authorLinkNode.setAttribute('type', 'x-im/author');
        linksNode.appendChild(authorLinkNode);

        this.api.events.documentChanged(name, {
            type: 'author',
            action: 'add',
            data: authorName
        });
    }


    /**
     * Updates name and email (if exist) for an author with specified uuid
     * 
     * @param {string} name - Plugin name
     * @param {string} uuid - The uuid for the author in the newsItem
     * @param {object} author - Object containing name and/or email
     */
    updateAuthorWithUUID(name, uuid, author) {
        const newsItem = this.api.newsItemArticle
        var authorNode = newsItem.querySelector('itemMeta links link[type="x-im/author"][uuid="' + uuid + '"]')

        authorNode.setAttribute('title', author.name);

        if (author.email) {
            // Check if a data -> email node exists
            const emailNode = authorNode.querySelector('data email')
            if (emailNode) {
                emailNode.textContent = author.email
                //Check for email node
            } else {
                // Create data and email node
                try {
                    const authorDataNode = newsItem.createElement('data')
                    const authorEmailNode = newsItem.createElement('email')
                    authorEmailNode.textContent = author.email

                    // Append data and email node
                    authorDataNode.appendChild(authorEmailNode)

                    authorNode.appendChild(authorDataNode)    
                }
                catch (e) {
                    console.log(e)
                }

            }

        }
    }

    /**
     * Remove an author from newsItem
     *
     * @param {string} name Name of the plugin
     * @param {string} authorName The name of the author to be deleted
     * @throws {NotFoundException}  When no node is found by provided authorName the NotFoundException is thrown
     *
     */
    removeAuthorByTitle(name, authorName) {
        var authorNode = this.api.newsItemArticle.querySelector(
            'itemMeta links link[type="x-im/author"][title="' + authorName + '"]');

        if (authorNode) {
            authorNode.parentElement.removeChild(authorNode);
            this.api.events.documentChanged(name, {
                type: 'author',
                action: 'delete',
                data: authorName
            });
        }
        else {
            throw new this.NotFoundException('Could not find authorNode with title: ' + authorName);
        }
    }


    /**
     * Helper function to remove all @ on properties
     * @private
     *
     * @param {object} object
     *
     * @returns {*}
     */
    normalizeObject(object) {
        Object.keys(object).forEach(function (key) {
            if (startsWith(key, '@')) {
                var newKey = replace(key, '@', '');
                object[newKey] = object[key];
                delete object[key];
            }
        }.bind(this));
        return object;
    }


    /**
     *
     * Generic method to selector links with a certain type
     *
     * @example
     *
     * this.context.api.getLinksByType(this.name, [ 'x-im/organisation', 'x-im/person', 'x-im/topic' ], "subject")
     *
     * @param name Plugin name
     * @param {array} types Types of links to select
     * @param {string} subject optional Which kind of subject to select, defaults to "subject"
     * @returns {*}
     */
    getLinksByType(name, types, subject) {

        if (!isArray(types)) {
            throw new Error("Argument types is not of type: array");
        }
        if (!subject) {
            subject = "subject";
        }

        var querySelectors = [];
        types.forEach(function (type) {
            querySelectors.push('itemMeta links link[type="' + type + '"][rel="' + subject + '"]');
        }.bind(this));

        var querySelectorString = querySelectors.join(', ');
        var tagLinkNodes = this.api.newsItemArticle.querySelectorAll(querySelectorString);
        if (!tagLinkNodes) {
            return null;
        }

        var tags = [];
        var length = tagLinkNodes.length;
        for (var i = 0; i < length; i++) {
            var tag = jxon.build(tagLinkNodes[i]);
            var normalizedTag = this.normalizeObject(tag);
            tags.push(normalizedTag);
        }
        return tags;
    }


    /**
     * Get tags from document
     * @param types An array of types considered being tags. Example ['x-im/person, x-im/channel']
     *
     * @example:
     * {
     *  rel: "subject",
     *  title: "Dalarna",
     *  type: "x-im/category",
     *  uuid: "03d22994-91e4-11e5-8994-feff819cdc9f"
     * }
     *
     * @returns {*} Return array of tags in JSON or null if no links was found
     */
    getTags(types) {

        const querySelectors = types.map(item => `itemMeta links link[type="${item}"][rel="subject"]`).join(', ')

        var tagLinkNodes = this.api.newsItemArticle.querySelectorAll(querySelectors);

        if (!tagLinkNodes) {
            return null;
        }

        var tags = [];
        var length = tagLinkNodes.length;
        for (var i = 0; i < length; i++) {
            var tag = jxon.build(tagLinkNodes[i]);
            var normalizedTag = this.normalizeObject(tag);
            tags.push(normalizedTag);
        }
        return tags;
    }


    /**
     * Adds a tag to itemMeta > links section in newsItem
     *
     * The format used is identical to the search response provided by concepts backend
     * @Example
     * { "uuid": "88d36cbe-d6dd-11e5-ab30-625662870761", "name": [ "2016 Eurovision Song Contest" ], "type": [ "story" ], "typeCatalog": [ "imnat" ], "imType": [ "x-im/story" ], "inputValue": "s" }
     *
     * @param {string} name The name of the plugin
     * @param {object} tag Must containt title, type and uuid
     *
     * @fires event.DOCUMENT_CHANGED
     */
    addTag(name, tag) {
        var newsItem = this.api.newsItemArticle;
        var linksNode = newsItem.querySelector('itemMeta links');
        var tagLinkNode = newsItem.createElement('link');

        tagLinkNode.setAttribute('title', tag.name[0]);
        tagLinkNode.setAttribute('uuid', tag.uuid);
        tagLinkNode.setAttribute('rel', 'subject');
        tagLinkNode.setAttribute('type', tag.imType[0]);
        linksNode.appendChild(tagLinkNode);

        this.api.events.documentChanged(name, {
            type: 'tag',
            action: 'add',
            data: tag
        });
    }


    /**
     * Update a tag in itemMeta > links section
     *
     * @param {string} name The name of the plugin
     * @param {string} uuid The UUID of the link element
     * @param {object} tag The tag, same format as concept backend provides in search {"name": [ "2016 Eurovision Song Contest" ], "type": [ "story" ], "typeCatalog": [ "imnat" ], "imType": [ "x-im/story" ] }
     *
     * @fires event.DOCUMENT_CHANGED
     * @throws {NotFoundException}  When no node is found by provided UUID the NotFoundException is thrown
     */
    updateTag(name, uuid, tag) {
        var subject = tag.subject ? tag.subject : "subject";
        var newsItem = this.api.newsItemArticle;
        var linkTagNode = newsItem.querySelector('itemMeta links link[uuid="' + uuid + '"]');

        if (!linkTagNode) {
            throw new this.NotFoundException('Could not find linkNode with UUID: ' + uuid);
        }

        linkTagNode.setAttribute('title', tag.name[0]);
        linkTagNode.setAttribute('rel', subject);
        linkTagNode.setAttribute('type', tag.imType[0]);

        this.api.events.documentChanged(name, {
            type: 'tag',
            action: 'update',
            data: tag
        });
    }


    /**
     * Removes a link in itemMeta links by providing an UUID
     *
     * @param name The name of the plugin calling the method
     * @param uuid The uuid of the link to be removed
     *
     * @fires event.DOCUMENT_CHANGED
     */
    removeLinkByUUID(name, uuid) {
        var linkNode = this.api.newsItemArticle.querySelector('itemMeta links link[uuid="' + uuid + '"]')

        if (linkNode) {
            linkNode.parentElement.removeChild(linkNode)
            this.api.events.documentChanged(name, {
                type: 'tag',
                action: 'delete',
                data: uuid
            })
        }
        else {
            throw new this.NotFoundException('Could not find linkNode with UUID: ' + uuid)
        }
    }


    /**
     * Remove a link from itemMeta links section by type and rel attributes
     *
     * @param {string} name
     * @param {string} uuid
     * @param {string} rel
     *
     * @fires event.DOCUMENT_CHANGED
     */
    removeLinkByUUIDAndRel(name, uuid, rel) {
        var linkNode = this.api.newsItemArticle.querySelector(
            'itemMeta links link[uuid="' + uuid + '"][rel="' + rel + '"]')

        if (linkNode) {
            linkNode.parentElement.removeChild(linkNode)
            this.api.events.documentChanged(name, {
                type: 'link',
                action: 'delete',
                data: rel
            })
        }
        else {
            throw new this.NotFoundException('Could not find linkNode with UUID: ' + uuid)
        }
    }

    /**
     * Adds a new x-im/place link into itemMeta links
     *
     * @example
     * {
     *  "data":
     *    {
     *      "position":"POINT(16.570516 56.774485)"
     *    },
     *  "rel":"subject",
     *  "title":"Rälla",
     *  "type":"x-im/place",
     *  "uuid":"6599923a-d626-11e5-ab30-625662870761"
     * }
     *
     * @param name Plugin name calling function
     * @param location The location in JSON containing
     *
     * @fires event.DOCUMENT_CHANGED
     */
    addLocation(name, location) {
        var newsItem = this.api.newsItemArticle;
        var linksNode = newsItem.querySelector('itemMeta links');
        var locationLinkNode = newsItem.createElement('link');

        locationLinkNode.setAttribute('title', location.title);
        locationLinkNode.setAttribute('uuid', location.uuid);
        locationLinkNode.setAttribute('rel', 'subject');
        locationLinkNode.setAttribute('type', location.type);

        // Position is optional so check if position is provided by users
        if (location.data && location.data.position) {
            var dataNode = newsItem.createElement('data'),
                positionNode = newsItem.createElement('geometry');

            positionNode.textContent = location.data.position;
            dataNode.appendChild(positionNode);

            locationLinkNode.appendChild(dataNode);
        }

        linksNode.appendChild(locationLinkNode);

        this.api.events.documentChanged(name, {
            type: 'location',
            action: 'add',
            data: location
        });
    }

    /**
     * Update a location
     *
     * @param {string} name Name of plugin
     * @param {object} location The location in JSON
     *
     * @fires event.DOCUMENT_CHANGED
     * @throws Error
     */
    updateLocation(name, location) {
        var uuid = location.uuid;
        var linkNode = this.api.newsItemArticle.querySelector('itemMeta links link[uuid="' + uuid + '"]');

        if (linkNode) {
            linkNode.setAttribute('title', location.title);

            var positionNode = linkNode.querySelector('geometry');
            if (!positionNode) {
                var dataNode = this.api.newsItemArticle.createElement('data');
                positionNode = this.api.newsItemArticle.createElement('geometry');
                dataNode.appendChild(positionNode);
                linkNode.appendChild(dataNode);
            }
            positionNode.textContent = location.data.position;

            this.api.events.documentChanged(name, {
                type: 'location',
                action: 'update',
                data: location
            });
        }
        else {
            throw new this.NotFoundException('Could not find linkNode with UUID: ' + uuid);
        }
    }

    /**
     * Get all location with link type x-im/place, x-im/polygon or x-im/position with the specified entity
     *
     * @param {string} entity Optional entity specification, either "all", "position" or "polygon"
     *
     * @returns {array} {"data":{"position":"POINT(16.570516 56.774485)"},"rel":"subject","title":"Rälla","type":"x-im/place","uuid":"6599923a-d626-11e5-ab30-625662870761"}
     */
    getLocations(entity) {
        // Need to fetch all supported location types since there are two use cases, (1) all
        // locations are stored with type 'x-im/place' and (2) locations are stored with their
        // specific type, i.e. 'x-im/polygon' or 'x-im/position'.
        var locationNodes = this._getLinksByType(['x-im/place', 'x-im/polygon', 'x-im/position']);
        if (!locationNodes) {
            return null;
        }

        if (entity !== 'position' && entity !== 'polygon') {
            entity = 'all';
        }

        var locations = [];
        var length = locationNodes.length;
        for (var i = 0; i < length; i++) {
            var tag = jxon.build(locationNodes[i]);
            var normalizedTag = this.normalizeObject(tag);

            if (entity === 'all' || typeof normalizedTag.data === 'undefined' || typeof normalizedTag.data.geometry === 'undefined') {
                locations.push(normalizedTag);
            }
            else if (entity === 'polygon' && (normalizedTag.type === 'x-im/polygon' || normalizedTag.data.geometry.match(/^POLYGON/))) {
                locations.push(normalizedTag);
            }
            else if (entity === 'position' && (normalizedTag.type === 'x-im/position' || normalizedTag.data.geometry.match(/^POINT/))) {
                locations.push(normalizedTag);
            }
        }

        return locations;
    }


    /**
     * Adds a link to itemMeta links section
     *
     * @Example
     * this.context.api.addLink('Pluginname, {
     *       '@rel': 'channel',
     *       '@title': Jeremy Spencer,
     *       '@type': 'x-im/author',
     *       '@uuid': '5f9b8064-d54f-11e5-ab30-625662870761
     *   });
     * <link rel="author" title="Jeremy Spencer" type="x-im/author" uuid="5f9b8064-d54f-11e5-ab30-625662870761"/>
     *
     * @param {string} name The name of the plugin adding the link
     * @param {object} link Uses jxon.unbuild to transform JSON to XML. Make sure to use @ property names for attributes.
     *
     * @fires event.DOCUMENT_CHANGED Fires a documentChanged event with added link
     */
    addLink(name, link) {
        var itemMetaNode = this.api.newsItemArticle.querySelector('itemMeta links');

        var linkXML = jxon.unbuild(link, null, 'link');
        itemMetaNode.appendChild(linkXML.documentElement);

        this.api.events.documentChanged(name, {
            type: 'link',
            action: 'add',
            data: link
        });
    }


    /**
     * Retrieve all links by specified type and rel
     *
     * @param {string} name
     * @param {string} type
     * @param {string} rel
     *
     * @returns {array} Array of links
     */
    getLinkByTypeAndRel(name, type, rel) {
        var linkNodes = this.api.newsItemArticle.querySelectorAll(
            'itemMeta links link[type="' + type + '"][rel="' + rel + '"]');
        if (!linkNodes) {
            return null;
        }

        var links = [];
        for (var i = 0; i < linkNodes.length; i++) {
            links.push(jxon.build(linkNodes[i]));
        }

        return links;
    }


    /**
     * Get links in itemMeta links section by specified type
     *
     * @param {string} name Name of the plugin
     * @param {string} type The link type
     *
     * @returns {array} Return array of links transformed to JSON
     */
    getLinkByType(name, type) {
        var linkNodes = this.api.newsItemArticle.querySelectorAll('itemMeta links link[type="' + type + '"]');
        if (!linkNodes) {
            return null;
        }

        var links = [];
        for (var i = 0; i < linkNodes.length; i++) {
            links.push(jxon.build(linkNodes[i]));
        }

        return links;
    }


    /**
     * Get stories
     *
     * @return {array} Array of stories found
     */
    getStories() {
        var linkNodes = this._getLinksByType('x-im/story');
        if (!linkNodes) {
            return null;
        }

        var stories = [];
        var length = linkNodes.length;
        for (var i = 0; i < length; i++) {
            var link = jxon.build(linkNodes[i]);
            var normalizedTag = this.normalizeObject(link);
            stories.push(normalizedTag);
        }

        return stories;
    }


    /**
     * Add a story link to itemMeta links section
     *
     * @example
     * {
     *  "uuid": "88d36cbe-d6dd-11e5-ab30-625662870761",
     *  "title": "A name"
     * }
     * @param name
     * @param story
     *
     * @fires event.DOCUMENT_CHANGED
     */
    addStory(name, story) {
        var newsItem = this.api.newsItemArticle;
        var linksNode = newsItem.querySelector('itemMeta links');
        var linkNode = newsItem.createElement('link');

        linkNode.setAttribute('title', story.title);
        linkNode.setAttribute('uuid', story.uuid);
        linkNode.setAttribute('rel', 'subject');
        linkNode.setAttribute('type', 'x-im/story');

        linksNode.appendChild(linkNode);
        this.api.events.documentChanged(name, {
            type: 'story',
            action: 'add',
            data: story
        });
    }


    /**
     * Updates title on existing story
     * @param {string} name Plugin name
     * @param {object} story A story object that atleast contains title and uuid
     *
     * @fires event.DOCUMENT_CHANGED
     *
     * @example
     * {
     *  "uuid": "88d36cbe-d6dd-11e5-ab30-625662870761",
     *  "title": "A name"
     * }
     */
    updateStory(name, story) {
        var uuid = story.uuid;
        var linkNode = this.api.newsItemArticle.querySelector('itemMeta links link[uuid="' + uuid + '"]');

        if (linkNode) {
            linkNode.setAttribute('title', story.title);
            this.api.events.documentChanged(name, {
                type: 'story',
                action: 'update',
                data: story
            });
        }
        else {
            throw new this.NotFoundException('Could not find linkNode with UUID: ' + uuid);
        }
    }


    /**
     * Adds a content-profile link to NewsItem
     *
     * @example
     * {
     *  "uuid": "88d36cbe-d6dd-11e5-ab30-625662870761",
     *  "title": "A name"
     * }
     * @param {string} name Name of the plugin
     * @param {object} contentprofile A contentprofile object containing uuid and title
     *
     * @fires event.DOCUMENT_CHANGED
     */
    addConceptProfile(name, contentprofile) {
        var newsItem = this.api.newsItemArticle;
        var linksNode = newsItem.querySelector('itemMeta links');
        var linkNode = newsItem.createElement('link');

        linkNode.setAttribute('title', contentprofile.title);
        linkNode.setAttribute('uuid', contentprofile.uuid);
        linkNode.setAttribute('rel', 'subject');
        linkNode.setAttribute('type', 'x-im/content-profile');

        linksNode.appendChild(linkNode);

        this.api.events.documentChanged(name, {
            type: 'contentprofile',
            action: 'add',
            data: contentprofile
        });
    }


    /**
     * Adds a category link to NewsItem
     *
     * @example
     * {
     *  "uuid": "88d36cbe-d6dd-11e5-ab30-625662870761",
     *  "title": "A name"
     * }
     * @param {string} name Name of the plugin
     * @param {object} category A category object containing uuid and title
     *
     * @fires event.DOCUMENT_CHANGED
     */
    addCategory(name, category) {
        var newsItem = this.api.newsItemArticle;
        var linksNode = newsItem.querySelector('itemMeta links');
        var linkNode = newsItem.createElement('link');

        linkNode.setAttribute('title', category.title);
        linkNode.setAttribute('uuid', category.uuid);
        linkNode.setAttribute('rel', 'subject');
        linkNode.setAttribute('type', 'x-im/category');

        linksNode.appendChild(linkNode);

        this.api.events.documentChanged(name, {
            type: 'category',
            action: 'add',
            data: category
        });
    }


    /**
     * Updates title on existing story
     *
     * @param {string} name Plugin name
     * @param {object} story A concept profile object that atleast contains title and uuid
     *
     * @fires event.DOCUMENT_CHANGED
     *
     * @example
     * {
     *  "uuid": "88d36cbe-d6dd-11e5-ab30-625662870761",
     *  "title": "A name"
     * }
     */
    updateConceptProfile(name, contentprofile) {
        var uuid = contentprofile.uuid;
        var linkNode = this.api.newsItemArticle.querySelector('itemMeta links link[uuid="' + uuid + '"]');

        if (linkNode) {
            linkNode.setAttribute('title', contentprofile.title);
            this.api.events.documentChanged(name, {
                type: 'contentprofile',
                action: 'update',
                data: contentprofile
            });
        }
        else {
            throw new this.NotFoundException('Could not find linkNode with UUID: ' + uuid);
        }
    }


    /**
     *
     * Returns a list of all existing content-profiles in NewsItem
     *
     * @returns {array | null}
     */
    getContentProfiles() {
        var linkNodes = this._getLinksByType('x-im/content-profile');
        if (!linkNodes) {
            return null;
        }

        var links = [];
        var length = linkNodes.length;
        for (var i = 0; i < length; i++) {
            var link = jxon.build(linkNodes[i]);
            var normalizedTag = this.normalizeObject(link);
            links.push(normalizedTag);
        }

        return links;
    }


    /**
     * Returns a list of all existing categories in NewsItem
     *
     * @returns {array | null}
     */
    getCategories() {
        var linkNodes = this._getLinksByType('x-im/category');
        if (!linkNodes) {
            return null;
        }

        var links = [];
        var length = linkNodes.length;
        for (var i = 0; i < length; i++) {
            var link = jxon.build(linkNodes[i]);
            var normalizedTag = this.normalizeObject(link);
            links.push(normalizedTag);
        }

        return links;
    }


    /**
     * Generic method to find different itemMetaExtproperty nodes
     *
     * @param {string} imExtType Type of itemMetaExtproprtyNode
     * @returns {Element}
     */
    _getItemMetaExtPropertyByType(imExtType) {
        return this.api.newsItemArticle.querySelector(
            'itemMeta itemMetaExtProperty[type="' + imExtType + '"]'
        )
    }


    /**
     * Private method to find signal by qcode
     * @param {string} qcode Ex: sig:update
     * @returns {Element}
     * @private
     */
    _getSignalNodeByQcode(qcode) {
        return this.api.newsItemArticle.querySelector('itemMeta signal[qcode="' + qcode + '"]');
    }


    /**
     * Private method to get links by type
     * @returns {NodeList}
     * @access private
     */
    _getLinksByType(type) {
        if (Array.isArray(type)) {
            var queryArr = [];
            type.forEach(function (linkType) {
                queryArr.push('itemMeta links link[type="' + linkType + '"]')
            });

            var query = queryArr.join();
            return this.api.newsItemArticle.querySelectorAll(query);
        }
        else {
            return this.api.newsItemArticle.querySelectorAll('itemMeta links link[type="' + type + '"]');
        }
    }

    /**
     * Returns the generated temporary id for the article.
     * Temporary id is used when a new article is created and before it's saved the first time.
     * @returns {*|null}
     */
    getTemporaryId() {
        return this.api.app.temporaryArticleID || null
    }

    /**
     * Set a temporaryId for the article
     * @param temporaryArticleID
     */
    setTemporaryId(temporaryArticleID) {
        this.api.app.temporaryArticleID = temporaryArticleID
    }

    /**
     * Checks if current article has a temporary id
     * @returns {boolean}
     */
    hasTemporaryId() {
        return this.api.app.temporaryArticleID ? true : false;
    }

    getIdForArticle() {
        if (this.hasTemporaryId()) {
            return this.getTemporaryId()
        } else {
            return this.getGuid()
        }
    }

    /**
     * Retrieve objects from contentmeta.medata section based on type.
     *
     * @param {string} type The type of object
     * @return {Array} Array of objects in jxon format
     *
     */
    getContentMetaObjectsByType(objectType) {
        var nodes = this.api.newsItemArticle.querySelectorAll(
            'contentMeta metadata object[type="' + objectType + '"]'
        )

        if (!nodes || nodes.length === 0) {
            console.warn('Content meta data objects not found: ' + objectType)
            return null
        }

        var jxonObjects = []
        for (var n = 0; n < nodes.length; n++) {
            jxonObjects.push(jxon.build(nodes[n]))
        }

        return jxonObjects
    }

    /**
     * Retrieve object from contentmeta.medata section based on id.
     *
     * @param {string} id The id of object
     * @return {Object} Object in jxon format
     *
     */
    getContentMetaObjectById(id) {
        var node = this.api.newsItemArticle.querySelector(
            'contentMeta metadata object[id="' + id + '"]'
        )

        if (!node) {
            console.warn('Content meta data object not found: ' + id)
            return null
        }

        return jxon.build(node)
    }

    /**
     * Create and add an object into the contentmeta.metadata section.
     * The object is encoded as a jxon object with the mandatory attributes
     * id and type. All data must reside in the sub data structure. If an
     * object with the specified id already exists it is silently replaced.
     * Triggers a document:changed event.
     *
     * @param {string} name Name of the plugin making the call
     * @param {Object} jxonObject The jxon encoded object
     *
     * @example
     * var idGen = require('writer/utils/IdGenerator');
     *
     * api.setContentMetaObject('ximimage', {
     *      '@id': idGen(),
     *      '@type': "x-im/newsvalue",
     *      data: {
     *          score: "2",
     *          description: 'My description',
     *          format: "lifetimecode",
     *          end: "2016-01-31T10:00:00.000+01:00"
     *      }
     * });
     *
     * // <object id="8400c74d665x" type="x-im/newsvalue">
     * //     <data>
     * //         <score>2</score>
     * //         <description>My description</description>
     * //         <format>lifetimecode</format>
     * //         <end>2016-01-31T10:00:00.000+01:00</end>
     * //     </data>
     * // </object>
     *
     */
    setContentMetaObject(name, jxonObject) {
        if ('undefined' === typeof jxonObject) {
            throw new Error('Undefined value')
        }

        if (typeof (jxonObject['@id']) === 'undefined') {
            throw new Error('Jxon object missing @id attribute')
        }

        if (typeof (jxonObject['@type']) === 'undefined') {
            throw new Error('Jxon object missing @type attribute')
        }

        var metaDataNode = this.api.newsItemArticle.querySelector('contentMeta metadata'),
            objectNode = this.api.newsItemArticle.querySelector(
                'contentMeta metadata object[id="' + jxonObject['@id'] + '"]'
            )

        if (!metaDataNode) {
            var contentMetaNode = this.api.newsItemArticle.querySelector('contentMeta')
            metaDataNode = this.api.newsItemArticle.createElement('metadata')
            contentMetaNode.appendChild(metaDataNode)
        }
        else if (objectNode) {
            metaDataNode.removeChild(objectNode)
        }

        objectNode = jxon.unbuild(jxonObject, null, 'object')
        metaDataNode.appendChild(objectNode.childNodes[0])

        this.api.events.documentChanged(name, {
            type: 'contentmetaobject',
            action: 'delete',
            data: jxonObject
        })
    }

    /**
     * Remove a specific object identied by id from the contentmeta.metadata section.
     * Triggers a document:changed event.
     *
     * @param {string} name Name of the plugin making the call
     * @param {string} id The id of the object
     */
    removeContentMetaObject(name, id) {
        var node = this.api.newsItemArticle.querySelector(
            'contentMeta metadata object[id="' + id + '"]'
        )

        if (node) {
            node.parentElement.removeChild(node)

            this.api.events.documentChanged(name, {
                type: 'contentmetaobject',
                action: 'delete',
                data: id
            })
        }
    }
}
export default NewsItem
