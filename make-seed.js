var b = require('substance-bundler')

b.js('./seed.js', {
  target: {
    dest: './seed.cjs.js',
    format: 'cjs'
  },
  ignore: ['*.scss'],
  external: ['fs', 'whatwg-fetch'],
  commonjs: true
})
