import { isArray, isString, ShapeFlags } from "@vue/shared"

export function isVNode(value) {
    return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children?) {
    let shapeFlag = 0

    if (isString(type)) {
        shapeFlag = ShapeFlags.ELEMENT
    }
    if (isString(children)) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }

    const vnode = {
        __v_isVNode: true,
        type,
        props,
        children,
        key: props?.key,

        // 虚拟节点要挂载的元素
        el: null,
        shapeFlag
    }

    return vnode
}