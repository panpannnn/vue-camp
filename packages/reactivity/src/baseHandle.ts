import { hasChanged, isObject } from "@vue/shared";
import { isRef } from "./ref";
import { reactive } from "./reactive";
import { track, trigger } from "./dep";


export const mutableHandlers = {
    get(target, key, receiver) {
        track(target, key)

        const res = Reflect.get(target, key, receiver)

        if (isRef(res)) {
            return res.value
        }

        if (isObject(res)) {
            return reactive(res)
        }
        return Reflect.get(target, key, receiver)
    },
    set(target, key, newValue, receiver) {
        const targetIsArray = Array.isArray(target)
        const oldLength = targetIsArray? target.length : 0

        const oldValue = target[key]
        const res = Reflect.set(target, key, newValue, receiver)

        const newLength = targetIsArray? target.length : 0
        
        // 隐式更新length的情况，push pop shift unshift等方法
        if(targetIsArray && oldLength !== newLength && key !== 'length') {
            trigger(target, 'length')
        }

        if (isRef(oldValue) && !isRef(newValue)) {
            /**
             * 改了ref会触发ref的依赖更新，就不需要执行下面的trigger了
             */
            oldValue.value = newValue
            return res
        }
        
        if (hasChanged(newValue, oldValue)) {
            trigger(target, key)
        }
        return res
    }
}
