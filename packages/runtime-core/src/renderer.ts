import { ShapeFlags } from '@vue/shared'
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

export function createRenderer(options) {
  // 提供虚拟节点 渲染到页面上的功能
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = options

  const unmountChildren = (children) => {

  }

  const unmount = (vnode) => {
    const { type, shapeFlag, children } = vnode
    if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 子节点是数组，递归卸载子节点

    }
    hostRemove(vnode.el)
  }

  const mountElement = (vnode, container) => {}

  const patchElement = (n1, n2) => {}

  /**
   * `patch` 函数的作用是用于更新和挂载虚拟节点（`vnode`）。具体来说，它会根据传入的老节点（`n1`）和新节点（`n2`）的情况，决定是进行挂载操作还是更新操作。函数的逻辑如下：
   * 1. **相同节点检查**：如果传入的老节点和新节点是同一个节点，则不进行任何操作。
   * 2. **类型检查**：如果老节点存在且老节点和新节点的类型不同，则卸载老节点，并将老节点设为 `null`。
   * 3. **挂载**：如果老节点为 `null`，则直接挂载新节点到容器中。
   * 4. **更新**：如果老节点存在且类型相同，则进行更新操作。
   * @param n1
   * @param n2
   * @param container
   */
  const patch = (n1, n2, container) => {
    if (n1 === n2) {
      return
    }

    if (n1 && !isSameVNodeType(n1, n2)) {
      n1 = null
    }

    if (n1 === null) {
      // 挂载元素
      mountElement(n2, container)
    } else {
      // 更新元素
      patchElement(n1, n2)
    }
  }

  // render 函数的作用是将虚拟节点（`vnode`）渲染到指定的容器（`container`）中。具体来说，它分为三个步骤：挂载、更新和卸载。
  const render = (vnode, container) => {
    /**
     * 分三步：
     * 1. 挂载
     * 2. 更新
     * 3. 卸载
     */

    /**
     * 如果传入的虚拟节点为 `null`，且容器中有之前的虚拟节点，则调用 `unmount` 函数卸载之前的虚拟节点。
     * 如果容器中有之前的虚拟节点，则对比新旧虚拟节点，并进行更新操作。
     */

    if (vnode === null) {
      // 卸载
      if (container._vnode) {
        unmount(container)
      }
    } else {
      // 挂载和更新
      if (container._vnode) {
        patch(container._vnode || null, vnode, container)
      }
    }

    container._vnode = vnode
  }
  return {
    render,
  }
}
