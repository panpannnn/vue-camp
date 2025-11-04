import { activeSub } from "./effect";
import { Link, link, propagate } from './system'

enum ReaactiveFlags {
    IS_REF = '__v_isRef'
}
class RefImpl {
    _value
    [ReaactiveFlags.IS_REF] = true
    subs: Link
    subsTail: Link
    constructor(value) {
        this._value = value
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
        this._value = newValue
        triggerRef(this)
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