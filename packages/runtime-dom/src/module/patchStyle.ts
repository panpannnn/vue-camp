export function patchStyle(el,prevValue,nextValue) {
    const style = el.style
    
    for(const key in nextValue){
        style[key] = nextValue[key]
    }

    if (prevValue) {
        /**
         * 把之前有的，但是现在没有的，给它删掉
         * 之前是 { background:'red' } => { color:'red' } 就要把 backgroundColor 删掉，把 color 应用上
         */
        for (const key in prevValue) {
        if (!(key in nextValue)) {
            style[key] = null
        }
        }
    }
    
}