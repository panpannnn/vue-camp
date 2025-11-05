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
// 保存已经被清理掉的节点，留着复用
let linkPool: Link
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
        // console.log('相同的依赖，直接复用');
        sub.depsTail = nextDep
        return
    }

    let newLink

    if (linkPool) {
        newLink = linkPool
        linkPool = linkPool.nextDep
        newLink.nextDep = nextDep
        newLink.dep = dep
        newLink.sub = sub
    } else {
        newLink = {
            sub,
            dep,
            nextDep,
            nextSub: undefined,
            prevSub: undefined
        }
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
        const sub = link.sub
        if (!sub.tracking) {
            queuedEffect.push(link.sub)
        }
        link = link.nextSub
    }
    queuedEffect.forEach(effect => effect.notify())
}

export function startTrack(sub) {
    sub.tracking = true
    sub.depsTail = undefined
}

export function endTrack(sub) {
    sub.tracking = false
    const depsTail = sub.depsTail
    /**
     * 1.depsTail 有，并且 depsTail 还有nextDep， 应该把它们的依赖关系清理掉
     * 2.depsTail 没有，并且头节点有，那就把所有的都清理掉
     */
    if (depsTail) {
        if (depsTail.nextDep) {
            // console.log('把它移除', depsTail.nextDep);
            clearTracking(depsTail.nextDep)
            depsTail.nextDep = undefined
        }
    } else if (sub.deps) {
        // console.log('从头开始删', sub.deps);
        clearTracking(sub.deps)
        sub.deps = undefined
    }
}

export function clearTracking(link: Link) {
    while (link) {
        const { prevSub, nextSub, dep, nextDep } = link
        /**
         * 如果prevSub 有，就把prevSub的下一个节点，指向当前节点的下一个
         * 如果没有，那就是头节点，就把dep.subs指向当前节点的下一个
         */

        if (prevSub) {
            prevSub.nextSub = nextSub
            link.nextSub = undefined
        } else {
            dep.subs = nextSub
        }

        /**
         * 如果下一个有，那就把 nextSub 的上一个节点，指向当前节点的上一个节点
         * 如果下一个没有，那它就是尾节点，把 dep.depsTail 指向上一个节点
         */
        if (nextSub) {
            nextSub.prevSub = prevSub
            link.prevSub = undefined
        } else {
            dep.subsTail = prevSub
        }

        link.dep = link.sub = undefined

        // 把不要的节点给linkPool,让它去复用
        link.nextDep = linkPool
        linkPool = link

        link = nextDep
    }

}