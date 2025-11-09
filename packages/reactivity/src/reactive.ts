import { isObject } from "@vue/shared"
import { mutableHandlers } from "./baseHandle"
export function reactive(target) {
    return createReactiveObject(target)
}

/**
 * 保存 target 和响应式对象之间的关联关系
 * target ==> proxy
 */

const reactiveMap = new WeakMap()

/**
 * 保存所有用reactive创建出来的代理对象
 */
const reactiveSet = new WeakSet()

function createReactiveObject(target) {
    /**
     * reactive 必须接收一个对象
     */

    if (!isObject(target)) {
        return target
    }

    if (isReactive(target)) {
        return target
    }

    const existingProxy = reactiveMap.get(target)
    if (existingProxy) {
        return existingProxy
    }

    const proxy = new Proxy(target, mutableHandlers)

    reactiveMap.set(target, proxy)
    reactiveSet.add(proxy)

    return proxy

}


export function isReactive(target) {
    return reactiveSet.has(target)
}