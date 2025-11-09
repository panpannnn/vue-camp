import { hasChanged, isObject } from "@vue/shared";
import { isRef, reactive } from "vue";
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
        const oldValue = target[key]
        const res = Reflect.set(target, key, newValue, receiver)

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
