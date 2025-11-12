export * from '@vue/runtime-dom'

import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
 
const renderOptions = {patchProp, ...nodeOps}

export { renderOptions }