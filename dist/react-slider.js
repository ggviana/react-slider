(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react'), require('prop-types')) :
	typeof define === 'function' && define.amd ? define(['react', 'prop-types'], factory) :
	(global.bundle = factory(global.React,global.PropTypes));
}(this, (function (React,PropTypes) { 'use strict';

React = React && React.hasOwnProperty('default') ? React['default'] : React;
PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;

var Direction = {
  Horizontal: 'horizontal',
  Vertical: 'vertical'
};

var defaultProps = {
  min: 0,
  max: 100,
  step: 1,
  minDistance: 0,
  defaultValue: 0,
  orientation: Direction.Horizontal,
  className: 'slider',
  handleClassName: 'handle',
  handleActiveClassName: 'active',
  barClassName: 'bar',
  withBars: false,
  pearling: false,
  disabled: false,
  snapDragDisabled: false,
  invert: false
};

var propTypes = {

  /**
   * The minimum value of the slider.
   */
  min: PropTypes.number,

  /**
   * The maximum value of the slider.
   */
  max: PropTypes.number,

  /**
   * Value to be added or subtracted on each step the slider makes.
   * Must be greater than zero.
   * `max - min` should be evenly divisible by the step value.
   */
  step: PropTypes.number,

  /**
   * The minimal distance between any pair of handles.
   * Must be positive, but zero means they can sit on top of each other.
   */
  minDistance: PropTypes.number,

  /**
   * Determines the initial positions of the handles and the number of handles if the component has no children.
   *
   * If a number is passed a slider with one handle will be rendered.
   * If an array is passed each value will determine the position of one handle.
   * The values in the array must be sorted.
   * If the component has children, the length of the array must match the number of children.
   */
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number)]),

  /**
   * Like `defaultValue` but for [controlled components](http://facebook.github.io/react/docs/forms.html#controlled-components).
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number)]),

  /**
   * Determines whether the slider moves horizontally (from left to right) or vertically (from top to bottom).
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),

  /**
   * The css class set on the slider node.
   */
  className: PropTypes.string,

  /**
   * The css class set on each handle node.
   *
   * In addition each handle will receive a numbered css class of the form `${handleClassName}-${i}`,
   * e.g. `handle-0`, `handle-1`, ...
   */
  handleClassName: PropTypes.string,

  /**
   * The css class set on the handle that is currently being moved.
   */
  handleActiveClassName: PropTypes.string,

  /**
   * If `true` bars between the handles will be rendered.
   */
  withBars: PropTypes.bool,

  /**
   * The css class set on the bars between the handles.
   * In addition bar fragment will receive a numbered css class of the form `${barClassName}-${i}`,
   * e.g. `bar-0`, `bar-1`, ...
   */
  barClassName: PropTypes.string,

  /**
   * If `true` the active handle will push other handles
   * within the constraints of `min`, `max`, `step` and `minDistance`.
   */
  pearling: PropTypes.bool,

  /**
   * If `true` the handles can't be moved.
   */
  disabled: PropTypes.bool,

  /**
   * Disables handle move when clicking the slider bar
   */
  snapDragDisabled: PropTypes.bool,

  /**
   * Inverts the slider.
   */
  invert: PropTypes.bool,

  /**
   * Callback called before starting to move a handle.
   */
  onBeforeChange: PropTypes.func,

  /**
   * Callback called on every value change.
   */
  onChange: PropTypes.func,

  /**
   * Callback called only after moving a handle has ended.
   */
  onAfterChange: PropTypes.func,

  /**
   *  Callback called when the the slider is clicked (handle or bars).
   *  Receives the value at the clicked position as argument.
   */
  onSliderClick: PropTypes.func
};

var REACT_EXCLUDE_METHODS = {
  getChildContext: true,
  render: true,
  componentWillMount: true,
  componentDidMount: true,
  componentWillReceiveProps: true,
  shouldComponentUpdate: true,
  componentWillUpdate: true,
  componentDidUpdate: true,
  componentWillUnmount: true
};

