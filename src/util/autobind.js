const REACT_EXCLUDE_METHODS = {
  getChildContext: true,
  render: true,
  componentWillMount: true,
  componentDidMount: true,
  componentWillReceiveProps: true,
  shouldComponentUpdate: true,
  componentWillUpdate: true,
  componentDidUpdate: true,
  componentWillUnmount: true,
}

const isExcluded = methodName => REACT_EXCLUDE_METHODS[methodName] === true
const isFunction = target => typeof target === 'function'

export default function autobind (instance, proto) {
  if (proto == null) {
    proto = Object.getPrototypeOf(instance)
  }

  Object.getOwnPropertyNames(proto)
    .filter(prop => {
    const value = proto[prop]
    return isFunction(value) && !isExcluded(prop)
  })
  .forEach(prop => instance[prop] = proto[prop].bind(instance))
}
