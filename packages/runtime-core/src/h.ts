// import { isArray, isObject } from "@vue/shared"

/**
 * h 函数的使用方法：
 * 1. h('div', 'hello world') 第二个参数为 子节点
 * 2. h('div', [h('span', 'hello'), h('span', ' world')]) 第二个参数为 子节点
 * 3. h('div', h('span', 'hello')) 第二个参数为 子节点
 * 4. h('div', { class: 'container' }) 第二个参数是 props
 * ------
 * 5. h('div', { class: 'container' }, 'hello world')
 * 6. h('div', { class: 'container' }, h('span', 'hello world'))
 * 7. h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
 * 8. h('div', { class: 'container' },[h('span', 'hello'), h('span', 'world')]) 和 7 一个意思
 */
// export function h(type, propsOrChildren?, children?) {
//     /**
//      * h 函数，主要的作用是对 createVNode 做一个参数标准化（归一化）
//      */
//     const l = arguments.length
//     if(l === 2){
//         // 如果第二个参数为数组，说明第二个参数是子节点数组
//         if(isArray(propsOrChildren)) {
//             return createVNode(type, null, propsOrChildren)
//         }

//         // 如果第二个参数为对象
//         if(isObject(propsOrChildren)) {
//             if(isVNode(propsOrChildren)) {
//                 // 如果第二个参数是虚拟节点，说明第二个参数是子节点，需要包装成数组
//                 return createVNode(type, null, [propsOrChildren])
//             }
//             // 第二个参数为属性对象
//             return createVNode(type, propsOrChildren, children)
//             
//         }

//         // 第二个参数为文本，说明第二个参数是子节点，这里不需要包装成数组
//         return createVNode(type, null, propsOrChildren)
//     }else{
//         if(l>3) {
//             children = [...arguments].slice(2)
//         }else if(isVNode(children)){
//             children = [children]
//         }

//         return createVNode(type, propsOrChildren, children)
//     }
// }

// function isVNode(value) {
//     return value?.__v_isVNode
// }

// /**
//  * 创建虚拟节点的底层方法
//  * @param type 节点类型
//  * @param props 节点的属性
//  * @param children 子节点
//  */
// function createVNode(type, props?, children?) {
//     const vnode = {
//         __v_isVNode: true,
//         type,
//         props,
//         children,
//         key: props?.key,

//         // 虚拟节点要挂载的元素
//         el: null,
//         shapeFlag: 9
//     }

//     return vnode
// }





// 文档复制的
import {
  isArray,
  isObject
} from '@vue/shared'

/**
 * h 函数的使用方法：
 * 1. h('div', 'hello world') 第二个参数为 子节点
 * 2. h('div', [h('span', 'hello'), h('span', ' world')]) 第二个参数为 子节点
 * 3. h('div', h('span', 'hello')) 第二个参数为 子节点
 * 4. h('div', { class: 'container' }) 第二个参数是 props
 * ------
 * 5. h('div', { class: 'container' }, 'hello world')
 * 6. h('div', { class: 'container' }, h('span', 'hello world'))
 * 7. h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
 * 8. h('div', { class: 'container' },[h('span', 'hello'), h('span', 'world')]) 和 7 一个意思
 */

export function h(
  type,
  propsOrChildren?,
  children?
) {
  /**
   * h 函数，主要的作用是对 createVNode 做一个参数标准化（归一化）
   */

  let l = arguments.length

  if (l === 2) {
    // 两个参数的情况

    if (isArray(propsOrChildren)) {
      // h('div', [h('span', 'hello'), h('span', ' world')])
      return createVNode(
        type,
        null,
        propsOrChildren
      )
    }

    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // h('div', h('span', 'hello'))
        return createVNode(type, null, [
          propsOrChildren
        ])
      }
      // h('div', { class: 'container' })
      return createVNode(
        type,
        propsOrChildren,
        children
      )
    }

    // h('div', 'hello world')
    return createVNode(
      type,
      null,
      propsOrChildren
    )
  } else {
    if (l > 3) {
      /**
       * h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
       * 转换成
       * h('div', { class: 'container' }, [h('span', 'hello'), h('span', 'world')])
       */
      children = [...arguments].slice(2)
    } else if (isVNode(children)) {
      // h('div', { class: 'container' }, h('span', 'hello world'))
      children = [children]
    }
    // 要是只传了 type
    return createVNode(
      type,
      propsOrChildren,
      children
    )
  }
}

/**
 * 判断是不是一个虚拟节点，根据 __v_isVNode 属性
 * @param value
 */
function isVNode(value) {
  return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
function createVNode(
  type,
  props?,
  children?
) {
  const vnode = {
    // 证明我是一个虚拟节点
    __v_isVNode: true,
    type,
    props,
    children,
    // 做 diff 用的
    key: props?.key,
    // 虚拟节点要挂载的元素
    el: null,
    shapeFlag: 9
  }

  return vnode
}