var isExcluded = function isExcluded(methodName) {
  return REACT_EXCLUDE_METHODS[methodName] === true;
};
var isFunction = function isFunction(target) {
  return typeof target === 'function';
};

function autobind(instance, proto) {
  if (proto == null) {
    proto = Object.getPrototypeOf(instance);
  }

  Object.getOwnPropertyNames(proto).filter(function (prop) {
    var value = proto[prop];
    return isFunction(value) && !isExcluded(prop);
  }).forEach(function (prop) {
    return instance[prop] = proto[prop].bind(instance);
  });
}

/**
 * To prevent text selection while dragging.
 * http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
 */
function pauseEvent(event) {
  if (event.stopPropagation) event.stopPropagation();
  if (event.preventDefault) event.preventDefault();
  return false;
}

function addHandlers(eventMap) {
  for (var key in eventMap) {
    document.addEventListener(key, eventMap[key], false);
  }
}

function removeHandlers(eventMap) {
  for (var key in eventMap) {
    document.removeEventListener(key, eventMap[key], false);
  }
}

function stopPropagation(event) {
  if (event.stopPropagation) event.stopPropagation();
}

/**
 * Spreads `count` values equally between `min` and `max`.
 */
function generateSteps(min, max, count) {
  var range = (max - min) / (count - 1);
  var res = [];

  for (var i = 0; i < count; i++) {
    res.push(min + range * i);
  }

  return res;
}

function ensureArray(x) {
  return x == null ? [] : Array.isArray(x) ? x : [x];
}

