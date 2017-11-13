import Direction from './direction-enum'

export default {
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
}
