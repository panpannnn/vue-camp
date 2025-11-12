import { patchClass } from './module/patchClass'
import { patchStyle } from './module/patchStyle'
import { patchAttr } from './module/patchAttr'
import { patchEvent } from './module/patchEvent'
import { isOn } from '@vue/shared'
export function patchProp(el, key, prevValue, nextValue){
    if(key === 'class'){
        return patchClass(el, nextValue)
    }

    if(key === 'style'){
        return patchStyle(el,prevValue,nextValue)
    }

    if(isOn(key)){
        return patchEvent(el,prevValue,nextValue)
    }

    patchAttr(el,key,nextValue)
}