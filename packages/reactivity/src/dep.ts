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

    let dep = depsMap.get(key)

    if (!dep) {
        return
    }

    propagate(dep.subs)
}

class Dep {
    subs: Link
    substail: Link
    constructor() { }
}