/**
 * 创建一个事件处理函数，内部调用 invoker.value
 * 如果需要更新事件，那后面直接修改 invoker.value 就可以完成事件换绑
 * @param e
 */
function createInvoker(value) {
    const invoker = (e) => {
        invoker.value(e)
    }
    invoker.value = value
    return invoker
}

const veiKey = Symbol('_vei')
export function patchEvent(el,rawName,nextValue) {
    const name = rawName.slice(2).toLowerCase()
    
    const invokers = (el[veiKey] ??= {}) // 等于 el._vei = el._vei ?? {}

    // 拿到之前绑定的 invoker
    const existingInvoker = invokers[rawName]
    console.log(el,invokers);
    
    if(nextValue){
        if(existingInvoker) {
            // 如果之前绑定了，那就更新 invoker.value 完成事件换绑
            existingInvoker.value = nextValue
            return
        }

        // 创建一个新的 invoker
        const invoker = createInvoker(nextValue)
        // 放到 invokers 里面去，就是 el._vei 对象
        invokers[rawName] = invoker
        // 绑定事件，事件处理函数是 invoker，调用时invoker内部会调用invoker.value，只需要修改invoker.value就可以完成事件换绑
        el.addEventListener(name,invoker)
    }else {
        /**
         * 如果新的事件没有，老的有，就移除事件
         */
        if(existingInvoker) {
            el.removeEventListener(name, existingInvoker)
            invokers[rawName] = undefined
        }
    }

    
    // if(prevValue){
    //     el.removeEventListener(name, prevValue)
    // }

    // if(nextValue) {
    //     el.addEventListener(name,nextValue)
    // }
}

// invokers: {
//     [invoker]: value
// }