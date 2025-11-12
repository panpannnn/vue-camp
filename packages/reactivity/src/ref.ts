import { hasChanged, isObject } from "@vue/shared";
import { activeSub } from "./effect";
import { Dependency, Link, link, propagate } from './system'
import { reactive } from './reactive'

export enum ReaactiveFlags {
    IS_REF = '__v_isRef'
}
class RefImpl implements Dependency {
    _value
    [ReaactiveFlags.IS_REF] = true
    subs: Link
    subsTail: Link
    constructor(value) {
        this._value = isObject(value) ? reactive(value) : value
    }

    get value() {
        // console.log('get value', activeSub);
        if (activeSub) {
            trackRef(this)
        }
        return this._value
    }

    set value(newValue) {
        // console.log('set value');
        if (hasChanged(newValue, this._value)) {
            this._value = isObject(newValue) ? reactive(newValue) : newValue
            triggerRef(this)
        }
    }
}

export function ref(value) {
    return new RefImpl(value)
}

export function isRef(value) {
    return !!(value && value[ReaactiveFlags.IS_REF])
}

export function trackRef(dep) {
    if (activeSub) {
        link(dep, activeSub)
    }
}

export function triggerRef(dep) {
    if (dep.subs) {
        propagate(dep.subs)
    }
}

/**
 * const state = reactive({
 *     foo: 1,
 *     bar: 2
 * })
 * 双向 ref，会与源属性同步
 * const fooRef = toRef(state, 'foo')
 * 修改fooRef相当于修改state.foo， 访问fooRef.value就返回state.foo的值
 */
class ObjectRefImpl{
    [ReaactiveFlags.IS_REF] = true
    constructor(
        public _object,
        public _key,
    ){}

    get value(){
        return this._object[this._key]
    }

    set value(newValue){
        this._object[this._key] = newValue
    }
}

export function toRef(target, key) {
    return new ObjectRefImpl(target, key)
}

export function toRefs(target) {
    let result = {}
    for(const key in target) {
        result[key] = new ObjectRefImpl(target, key)
    }
    return result
}

export function unref(value) {
  return isRef(value) ? value.value : value
}