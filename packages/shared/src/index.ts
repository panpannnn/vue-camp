export function isObject(value) {
    return typeof value === 'object' && value !== null
}

export function hasChanged(newValue, oldValue) {
    return !Object.is(newValue, oldValue)
}

export function isFunction(value) {
    return typeof value === 'function'
}

export function isOn(key) {
  return /^on[A-Z]/.test(key)
}