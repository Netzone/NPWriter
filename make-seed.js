var b = require('substance-bundler')
var path = require('path')

b.js('./seed.js', {
  target: {
    dest: './seed.cjs.js',
    format: 'cjs'
  },
  ignore: ['*.scss'],
  external: ['fs', 'whatwg-fetch', 'crypto'],
  alias: { 'substance': path.join(__dirname, 'node_modules/substance/index.es.js') },
  commonjs: true
})
