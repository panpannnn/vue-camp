export * from '@vue/runtime-core'

import { createRenderer } from '@vue/runtime-core'

import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
 
const renderOptions = {patchProp, ...nodeOps}

const renderer = createRenderer(renderOptions)

export function render(
    vnode,
    container
){
    return renderer.render(
        vnode,
        container
    )
}

export { renderOptions }