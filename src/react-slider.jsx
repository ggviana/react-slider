import React from 'react'
import Direction from './direction-enum'
import defaultProps from './defaultProps'
import propTypes from './propTypes'
import autobind from './util/autobind'
import pauseEvent from './util/pauseEvent'
import stopPropagation from './util/stopPropagation'
import generateSteps from './util/generateSteps'
import {ensureArray, undoEnsureArray} from './util/array-utils'

class Slider extends React.Component {
  constructor (props) {
    super(props)

    var value = this._or(ensureArray(props.value), ensureArray(props.defaultValue))

    // array for storing resize timeouts ids
    this.pendingResizeTimeouts = []

    var zIndices = []
    for (var i = 0; i < value.length; i++) {
      value[i] = this._trimAlignValue(value[i], props)
      zIndices.push(i)
    }

    this.state = {
      index: -1,
      upperBound: 0,
      sliderLength: 0,
      value: value,
      zIndices: zIndices
    }

    autobind(this)
  }

  // Keep the internal `value` consistent with an outside `value` if present.
  // This basically allows the slider to be a controlled component.
  componentWillReceiveProps (newProps) {
    var value = this._or(ensureArray(newProps.value), this.state.value)

    for (var i = 0; i < value.length; i++) {
      this.state.value[i] = this._trimAlignValue(value[i], newProps)
    }
    if (this.state.value.length > value.length)
      this.state.value.length = value.length

    // If an upperBound has not yet been determined (due to the component being hidden
    // during the mount event, or during the last resize), then calculate it now
    if (this.state.upperBound === 0) {
      this._handleResize()
    }
  }

  // Check if the arity of `value` or `defaultValue` matches the number of children (= number of custom handles).
  // If no custom handles are provided, just returns `value` if present and `defaultValue` otherwise.
  // If custom handles are present but neither `value` nor `defaultValue` are applicable the handles are spread out
  // equally.
  // TODO: better name? better solution?
  _or (value, defaultValue) {
    var count = React.Children.count(this.props.children)
    switch (count) {
      case 0:
        return value.length > 0 ? value : defaultValue
      case value.length:
        return value
      case defaultValue.length:
        return defaultValue
      default:
        if (value.length !== count || defaultValue.length !== count) {
          console.warn(this.constructor.displayName + ": Number of values does not match number of children.")
        }
        return generateSteps(this.props.min, this.props.max, count)
    }
  }

  componentDidMount () {
    window.addEventListener('resize', this._handleResize)
    this._handleResize()
  }

  componentWillUnmount () {
    this._clearPendingResizeTimeouts()
    window.removeEventListener('resize', this._handleResize)
  }

  getValue () {
    return undoEnsureArray(this.state.value)
  }

  _handleResize () {
    // setTimeout of 0 gives element enough time to have assumed its new size if it is being resized
    var resizeTimeout = window.setTimeout(function() {
      // drop this timeout from pendingResizeTimeouts to reduce memory usage
      this.pendingResizeTimeouts.shift()

      var slider = this.refs.slider
      var handle = this.refs.handle0
      var rect = slider.getBoundingClientRect()

      var size = this._sizeKey()

      var sliderMax = rect[this._posMaxKey()]
      var sliderMin = rect[this._posMinKey()]

      this.setState({
        upperBound: slider[size] - handle[size],
        sliderLength: Math.abs(sliderMax - sliderMin),
        handleSize: handle[size],
        sliderStart: this.props.invert ? sliderMax : sliderMin
      })
    }.bind(this), 0)

    this.pendingResizeTimeouts.push(resizeTimeout)
  }

  // clear all pending timeouts to avoid error messages after unmounting
  _clearPendingResizeTimeouts() {
    do {
      var nextTimeout = this.pendingResizeTimeouts.shift()

      clearTimeout(nextTimeout)
    } while (this.pendingResizeTimeouts.length)
  }