function undoEnsureArray(x) {
  return x != null && x.length === 1 ? x[0] : x;
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var Slider = function (_React$Component) {
  inherits(Slider, _React$Component);

  function Slider(props) {
    classCallCheck(this, Slider);

    var _this = possibleConstructorReturn(this, (Slider.__proto__ || Object.getPrototypeOf(Slider)).call(this, props));

    var value = _this._or(ensureArray(props.value), ensureArray(props.defaultValue));

    // array for storing resize timeouts ids
    _this.pendingResizeTimeouts = [];

    var zIndices = [];
    for (var i = 0; i < value.length; i++) {
      value[i] = _this._trimAlignValue(value[i], props);
      zIndices.push(i);
    }

    _this.state = {
      index: -1,
      upperBound: 0,
      sliderLength: 0,
      value: value,
      zIndices: zIndices
    };

    autobind(_this);
    return _this;
  }

  // Keep the internal `value` consistent with an outside `value` if present.
  // This basically allows the slider to be a controlled component.


  createClass(Slider, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(newProps) {
      var value = this._or(ensureArray(newProps.value), this.state.value);

      for (var i = 0; i < value.length; i++) {
        this.state.value[i] = this._trimAlignValue(value[i], newProps);
      }
      if (this.state.value.length > value.length) this.state.value.length = value.length;

      // If an upperBound has not yet been determined (due to the component being hidden
      // during the mount event, or during the last resize), then calculate it now
      if (this.state.upperBound === 0) {
        this._handleResize();
      }
    }

    // Check if the arity of `value` or `defaultValue` matches the number of children (= number of custom handles).
    // If no custom handles are provided, just returns `value` if present and `defaultValue` otherwise.
    // If custom handles are present but neither `value` nor `defaultValue` are applicable the handles are spread out
    // equally.
    // TODO: better name? better solution?

  }, {
    key: '_or',
    value: function _or(value, defaultValue) {
      var count = React.Children.count(this.props.children);
      switch (count) {
        case 0:
          return value.length > 0 ? value : defaultValue;
        case value.length:
          return value;
        case defaultValue.length:
          return defaultValue;
        default:
          if (value.length !== count || defaultValue.length !== count) {
            console.warn(this.constructor.displayName + ": Number of values does not match number of children.");
          }
          return generateSteps(this.props.min, this.props.max, count);
      }
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      window.addEventListener('resize', this._handleResize);
      this._handleResize();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._clearPendingResizeTimeouts();
      window.removeEventListener('resize', this._handleResize);
    }
  }, {
    key: 'getValue',
    value: function getValue() {
      return undoEnsureArray(this.state.value);
    }
  }, {
    key: '_handleResize',
    value: function _handleResize() {
      // setTimeout of 0 gives element enough time to have assumed its new size if it is being resized
      var resizeTimeout = window.setTimeout(function () {
        // drop this timeout from pendingResizeTimeouts to reduce memory usage
        this.pendingResizeTimeouts.shift();

        var slider = this.refs.slider;
        var handle = this.refs.handle0;
        var rect = slider.getBoundingClientRect();

        var size = this._sizeKey();

        var sliderMax = rect[this._posMaxKey()];
        var sliderMin = rect[this._posMinKey()];

        this.setState({
          upperBound: slider[size] - handle[size],
          sliderLength: Math.abs(sliderMax - sliderMin),
          handleSize: handle[size],
          sliderStart: this.props.invert ? sliderMax : sliderMin
        });
      }.bind(this), 0);

      this.pendingResizeTimeouts.push(resizeTimeout);
    }

    // clear all pending timeouts to avoid error messages after unmounting

  }, {
    key: '_clearPendingResizeTimeouts',
    value: function _clearPendingResizeTimeouts() {
      do {
        var nextTimeout = this.pendingResizeTimeouts.shift();

        clearTimeout(nextTimeout);
      } while (this.pendingResizeTimeouts.length);
    }

    // calculates the offset of a handle in pixels based on its value.

  }, {
    key: '_calcOffset',
    value: function _calcOffset(value) {
      var range = this.props.max - this.props.min;
      if (range === 0) {
        return 0;
      }
      var ratio = (value - this.props.min) / range;
      return ratio * this.state.upperBound;
    }

    // calculates the value corresponding to a given pixel offset, i.e. the inverse of `_calcOffset`.

  }, {
    key: '_calcValue',
    value: function _calcValue(offset) {
      var ratio = offset / this.state.upperBound;
      return ratio * (this.props.max - this.props.min) + this.props.min;
    }
  }, {
    key: '_buildHandleStyle',
    value: function _buildHandleStyle(offset, i) {
      var style = {
        position: 'absolute',
        willChange: this.state.index >= 0 ? this._posMinKey() : '',
        zIndex: this.state.zIndices.indexOf(i) + 1
      };
      style[this._posMinKey()] = offset + 'px';
      return style;
    }
  }, {
    key: '_buildBarStyle',
    value: function _buildBarStyle(min, max) {
      var obj = {
        position: 'absolute',
        willChange: this.state.index >= 0 ? this._posMinKey() + ',' + this._posMaxKey() : ''
      };
      obj[this._posMinKey()] = min;
      obj[this._posMaxKey()] = max;
      return obj;
    }
  }, {
    key: '_getClosestIndex',
    value: function _getClosestIndex(pixelOffset) {
      var minDist = Number.MAX_VALUE;
      var closestIndex = -1;

      var value = this.state.value;
      var l = value.length;

      for (var i = 0; i < l; i++) {
        var offset = this._calcOffset(value[i]);
        var dist = Math.abs(pixelOffset - offset);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
        }
      }

      return closestIndex;
    }
  }, {
    key: '_calcOffsetFromPosition',
    value: function _calcOffsetFromPosition(position) {
      var pixelOffset = position - this.state.sliderStart;
      if (this.props.invert) pixelOffset = this.state.sliderLength - pixelOffset;
      pixelOffset -= this.state.handleSize / 2;
      return pixelOffset;
    }

    // Snaps the nearest handle to the value corresponding to `position` and calls `callback` with that handle's index.

  }, {
    key: '_forceValueFromPosition',
    value: function _forceValueFromPosition(position, callback) {
      var pixelOffset = this._calcOffsetFromPosition(position);
      var closestIndex = this._getClosestIndex(pixelOffset);
      var nextValue = this._trimAlignValue(this._calcValue(pixelOffset));

      var value = this.state.value.slice(); // Clone this.state.value since we'll modify it temporarily
      value[closestIndex] = nextValue;

      // Prevents the slider from shrinking below `props.minDistance`
      for (var i = 0; i < value.length - 1; i += 1) {
        if (value[i + 1] - value[i] < this.props.minDistance) return;
      }

      this.setState({ value: value }, callback.bind(this, closestIndex));
    }
  }, {
    key: '_getMousePosition',
    value: function _getMousePosition(e) {
      return [e['page' + this._axisKey()], e['page' + this._orthogonalAxisKey()]];
    }
  }, {
    key: '_getTouchPosition',
    value: function _getTouchPosition(e) {
      var touch = e.touches[0];
      return [touch['page' + this._axisKey()], touch['page' + this._orthogonalAxisKey()]];
    }
  }, {
    key: '_getKeyDownEventMap',
    value: function _getKeyDownEventMap() {
      return {
        'keydown': this._onKeyDown,
        'focusout': this._onBlur
      };
    }
  }, {
    key: '_getMouseEventMap',
    value: function _getMouseEventMap() {
      return {
        'mousemove': this._onMouseMove,
        'mouseup': this._onMouseUp
      };
    }
  }, {
    key: '_getTouchEventMap',
    value: function _getTouchEventMap() {
      return {
        'touchmove': this._onTouchMove,
        'touchend': this._onTouchEnd
      };
    }

    // create the `keydown` handler for the i-th handle

  }, {
    key: '_createOnKeyDown',
    value: function _createOnKeyDown(i) {
      var _this2 = this;

      return function (event) {
        if (_this2.props.disabled) return;
        _this2._start(i);
        addHandlers(_this2._getKeyDownEventMap());
        pauseEvent(event);
      };
    }

    // create the `mousedown` handler for the i-th handle

  }, {
    key: '_createOnMouseDown',
    value: function _createOnMouseDown(i) {
      var _this3 = this;

      return function (event) {
        if (_this3.props.disabled) return;
        var position = _this3._getMousePosition(event);
        _this3._start(i, position[0]);
        addHandlers(_this3._getMouseEventMap());
        pauseEvent(event);
      };
    }

    // create the `touchstart` handler for the i-th handle

  }, {
    key: '_createOnTouchStart',
    value: function _createOnTouchStart(i) {
      var _this4 = this;

      return function (event) {
        if (_this4.props.disabled || e.touches.length > 1) return;
        var position = _this4._getTouchPosition(event);
        _this4.startPosition = position;
        _this4.isScrolling = undefined; // don't know yet if the user is trying to scroll
        _this4._start(i, position[0]);
        addHandlers(_this4._getTouchEventMap());
        stopPropagation(event);
      };
    }
  }, {
    key: '_start',
    value: function _start(i, position) {
      var activeEl = document.activeElement;
      var handleRef = this.refs['handle' + i];
      // if activeElement is body window will lost focus in IE9
      if (activeEl && activeEl != document.body && activeEl != handleRef) {
        activeEl.blur && activeEl.blur();
      }

      this.hasMoved = false;

      this._fireChangeEvent('onBeforeChange');

      var zIndices = this.state.zIndices;
      zIndices.splice(zIndices.indexOf(i), 1); // remove wherever the element is
      zIndices.push(i); // add to end

      this.setState({
        startValue: this.state.value[i],
        startPosition: position,
        index: i,
        zIndices: zIndices
      });
    }
  }, {
    key: '_onMouseUp',
    value: function _onMouseUp() {
      this._onEnd(this._getMouseEventMap());
    }
  }, {
    key: '_onTouchEnd',
    value: function _onTouchEnd() {
      this._onEnd(this._getTouchEventMap());
    }
  }, {
    key: '_onBlur',
    value: function _onBlur() {
      this._onEnd(this._getKeyDownEventMap());
    }
  }, {
    key: '_onEnd',
    value: function _onEnd(eventMap) {
      removeHandlers(eventMap);
      this.setState({ index: -1 }, this._fireChangeEvent.bind(this, 'onAfterChange'));
    }
  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(e) {
      var position = this._getMousePosition(e);
      var diffPosition = this._getDiffPosition(position[0]);
      var newValue = this._getValueFromPosition(diffPosition);
      this._move(newValue);
    }
  }, {
    key: '_onTouchMove',
    value: function _onTouchMove(e) {
      if (e.touches.length > 1) return;

      var position = this._getTouchPosition(e);

      if (typeof this.isScrolling === 'undefined') {
        var diffMainDir = position[0] - this.startPosition[0];
        var diffScrollDir = position[1] - this.startPosition[1];
        this.isScrolling = Math.abs(diffScrollDir) > Math.abs(diffMainDir);
      }

      if (this.isScrolling) {
        this.setState({ index: -1 });
        return;
      }

      pauseEvent(e);

      var diffPosition = this._getDiffPosition(position[0]);
      var newValue = this._getValueFromPosition(diffPosition);

      this._move(newValue);
    }
  }, {
    key: '_onKeyDown',
    value: function _onKeyDown(e) {
      if (e.ctrlKey || e.shiftKey || e.altKey) return;
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          return this._moveDownOneStep();
        case "ArrowRight":
        case "ArrowDown":
          return this._moveUpOneStep();
        case "Home":
          return this._move(this.props.min);
        case "End":
          return this._move(this.props.max);
        default:
          return;
      }
    }
  }, {
    key: '_moveUpOneStep',
    value: function _moveUpOneStep() {
      var oldValue = this.state.value[this.state.index];
      var newValue = oldValue + this.props.step;
      this._move(Math.min(newValue, this.props.max));
    }
  }, {
    key: '_moveDownOneStep',
    value: function _moveDownOneStep() {
      var oldValue = this.state.value[this.state.index];
      var newValue = oldValue - this.props.step;
      this._move(Math.max(newValue, this.props.min));
    }
  }, {
    key: '_getValueFromPosition',
    value: function _getValueFromPosition(position) {
      var diffValue = position / (this.state.sliderLength - this.state.handleSize) * (this.props.max - this.props.min);
      return this._trimAlignValue(this.state.startValue + diffValue);
    }
  }, {
    key: '_getDiffPosition',
    value: function _getDiffPosition(position) {
      var diffPosition = position - this.state.startPosition;
      if (this.props.invert) diffPosition *= -1;
      return diffPosition;
    }
  }, {
    key: '_move',
    value: function _move(newValue) {
      this.hasMoved = true;

      var props = this.props;
      var state = this.state;
      var index = state.index;

      var value = state.value;
      var length = value.length;
      var oldValue = value[index];

      var minDistance = props.minDistance;

      // if "pearling" (= handles pushing each other) is disabled,
      // prevent the handle from getting closer than `minDistance` to the previous or next handle.
      if (!props.pearling) {
        if (index > 0) {
          var valueBefore = value[index - 1];
          if (newValue < valueBefore + minDistance) {
            newValue = valueBefore + minDistance;
          }
        }

        if (index < length - 1) {
          var valueAfter = value[index + 1];
          if (newValue > valueAfter - minDistance) {
            newValue = valueAfter - minDistance;
          }
        }
      }

      value[index] = newValue;

      // if "pearling" is enabled, let the current handle push the pre- and succeeding handles.
      if (props.pearling && length > 1) {
        if (newValue > oldValue) {
          this._pushSucceeding(value, minDistance, index);
          this._trimSucceeding(length, value, minDistance, props.max);
        } else if (newValue < oldValue) {
          this._pushPreceding(value, minDistance, index);
          this._trimPreceding(length, value, minDistance, props.min);
        }
      }

      // Normally you would use `shouldComponentUpdate`, but since the slider is a low-level component,
      // the extra complexity might be worth the extra performance.
      if (newValue !== oldValue) {
        this.setState({ value: value }, this._fireChangeEvent.bind(this, 'onChange'));
      }
    }
  }, {
    key: '_pushSucceeding',
    value: function _pushSucceeding(value, minDistance, index) {
      var i = void 0,
          padding = void 0;
      for (i = index, padding = value[i] + minDistance; value[i + 1] != null && padding > value[i + 1]; i++, padding = value[i] + minDistance) {
        value[i + 1] = this._alignValue(padding);
      }
    }
  }, {
    key: '_trimSucceeding',
    value: function _trimSucceeding(length, nextValue, minDistance, max) {
      for (var i = 0; i < length; i++) {
        var padding = max - i * minDistance;
        if (nextValue[length - 1 - i] > padding) {
          nextValue[length - 1 - i] = padding;
        }
      }
    }
  }, {
    key: '_pushPreceding',
    value: function _pushPreceding(value, minDistance, index) {
      var i = void 0,
          padding = void 0;
      for (i = index, padding = value[i] - minDistance; value[i - 1] != null && padding < value[i - 1]; i--, padding = value[i] - minDistance) {
        value[i - 1] = this._alignValue(padding);
      }
    }
  }, {
    key: '_trimPreceding',
    value: function _trimPreceding(length, nextValue, minDistance, min) {
      for (var i = 0; i < length; i++) {
        var padding = min + i * minDistance;
        if (nextValue[i] < padding) {
          nextValue[i] = padding;
        }
      }
    }
  }, {
    key: '_axisKey',
    value: function _axisKey() {
      var orientation = this.props.orientation;
      if (orientation === Direction.Horizontal) return 'X';
      if (orientation === Direction.Vertical) return 'Y';
    }
  }, {
    key: '_orthogonalAxisKey',
    value: function _orthogonalAxisKey() {
      var orientation = this.props.orientation;
      if (orientation === Direction.Horizontal) return 'Y';
      if (orientation === Direction.Vertical) return 'X';
    }
  }, {
    key: '_posMinKey',
    value: function _posMinKey() {
      var orientation = this.props.orientation;
      if (orientation === Direction.Horizontal) return this.props.invert ? 'right' : 'left';
      if (orientation === Direction.Vertical) return this.props.invert ? 'bottom' : 'top';
    }
  }, {
    key: '_posMaxKey',
    value: function _posMaxKey() {
      var orientation = this.props.orientation;
      if (orientation === Direction.Horizontal) return this.props.invert ? 'left' : 'right';
      if (orientation === Direction.Vertical) return this.props.invert ? 'top' : 'bottom';
    }
  }, {
    key: '_sizeKey',
    value: function _sizeKey() {
      var orientation = this.props.orientation;
      if (orientation === Direction.Horizontal) return 'clientWidth';
      if (orientation === Direction.Vertical) return 'clientHeight';
    }
  }, {
    key: '_trimAlignValue',
    value: function _trimAlignValue(val, props) {
      return this._alignValue(this._trimValue(val, props), props);
    }
  }, {
    key: '_trimValue',
    value: function _trimValue(val, props) {
      props = props || this.props;

      if (val <= props.min) val = props.min;
      if (val >= props.max) val = props.max;

      return val;
    }
  }, {
    key: '_alignValue',
    value: function _alignValue(val, props) {
      props = props || this.props;

      var valModStep = (val - props.min) % props.step;
      var alignValue = val - valModStep;

      if (Math.abs(valModStep) * 2 >= props.step) {
        alignValue += valModStep > 0 ? props.step : -props.step;
      }

      return parseFloat(alignValue.toFixed(5));
    }
  }, {
    key: '_renderHandle',
    value: function _renderHandle(style, child, i) {
      var className = this.props.handleClassName + ' ' + (this.props.handleClassName + '-' + i) + ' ' + (this.state.index === i ? this.props.handleActiveClassName : '');

      return React.createElement('div', {
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
        "aria-valuemax": this.props.max
      }, child);
    }
  }, {
    key: '_renderHandles',
    value: function _renderHandles(offset) {
      var length = offset.length;

      var styles = new Array(length);
      for (var i = 0; i < length; i++) {
        styles[i] = this._buildHandleStyle(offset[i], i);
      }

      var res = new Array(length);
      var renderHandle = this._renderHandle;
      if (React.Children.count(this.props.children) > 0) {
        React.Children.forEach(this.props.children, function (child, i) {
          res[i] = renderHandle(styles[i], child, i);
        });
      } else {
        for (var _i = 0; _i < length; _i++) {
          res[_i] = renderHandle(styles[_i], null, _i);
        }
      }
      return res;
    }
  }, {
    key: '_renderBar',
    value: function _renderBar(i, offsetFrom, offsetTo) {
      return React.createElement('div', {
        key: 'bar' + i,
        ref: 'bar' + i,
        className: this.props.barClassName + ' ' + this.props.barClassName + '-' + i,
        style: this._buildBarStyle(offsetFrom, this.state.upperBound - offsetTo)
      });
    }
  }, {
    key: '_renderBars',
    value: function _renderBars(offset) {
      var bars = [];
      var lastIndex = offset.length - 1;

      bars.push(this._renderBar(0, 0, offset[0]));

      for (var i = 0; i < lastIndex; i++) {
        bars.push(this._renderBar(i + 1, offset[i], offset[i + 1]));
      }

      bars.push(this._renderBar(lastIndex + 1, offset[lastIndex], this.state.upperBound));

      return bars;
    }
  }, {
    key: '_onSliderMouseDown',
    value: function _onSliderMouseDown(e) {
      if (this.props.disabled) return;
      this.hasMoved = false;
      if (!this.props.snapDragDisabled) {
        var position = this._getMousePosition(e);
        this._forceValueFromPosition(position[0], function (i) {
          this._fireChangeEvent('onChange');
          this._start(i, position[0]);
          addHandlers(this._getMouseEventMap());
        }.bind(this));
      }

      pauseEvent(e);
    }
  }, {
    key: '_onSliderClick',
    value: function _onSliderClick(e) {
      if (this.props.disabled) return;

      if (this.props.onSliderClick && !this.hasMoved) {
        var position = this._getMousePosition(e);
        var valueAtPos = this._trimAlignValue(this._calcValue(this._calcOffsetFromPosition(position[0])));
        this.props.onSliderClick(valueAtPos);
      }
    }
  }, {
    key: '_fireChangeEvent',
    value: function _fireChangeEvent(event) {
      if (this.props[event]) {
        this.props[event](undoEnsureArray(this.state.value));
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var state = this.state;
      var props = this.props;

      var value = state.value;
      var l = value.length;
      var offset = new Array(l);
      for (var i = 0; i < l; i++) {
        offset[i] = this._calcOffset(value[i], i);
      }

      var bars = props.withBars ? this._renderBars(offset) : null;
      var handles = this._renderHandles(offset);

      return React.createElement('div', {
        ref: 'slider',
        style: { position: 'relative' },
        className: props.className + (props.disabled ? ' disabled' : ''),
        onMouseDown: this._onSliderMouseDown,
        onClick: this._onSliderClick
      }, bars, handles);
    }
  }]);
  return Slider;
}(React.Component);

Slider.propTypes = propTypes;
Slider.defaultProps = defaultProps;

return Slider;

})));
