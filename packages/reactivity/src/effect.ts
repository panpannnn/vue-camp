import { Link } from "./system"

export let activeSub

class ReactiveEffect {
    // 依赖项链表头节点
    deps: Link | undefined
    // 依赖项链表尾节点
    depsTail: Link | undefined
    constructor(public fn) { }

    run() {
        const prevSub = activeSub
        activeSub = this
        this.depsTail = undefined

        try {
            return this.fn()
        } finally {
            activeSub = prevSub
        }
    }

    notify() {
        this.scheduler()
    }
    scheduler() {
        this.run()
    }
}
export function effect(fn, option) {
    const e = new ReactiveEffect(fn)
    Object.assign(e, option)
    e.run()
    // const runner = () => e.run()
    const runner = e.run.bind(e)
    runner.effect = e
    return runner
}