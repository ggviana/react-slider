import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

const common = {
  input: 'src/index.js',
  output: {
    file: 'dist/react-slider.js',
    format: 'umd',
    globals: {
      react: 'React',
      "prop-types": 'PropTypes'
    }
  },
  name: 'bundle',
  external: ['react', 'prop-types'],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
}

const minified = {
  ...common,
  output: {
    ...common.output,
    file: 'dist/react-slider.min.js'
  },
  plugins: [
    ...common.plugins,
    uglify()
  ]
}

export default [ common, minified ]
