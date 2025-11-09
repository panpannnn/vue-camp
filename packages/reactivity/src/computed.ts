import { hasChanged, isFunction } from '@vue/shared'
import { ReaactiveFlags } from './ref'
import { Dependency, endTrack, link, Link, startTrack, Sub } from "./system";
import { activeSub, setActiveSub } from './effect';
class ComputedRefImpl implements Dependency, Sub {
    [ReaactiveFlags.IS_REF] = true

    // 保存fn的返回值
    _value

    subs: Link | undefined
    subsTail: Link | undefined

    deps: Link | undefined
    depsTail: Link | undefined

    tracking: Boolean

    // 为true，需要执行get value 的update
    dirty = true
    constructor(
        public fn,
        private setter
    ) { }

    get value() {

        if (this.dirty) {
            this.update()
        }

        if (activeSub) {
            link(this, activeSub)
        }

        return this._value
    }

    set value(newValue) {
        if (this.setter) {
            this.setter(newValue)
        } else {
            console.warn('this computed is readOnly')
        }
    }

    update() {
        const prevSub = activeSub
        setActiveSub(this)
        startTrack(this)
        try {
            const oldValue = this._value
            this._value = this.fn()
            return hasChanged(this._value, oldValue)
        } finally {
            endTrack(this)
            setActiveSub(prevSub)
        }
    }
}

export function computed(getterOrOptions) {
    let getter
    let setter

    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions
    } else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    return new ComputedRefImpl(getter, setter)
}