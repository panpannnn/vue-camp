import { Link, startTrack, endTrack, Sub } from "./system"

export let activeSub

export function setActiveSub(sub) {
    activeSub = sub
}

export class ReactiveEffect implements Sub {
    // 表示这个 effect 是否激活
    active = true
    // 依赖项链表头节点
    deps: Link | undefined
    // 依赖项链表尾节点
    depsTail: Link | undefined

    tracking = false
    dirty = false
    constructor(public fn) { }

    run() {
        if(!this.active) {
            return this.fn()
        }
        const prevSub = activeSub
        setActiveSub(this)
        startTrack(this)

        try {
            return this.fn()
        } finally {
            endTrack(this)
            setActiveSub(prevSub)
        }
    }

    notify() {
        this.scheduler()
    }
    scheduler() {
        this.run()
    }

    stop() {
        if(this.active){
            // 清理依赖
            // 开始追踪，会把 depsTail 设置为 undefined
            startTrack(this)
            // 结束追踪，中间没有收集依赖，所以 depsTail 为 undefined，deps 有，清理所有依赖，依赖清理完成，就不会再被触发了
            endTrack(this)
            this.active = false
        }
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