  // calculates the offset of a handle in pixels based on its value.
  _calcOffset (value) {
    var range = this.props.max - this.props.min
    if (range === 0) {
      return 0
    }
    var ratio = (value - this.props.min) / range
    return ratio * this.state.upperBound
  }

  // calculates the value corresponding to a given pixel offset, i.e. the inverse of `_calcOffset`.
  _calcValue (offset) {
    var ratio = offset / this.state.upperBound
    return ratio * (this.props.max - this.props.min) + this.props.min
  }

  _buildHandleStyle (offset, i) {
    var style = {
      position: 'absolute',
      willChange: this.state.index >= 0 ? this._posMinKey() : '',
      zIndex: this.state.zIndices.indexOf(i) + 1
    }
    style[this._posMinKey()] = offset + 'px'
    return style
  }

  _buildBarStyle (min, max) {
    var obj = {
      position: 'absolute',
      willChange: this.state.index >= 0 ? this._posMinKey() + ',' + this._posMaxKey() : ''
    }
    obj[this._posMinKey()] = min
    obj[this._posMaxKey()] = max
    return obj
  }

  _getClosestIndex (pixelOffset) {
    var minDist = Number.MAX_VALUE
    var closestIndex = -1

    var value = this.state.value
    var l = value.length

    for (var i = 0; i < l; i++) {
      var offset = this._calcOffset(value[i])
      var dist = Math.abs(pixelOffset - offset)
      if (dist < minDist) {
        minDist = dist
        closestIndex = i
      }
    }

    return closestIndex
  }

  _calcOffsetFromPosition (position) {
    var pixelOffset = position - this.state.sliderStart
    if (this.props.invert) pixelOffset = this.state.sliderLength - pixelOffset
    pixelOffset -= (this.state.handleSize / 2)
    return pixelOffset
  }

  // Snaps the nearest handle to the value corresponding to `position` and calls `callback` with that handle's index.
  _forceValueFromPosition (position, callback) {
    var pixelOffset = this._calcOffsetFromPosition(position)
    var closestIndex = this._getClosestIndex(pixelOffset)
    var nextValue = this._trimAlignValue(this._calcValue(pixelOffset))

    var value = this.state.value.slice() // Clone this.state.value since we'll modify it temporarily
    value[closestIndex] = nextValue

    // Prevents the slider from shrinking below `props.minDistance`
    for (var i = 0; i < value.length - 1; i += 1) {
      if (value[i + 1] - value[i] < this.props.minDistance) return
    }

    this.setState({value: value}, callback.bind(this, closestIndex))
  }

  _getMousePosition (e) {
    return [
      e['page' + this._axisKey()],
      e['page' + this._orthogonalAxisKey()]
    ]
  }

  _getTouchPosition (e) {
    var touch = e.touches[0]
    return [
      touch['page' + this._axisKey()],
      touch['page' + this._orthogonalAxisKey()]
    ]
  }

  _getKeyDownEventMap () {
    return {
      'keydown': this._onKeyDown,
      'focusout': this._onBlur
    }
  }

  _getMouseEventMap () {
    return {
      'mousemove': this._onMouseMove,
      'mouseup': this._onMouseUp
    }
  }

  _getTouchEventMap () {
    return {
      'touchmove': this._onTouchMove,
      'touchend': this._onTouchEnd
    }
  }

  // create the `keydown` handler for the i-th handle
  _createOnKeyDown (i) {
    return event => {
      if (this.props.disabled) return
      this._start(i)
      this._addHandlers(this._getKeyDownEventMap())
      pauseEvent(event)
    }
  }

  // create the `mousedown` handler for the i-th handle
  _createOnMouseDown (i) {
    return event => {
      if (this.props.disabled) return
      var position = this._getMousePosition(event)
      this._start(i, position[0])
      this._addHandlers(this._getMouseEventMap())
      pauseEvent(event)
    }
  }

