import { ReactiveEffect } from './effect'
import { isRef } from "./ref";
import { isReactive } from "./reactive";
import { isFunction, isObject } from '@vue/shared';
export function watch(source, cb, option) {
    let {deep, immediate, once} = option || {}

    if(once) {
        const _cb = cb
        cb = (...args) => {
            _cb(...args)
            stop() // 执行完一次停止监听
        }
    }

    let getter

    if (isRef(source)) {
        getter = () => source.value
    }else if(isReactive(source)) {
        getter = () => source
        if(!deep) deep = true
    }else if(isFunction(source)) {
        getter = source
    }

    if (deep) {
        const baseGetter = getter
        const depth = deep === true ? Infinity : deep
        getter = () => traverse(baseGetter(), depth)
    }

    const effect = new ReactiveEffect(getter)

    effect.scheduler = job
    
    let oldValue
    let cleanup = null

    function onCleanup(cb) {
        cleanup = cb
    }

    function job() {
        if(cleanup){
            cleanup()
            cleanup =null
        }
        const newValue = effect.run()
        cb(newValue, oldValue, onCleanup)
        oldValue = newValue
    }

    if(immediate) {
        job() // 立即执行一次
    }else {
        // 仅在 immediate = false 的情况下，手动执行 effect.run 收集依赖
        oldValue = effect.run()
    }

    function stop() {
        effect.stop()
    }
    
    // 返回个停止监听器的方法
    return stop
}

function traverse(value, depth = Infinity, seen = new Set()) {
    if (!isObject(value) || depth<=0) return
    if(seen.has(value)) {
        return value
    }
    seen.add(value)
    depth--
    for(let key in value){
        traverse(value[key],depth,seen)
    }
    return value
}