var fs = require('fs');
var path = require('path');

var Nodehun;

try {
    Nodehun = require('nodehun');
} catch (e) {
    console.log("Did not find 'nodehun', using dummy implementation");
    Nodehun = NodehunDummy
}

function NodehunDummy() {

}

NodehunDummy.prototype.isCorrect = function() {
    return true;
}



/**
 *  @param {String|ByteArray} dict loaded dict file
 *  @param {String|ByteArray} aff loaded affix file
*/
function SpellChecker(config) {
    this.dataDir = config.dir;
    this.defaultLang = config.defaultLang || 'en_US';

    this.dictionaries = {};
    this.dictionaries[this.defaultLang] = this.getDictionary(this.defaultLang);
}


/**
 *  Checks a given text block for errors.
 *
 *  @param {String} text the text to check for errors
 *  @param {Object} options an object with `lang` the language to be used
 *  @param {Function} cb a callback(err, result) with result being an arr of entries
 *      each having properties start, end, and suggestions
 */

SpellChecker.prototype.check = function(text, options, cb) {
    options = options || {};
    var lang = options.lang || this.defaultLang;
    this.getDictionary(lang, function(err, dict) {
        if (err) return cb(err, null);
        _check(text, dict, cb);
    });
}

/**
 * Provides the dictionary loaded for a given language.
 *
 * Tries to load the dictionary lazily if not loaded yet.
 */
SpellChecker.prototype.getDictionary = function(lang, cb) {
    if (!this.dictionaries[lang]) {
        this._loadDictionary(lang, cb)
    } else {
        cb(null, this.dictionaries[lang])
    }
}

/**
 * Internal implementation for loading a dictionary
 */
SpellChecker.prototype._loadDictionary = function(lang, cb) {
    var frags = _getFrags(lang)
    var affPath = path.join(this.dataDir, frags.lang, lang+'.aff');
    var dicPath = path.join(this.dataDir, frags.lang, lang+'.dic');
    fs.readFile(affPath, function(err, affBuf) {
        if (err) {
            if (lang === this.defaultLang) throw new Error('Could not load default dictionary.');
            console.error('Could not requested dictionary for language %s', lang);
            return this.getDictionary(this.defaultLang, cb);
        }
        fs.readFile(dicPath, function(err, dicBuf) {
            if (err) {
                if (lang === this.defaultLang) throw new Error('Could not load default dictionary.')
                console.error('Could not requested dictionary for language %s', lang)
                return this.getDictionary(this.defaultLang, cb)
            }
            var dictionary = new Nodehun(affBuf, dicBuf)
            this.dictionaries[lang] = dictionary
            if (cb) cb(null, dictionary)
        }.bind(this))
    }.bind(this))
}

/**
 * Splits a piece of text into words.
 * @returns an array of entries with start and end positions, and the text of the word
 */
function splitText(text) {
    let words = []
    let re = /[A-Za-z\u00C0-\u017F]+/g
    let match
    while( (match = re.exec(text)) ) {
        words.push({
            start: match.index,
            end: match.index+match[0].length,
            text: match[0]
        })
    }
    return words
}

/**
 * Internal implementation, taking every word of the given
 * text and checks with the given dictionary
 *
 * @param {String} text
 * @param {Nodehun} dict a Nodehun dictionary
 * @param {Function} cb
 */
function _check(text, dict, cb) {
    var words = splitText(text)
    var result = []

    var maxCount = words.length
    var count = 0
    words.forEach(function(w) {
        w.suggestions = []
        dict.isCorrect(w.text, function(err, correct) {
            if (err) {
                console.error(err)
                _finish()
            } else if (correct) {
                _finish()
            } else {
                dict.spellSuggestions(w.text, function(err, correct, suggestions) {
                    if (err) {
                        console.error(err)
                    } else {
                        w.suggestions = suggestions
                        result.push(w)
                    }
                    _finish()
                })
            }
        })
    })
    function _finish() {
        count++
        if (count === maxCount) {
            cb(null, result)
        }
    }
}

function _getFrags(lang) {
    var frags = lang.split('_')
    if (!frags.length === 2) {
        throw new Error('Language id should consist of <lang>_<country>, such as in "en_US"')
    }
    return {
        lang: frags[0],
        country: frags[1]
    }
}


module.exports = SpellChecker