  // create the `touchstart` handler for the i-th handle
  _createOnTouchStart (i) {
    return event => {
      if (this.props.disabled || e.touches.length > 1) return
      var position = this._getTouchPosition(event)
      this.startPosition = position
      this.isScrolling = undefined // don't know yet if the user is trying to scroll
      this._start(i, position[0])
      this._addHandlers(this._getTouchEventMap())
      stopPropagation(event)
    }
  }

  _addHandlers (eventMap) {
    for (var key in eventMap) {
      document.addEventListener(key, eventMap[key], false)
    }
  }

  _removeHandlers (eventMap) {
    for (var key in eventMap) {
      document.removeEventListener(key, eventMap[key], false)
    }
  }

  _start (i, position) {
    var activeEl = document.activeElement
    var handleRef = this.refs['handle' + i]
    // if activeElement is body window will lost focus in IE9
    if (activeEl && activeEl != document.body && activeEl != handleRef) {
      activeEl.blur && activeEl.blur()
    }

    this.hasMoved = false

    this._fireChangeEvent('onBeforeChange')

    var zIndices = this.state.zIndices
    zIndices.splice(zIndices.indexOf(i), 1) // remove wherever the element is
    zIndices.push(i) // add to end

    this.setState({
      startValue: this.state.value[i],
      startPosition: position,
      index: i,
      zIndices: zIndices
    })
  }

  _onMouseUp () {
    this._onEnd(this._getMouseEventMap())
  }

  _onTouchEnd () {
    this._onEnd(this._getTouchEventMap())
  }

  _onBlur () {
    this._onEnd(this._getKeyDownEventMap())
  }

  _onEnd (eventMap) {
    this._removeHandlers(eventMap)
    this.setState({index: -1}, this._fireChangeEvent.bind(this, 'onAfterChange'))
  }

  _onMouseMove (e) {
    var position = this._getMousePosition(e)
    var diffPosition = this._getDiffPosition(position[0])
    var newValue = this._getValueFromPosition(diffPosition)
    this._move(newValue)
  }

  _onTouchMove (e) {
    if (e.touches.length > 1) return

    var position = this._getTouchPosition(e)

    if (typeof this.isScrolling === 'undefined') {
      var diffMainDir = position[0] - this.startPosition[0]
      var diffScrollDir = position[1] - this.startPosition[1]
      this.isScrolling = Math.abs(diffScrollDir) > Math.abs(diffMainDir)
    }

    if (this.isScrolling) {
      this.setState({index: -1})
      return
    }

    pauseEvent(e)

    var diffPosition = this._getDiffPosition(position[0])
    var newValue = this._getValueFromPosition(diffPosition)

    this._move(newValue)
  }

