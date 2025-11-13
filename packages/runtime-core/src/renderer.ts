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
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  const unmount = (vnode) => {
    const { type, shapeFlag, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 子节点是数组，递归卸载子节点
      unmountChildren(children)
    }
    hostRemove(vnode.el)
  }

  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      patch(null, child, el)
    }
  }

  /**
   * 1. **创建一个 DOM 节点**：根据虚拟节点的类型（`type`），
   *    创建一个对应的 DOM 元素，并将其赋值给虚拟节点的 `el` 属性。
   * 2. **设置节点的属性**：遍历虚拟节点的属性（`props`），
   *    并使用 `hostPatchProp` 函数将这些属性设置到刚创建的 DOM 元素上。
   * 3. **挂载子节点**：根据虚拟节点的 `shapeFlag` 判断子节点的类型。
   *    如果子节点是文本，则使用 `hostSetElementText` 函数设置文本内容；
   *    如果子节点是数组，则递归调用 `mountChildren` 函数挂载每一个子节点。
   * 4. **插入到容器中**：最后，将创建好的 DOM 元素插入到指定的容器中。
   * @param vnode 
   * @param container 
   */
  const mountElement = (vnode, container) => {
    const { type, props, children, shapeFlag } = vnode
    const el = hostCreateElement(type)

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    vnode.el = el

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    hostInsert(el, container)
  }

  const patchProps = (el, oldProps, newProps) => {
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null)
      }

      if (newProps) {
        for (const key in newProps) {
          hostPatchProp(el, key, oldProps?.[key], newProps[key])
        }
      }
    }
  }

  /*  **新的子元素是文本**
        - 老节点是数组，卸载老的 `children`，将新的文本设置成 `children`
        - 老的是文本，直接替换
        - 老的是 `null`，不用关心老的，将新的设置成 `children`
    - **新的子元素是数组**
        - 老的是数组，那就和新的做全量 `diff`
        - 老的是文本，把老的清空，挂载新的 `children`
        - 老的是 `null`，不用关心老的，直接挂载新的 `children`
    - **新的子元素是 null**
        - 老的是文本，把 `children` 设置成空
        - 老的是数组，卸载老的
        - 老的是 `null`，俩个哥们都是 `null`，不用干活 */
  const patchChildren = (n1, n2) => {
    const el = n2.el
    /**
     * 1. 新节点它的子节点是 文本
     *   1.1 老的是数组
     *   1.2 老的也是文本
     * 2. 新节点的子节点是 数组 或者 null
     *   2.1 老的是文本
     *   2.2 老的也是数组
     *   2.3 老的可能是 null
     */

    const prevShapeFlg = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新的的文本
      if (prevShapeFlg & ShapeFlags.ARRAY_CHILDREN) {
        // 老的是数组
        unmountChildren(n1.children)
      }

      if (n1.children !== n2.children) {
        // 设置文本，如果n1和n2的children不一样
        hostSetElementText(el, n2.children)
      }
    } else {
      // 老的可能是数组、文本、null
      // 新的可能是数组、null

      // 老的是文本，卸载老的文本节点
      if (prevShapeFlg & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, '')
        // 新的是数组，挂载新的节点
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(n2.children, el)
        }
      } else {
        // 老的数组 或者 null     
        // 新的还是 数组 或者 null
        if (prevShapeFlg & ShapeFlags.ARRAY_CHILDREN) {
          // 老的是数组
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 新的也是数组
            // TODO 全量 diff 
          } else {
            // 新的为null，卸载老的数组
            unmountChildren(n1.children)
          }
        } else {
          // 老的为null
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 新的为数组
            mountChildren(n2.children, el)
          }
        }
      }
    }

  }

  const patchElement = (n1, n2) => {
    /**
   * 1. 复用 dom 元素
   * 2. 更新 props
   * 3. 更新 children
   */
    // 复用 dom 元素 每次进来，都拿上一次的 el，保存到最新的虚拟节点上 n2.el  
    const el = (n2.el = n1.el)
    const oldProps = n1.props
    const newProps = n2.props
    patchProps(el, oldProps, newProps)

    patchChildren(n1, n2)
  }

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
        unmount(container._vnode)
      }
    } else {
      // 挂载和更新
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode
  }
  return {
    render,
  }
}
