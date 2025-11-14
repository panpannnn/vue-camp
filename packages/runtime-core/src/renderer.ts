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

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  const unmount = vnode => {
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
  const mountElement = (vnode, container, anchor) => {
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

    hostInsert(el, container, anchor)
  }

  const patchProps = (el, oldProps, newProps) => {
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }

    if (newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key])
      }
    }
  }

  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    
    /**
     *
     * 1.1 头部对比
     * c1 => [a, b]
     * c2 => [a, b, c, d]
     *
     * 开始时：i = 0, e1 = 1, e2 = 3
     * 结束时：i = 2, e1 = 1, e2 = 3
     */
    while(i<=e1 && i<=e2) {
        let n1 = c1[i]
        let n2 = c2[i]
        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, el)
        }else {
            break
        }
        i++
    }
    
    /**
     *
     * 1.2 尾部对比
     *
     * c1 => [a, b]
     * c2 => [c, d, a, b]
     * 开始时：i = 0, e1 = 1, e2 = 3
     * 结束时：i = 0，e1 = -1, e2 = 1
     */
    while(i<=e1 && i<=e2) {
        let n1 = c1[e1]
        let n2 = c2[e2]
        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, el)
        }else {
            break
        }
        e1--
        e2--
    }
    
    /**
     * i > e1 时，说明新节点比旧节点多，需要插入多出来的新节点，插入范围是 i-e2
     * i > e2 时，说明旧节点比新节点多，需要删除多出来的旧节点，删除范围是 i-e1
     */
    if (i > e1) {
        /**
         * 找到节点插入的位置
         * c1 => [a, b]
         * c2 => [d, c, a, b]
         * 开始时：i = 0, e1 = 1, e2 = 3
         * 结束时：i = 0，e1 = -1, e2 = 1
         * 要插入的元素是下标是0，1，要插入到下标为 e2+1 节点的前面[d, a, b],[d, c, a, b]
         * 
         * 如果 e2+1 !< c2.length 说明是尾部插入，anchor 为null
         * 
         * c1 => [a, b]
         * c2 => [a, b, c, d]
         * 开始时：i = 0, e1 = 1, e2 = 3
         * 结束时：i = 2，e1 = 1, e2 = 3
         * e2+1=4 !< c2.length 尾部插入[a, b, c], [a, b, c, d]
         */
        let nextPos = e2 + 1
        let anchor = nextPos < c2.length ? c2[nextPos].el : null

        while (i <= e2) {
            patch(null, c2[i], el, anchor)
            i++
        }
    }else if(i > e2) {
        while (i <= e1) {
            unmount(c1[i])
            i++
        }
    }else{
        /**
         * 乱序对比
         * c1 =>[a, b, c, d, e]
         * c2 =>[a, c, d, b, e]
         * 开始时：i = 0, e1 = 4, e2 = 4
         * 结束时：i = 1，e1 = 3, e2 = 3
         * 此时 i 既不大于 e1 也不大于 e2
         * 
         * 中间还有三个没有对比完，但是这些 `key` 还是在的
         * 所以我们需要到 `c1` 中找到对应 `key` 的虚拟节点，进行 `patch`
         * c1 =>[b, c, d]
         * c2 =>[c, d, b]
         */
        let s1 = i // 旧节点开始查找的位置
        let s2 = i // 新节点开始查找的位置
        
        const keyToNewIndexMap = new Map()
        /**
         * 遍历新的 s2 - e2 之间，这些是还没更新的，做一份 key => index map
         */
        for(let j = s2; j <= e2; j++) {
            const n2 = c2[j]
            keyToNewIndexMap.set(n2.key, j)
        }
        /**
    `     * 遍历老的子节点
         */
        for(let j = s1; j <= e1; j++) {
            let n1 = c1[j]
            
            // 找是否有新节点的 key 与旧节点的相同
            let newIndex = keyToNewIndexMap.get(n1.key)
            if (newIndex) {
                // 如果找到相同的key，就 patch
                patch(n1, c2[newIndex], el)
            }else{
                // 如果没找到相同的key，就 卸载该节点
                unmount(n1)
            }
        }

        
        /**
         * 到这里顺序还是不对，我们需要遍历新的子节点，将每个子节点插入到正确的位置
         * 1. 遍历新的子元素，调整顺序，倒序插入
         * 2. 新的有，老的没有的，我们需要重新挂载
         */
        
        for(let j = e2; j >= s1; j--) {
            const n2 = c2[j]

            // 拿到它的下一个子元素
            const anchor = c2[j+1]?.el || null
            if (n2.el) {
                // 
                hostInsert(n2.el, el, anchor)
            }else {
                // 新的有，老的没有，重新挂载
                patch(null, n2, el, anchor)
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
      // 新的是文本
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
            patchKeyedChildren(n1.children, n2.children, el)
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
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) {
      return
    }

    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    if (n1 === null) {
      // 挂载元素
      mountElement(n2, container, anchor)
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