  _onKeyDown (e) {
    if (e.ctrlKey || e.shiftKey || e.altKey) return
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        return this._moveDownOneStep()
      case "ArrowRight":
      case "ArrowDown":
        return this._moveUpOneStep()
      case "Home":
        return this._move(this.props.min)
      case "End":
        return this._move(this.props.max)
      default:
        return
    }
  }

  _moveUpOneStep () {
    var oldValue = this.state.value[this.state.index]
    var newValue = oldValue + this.props.step
    this._move(Math.min(newValue, this.props.max))
  }

  _moveDownOneStep () {
    var oldValue = this.state.value[this.state.index]
    var newValue = oldValue - this.props.step
    this._move(Math.max(newValue, this.props.min))
  }

  _getValueFromPosition (position) {
    var diffValue = position / (this.state.sliderLength - this.state.handleSize) * (this.props.max - this.props.min)
    return this._trimAlignValue(this.state.startValue + diffValue)
  }

  _getDiffPosition (position) {
    var diffPosition = position - this.state.startPosition
    if (this.props.invert) diffPosition *= -1
    return diffPosition
  }

  _move (newValue) {
    this.hasMoved = true

    var props = this.props
    var state = this.state
    var index = state.index

    var value = state.value
    var length = value.length
    var oldValue = value[index]

    var minDistance = props.minDistance

    // if "pearling" (= handles pushing each other) is disabled,
    // prevent the handle from getting closer than `minDistance` to the previous or next handle.
    if (!props.pearling) {
      if (index > 0) {
        var valueBefore = value[index - 1]
        if (newValue < valueBefore + minDistance) {
          newValue = valueBefore + minDistance
        }
      }

      if (index < length - 1) {
        var valueAfter = value[index + 1]
        if (newValue > valueAfter - minDistance) {
          newValue = valueAfter - minDistance
        }
      }
    }

    value[index] = newValue

    // if "pearling" is enabled, let the current handle push the pre- and succeeding handles.
    if (props.pearling && length > 1) {
      if (newValue > oldValue) {
        this._pushSucceeding(value, minDistance, index)
        this._trimSucceeding(length, value, minDistance, props.max)
      }
      else if (newValue < oldValue) {
        this._pushPreceding(value, minDistance, index)
        this._trimPreceding(length, value, minDistance, props.min)
      }
    }

    // Normally you would use `shouldComponentUpdate`, but since the slider is a low-level component,
    // the extra complexity might be worth the extra performance.
    if (newValue !== oldValue) {
      this.setState({value: value}, this._fireChangeEvent.bind(this, 'onChange'))
    }
  }

  _pushSucceeding (value, minDistance, index) {
    var i, padding
    for (i = index, padding = value[i] + minDistance;
         value[i + 1] != null && padding > value[i + 1];
         i++, padding = value[i] + minDistance) {
      value[i + 1] = this._alignValue(padding)
    }
  }

  _trimSucceeding (length, nextValue, minDistance, max) {
    for (var i = 0; i < length; i++) {
      var padding = max - i * minDistance
      if (nextValue[length - 1 - i] > padding) {
        nextValue[length - 1 - i] = padding
      }
    }
  }

  _pushPreceding (value, minDistance, index) {
    var i, padding
    for (i = index, padding = value[i] - minDistance;
         value[i - 1] != null && padding < value[i - 1];
         i--, padding = value[i] - minDistance) {
      value[i - 1] = this._alignValue(padding)
    }
  }

  _trimPreceding (length, nextValue, minDistance, min) {
    for (var i = 0; i < length; i++) {
      var padding = min + i * minDistance
      if (nextValue[i] < padding) {
        nextValue[i] = padding
      }
    }
  }

  _axisKey () {
    var orientation = this.props.orientation
    if (orientation === Direction.Horizontal) return 'X'
    if (orientation === Direction.Vertical) return 'Y'
  }

  _orthogonalAxisKey () {
    var orientation = this.props.orientation
    if (orientation === Direction.Horizontal) return 'Y'
    if (orientation === Direction.Vertical) return 'X'
  }

  _posMinKey () {
    var orientation = this.props.orientation
    if (orientation === Direction.Horizontal) return this.props.invert ? 'right' : 'left'
    if (orientation === Direction.Vertical) return this.props.invert ? 'bottom' : 'top'
  }

  _posMaxKey () {
    var orientation = this.props.orientation
    if (orientation === Direction.Horizontal) return this.props.invert ? 'left' : 'right'
    if (orientation === Direction.Vertical) return this.props.invert ? 'top' : 'bottom'
  }

  _sizeKey () {
    var orientation = this.props.orientation
    if (orientation === Direction.Horizontal) return 'clientWidth'
    if (orientation === Direction.Vertical) return 'clientHeight'
  }

  _trimAlignValue (val, props) {
    return this._alignValue(this._trimValue(val, props), props)
  }

  _trimValue (val, props) {
    props = props || this.props

    if (val <= props.min) val = props.min
    if (val >= props.max) val = props.max

    return val
  }

  _alignValue (val, props) {
    props = props || this.props

    var valModStep = (val - props.min) % props.step
    var alignValue = val - valModStep

    if (Math.abs(valModStep) * 2 >= props.step) {
      alignValue += (valModStep > 0) ? props.step : (-props.step)
    }

    return parseFloat(alignValue.toFixed(5))
  }

  _renderHandle (style, child, i) {
    var className = this.props.handleClassName + ' ' +
      (this.props.handleClassName + '-' + i) + ' ' +
      (this.state.index === i ? this.props.handleActiveClassName : '')

    return (
      React.createElement('div', {
          ref: 'handle' + i,
          key: 'handle' + i,
          className: className,
          style: style,
          onMouseDown: this._createOnMouseDown(i),
          onTouchStart: this._createOnTouchStart(i),
          onFocus: this._createOnKeyDown(i),
          tabIndex: 0,
          role: "slider",
          "aria-valuenow": this.state.value[i],
          "aria-valuemin": this.props.min,
          "aria-valuemax": this.props.max,
        },
        child
      )
    )
  }

  _renderHandles (offset) {
    var length = offset.length

    var styles = new Array(length)
    for (var i = 0; i < length; i++) {
      styles[i] = this._buildHandleStyle(offset[i], i)
    }

    var res = new Array(length)
    var renderHandle = this._renderHandle
    if (React.Children.count(this.props.children) > 0) {
      React.Children.forEach(this.props.children, function (child, i) {
        res[i] = renderHandle(styles[i], child, i)
      })
    } else {
      for (i = 0; i < length; i++) {
        res[i] = renderHandle(styles[i], null, i)
      }
    }
    return res
  }

  _renderBar (i, offsetFrom, offsetTo) {
    return (
      React.createElement('div', {
        key: 'bar' + i,
        ref: 'bar' + i,
        className: this.props.barClassName + ' ' + this.props.barClassName + '-' + i,
        style: this._buildBarStyle(offsetFrom, this.state.upperBound - offsetTo)
      })
    )
  }

  _renderBars (offset) {
    var bars = []
    var lastIndex = offset.length - 1

    bars.push(this._renderBar(0, 0, offset[0]))

    for (var i = 0; i < lastIndex; i++) {
      bars.push(this._renderBar(i + 1, offset[i], offset[i + 1]))
    }

    bars.push(this._renderBar(lastIndex + 1, offset[lastIndex], this.state.upperBound))

    return bars
  }

  _onSliderMouseDown (e) {
    if (this.props.disabled) return
    this.hasMoved = false
    if (!this.props.snapDragDisabled) {
      var position = this._getMousePosition(e)
      this._forceValueFromPosition(position[0], function (i) {
        this._fireChangeEvent('onChange')
        this._start(i, position[0])
        this._addHandlers(this._getMouseEventMap())
      }.bind(this))
    }

    pauseEvent(e)
  }

  _onSliderClick (e) {
    if (this.props.disabled) return

    if (this.props.onSliderClick && !this.hasMoved) {
      var position = this._getMousePosition(e)
      var valueAtPos = this._trimAlignValue(this._calcValue(this._calcOffsetFromPosition(position[0])))
      this.props.onSliderClick(valueAtPos)
    }
  }

  _fireChangeEvent (event) {
    if (this.props[event]) {
      this.props[event](undoEnsureArray(this.state.value))
    }
  }

  render () {
    var state = this.state
    var props = this.props

    var value = state.value
    var l = value.length
    var offset = new Array(l)
    for (var i = 0; i < l; i++) {
      offset[i] = this._calcOffset(value[i], i)
    }

    var bars = props.withBars ? this._renderBars(offset) : null
    var handles = this._renderHandles(offset)

    return (
      React.createElement('div', {
          ref: 'slider',
          style: {position: 'relative'},
          className: props.className + (props.disabled ? ' disabled' : ''),
          onMouseDown: this._onSliderMouseDown,
          onClick: this._onSliderClick
        },
        bars,
        handles
      )
    )
  }
}

Slider.propTypes = propTypes
Slider.defaultProps = defaultProps

export default Slider
