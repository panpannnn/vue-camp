import { ReactiveEffect } from 'vue'

interface Dep {
    subs: Link | undefined
    subsTail: Link | undefined
}

interface Sub {
    deps: Link | undefined
    depsTail: Link | undefined
}
export interface Link {
    sub: Sub
    nextSub: Link | undefined
    prevSub: Link | undefined
    dep: Dep
    nextDep: Link | undefined
}
export function link(dep, sub) {
    // 如果dep和sub创建过关联关系，则不重新创建link了
    const currentDep = sub.depsTail

    /**
     * 复用节点的两种情况
     * 1.sub.depsTail 没有，并且 sub.deps 有，表示要复用头节点
     * 2.如果尾节点，有nextDep，这种情况下，要尝试复用尾节点的 nextDep
     */

    // if (currentDep === undefined && sub.deps) {
    //     if (sub.deps.dep === dep) {
    //         // 移动尾指针，指向刚刚复用的节点
    //         sub.depsTail = sub.deps
    //         return
    //     }
    // } else if (currentDep) {
    //     if (currentDep.nextDep?.dep === dep) {
    //         sub.depsTail = currentDep.nextDep?.dep
    //         // 如果尾节点有，并且尾节点还有nextDep，尝试复用尾节点的nextDep
    //         return
    //     }
    // }
    const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
    if (nextDep && nextDep.dep === dep) {
        console.log('相同的依赖，直接复用');
        sub.depsTail = nextDep
        return
    }
    const newLink = {
        sub,
        dep,
        nextDep: undefined,
        nextSub: undefined,
        prevSub: undefined
    }
    if (dep.subsTail) {
        dep.subsTail.nextSub = newLink
        newLink.prevSub = dep.subsTail
        dep.subsTail = newLink
    } else {
        dep.subs = newLink
        dep.subsTail = newLink
    }

    if (sub.depsTail) {
        sub.depsTail.nextDep = newLink
        sub.depsTail = newLink
    } else {
        sub.deps = newLink
        sub.depsTail = newLink
    }
}
export function propagate(subs) {
    let link = subs
    let queuedEffect = []
    while (link) {
        queuedEffect.push(link.sub)
        link = link.nextSub
    }
    queuedEffect.forEach(effect => effect.notify())
}