import { activeSub } from './effect'
import { Link, link, propagate } from "./system";
const targetMap = new WeakMap()

export function track(target, key) {
    if (!activeSub) {
        return
    }

    let depsMap = targetMap.get(target)

    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }

    let dep = depsMap.get(key)

    if (!dep) {
        dep = new Dep()
        depsMap.set(key, dep)
    }
    link(dep, activeSub)

}

export function trigger(target, key) {
    let depsMap = targetMap.get(target)

    if (!depsMap) {
        return
    }

    /**
     * 数组的deps
     * depsMap : {
     *    0: Dep
     *    1: Dep
     *    2: Dep
     *    3: Dep
     *    length: Dep
     * }
     * 显示更新length arr.length = 2后 得到数组['a','b']，c,d已经没有了，需要更新dep.subs
     */
    
    const targetIsArray = Array.isArray(target)
    const newLength = targetIsArray? target.length : 0
    
    if(targetIsArray && key === 'length') {
        depsMap.forEach((dep,depKey) => {
            if(depKey>=newLength || depKey === 'length') {
                propagate(dep.subs)
            }
        });
    }else {
        let dep = depsMap.get(key)

        if (!dep) {
            return
        }

        propagate(dep.subs)
    }
}

class Dep {
    subs: Link
    substail: Link
    constructor() { }
}