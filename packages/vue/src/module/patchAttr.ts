export function patchAttr(el,key,nextValue) {
    if(nextValue == undefined){
        el.removeAttribute(key)
    }else{
        el.setAttribute(key, nextValue)
    }
}