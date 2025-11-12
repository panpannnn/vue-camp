// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
}
function isFunction(value) {
  return typeof value === "function";
}

// packages/reactivity/src/system.ts
var linkPool;
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep;
    return;
  }
  let newLink;
  if (linkPool) {
    newLink = linkPool;
    linkPool = linkPool.nextDep;
    newLink.nextDep = nextDep;
    newLink.dep = dep;
    newLink.sub = sub;
  } else {
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: void 0,
      prevSub: void 0
    };
  }
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subs = newLink;
    dep.subsTail = newLink;
  }
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink;
    sub.depsTail = newLink;
  } else {
    sub.deps = newLink;
    sub.depsTail = newLink;
  }
}
function processComputedUpdate(sub) {
  if (sub.subs && sub.update()) {
    propagate(sub.subs);
  }
}
function propagate(subs) {
  let link2 = subs;
  let queuedEffect = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true;
      if ("update" in sub) {
        processComputedUpdate(sub);
      } else {
        queuedEffect.push(link2.sub);
      }
    }
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.notify());
}
function startTrack(sub) {
  sub.tracking = true;
  sub.depsTail = void 0;
}
function endTrack(sub) {
  sub.tracking = false;
  sub.dirty = false;
  const depsTail = sub.depsTail;
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep);
      depsTail.nextDep = void 0;
    }
  } else if (sub.deps) {
    clearTracking(sub.deps);
    sub.deps = void 0;
  }
}
function clearTracking(link2) {
  while (link2) {
    const { prevSub, nextSub, dep, nextDep } = link2;
    if (prevSub) {
      prevSub.nextSub = nextSub;
      link2.nextSub = void 0;
    } else {
      dep.subs = nextSub;
    }
    if (nextSub) {
      nextSub.prevSub = prevSub;
      link2.prevSub = void 0;
    } else {
      dep.subsTail = prevSub;
    }
    link2.dep = link2.sub = void 0;
    link2.nextDep = linkPool;
    linkPool = link2;
    link2 = nextDep;
  }
}

// packages/reactivity/src/effect.ts
var activeSub;
function setActiveSub(sub) {
  activeSub = sub;
}
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  // 表示这个 effect 是否激活
  active = true;
  // 依赖项链表头节点
  deps;
  // 依赖项链表尾节点
  depsTail;
  tracking = false;
  dirty = false;
  run() {
    if (!this.active) {
      return this.fn();
    }
    const prevSub = activeSub;
    setActiveSub(this);
    startTrack(this);
    try {
      return this.fn();
    } finally {
      endTrack(this);
      setActiveSub(prevSub);
    }
  }
  notify() {
    this.scheduler();
  }
  scheduler() {
    this.run();
  }
  stop() {
    if (this.active) {
      startTrack(this);
      endTrack(this);
      this.active = false;
    }
  }
};
function effect(fn, option) {
  const e = new ReactiveEffect(fn);
  Object.assign(e, option);
  e.run();
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}

// packages/reactivity/src/dep.ts
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeSub) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = /* @__PURE__ */ new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  link(dep, activeSub);
}
function trigger(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const targetIsArray = Array.isArray(target);
  const newLength = targetIsArray ? target.length : 0;
  if (targetIsArray && key === "length") {
    depsMap.forEach((dep, depKey) => {
      if (depKey >= newLength || depKey === "length") {
        propagate(dep.subs);
      }
    });
  } else {
    let dep = depsMap.get(key);
    if (!dep) {
      return;
    }
    propagate(dep.subs);
  }
}
var Dep = class {
  subs;
  substail;
  constructor() {
  }
};

// packages/reactivity/src/baseHandle.ts
var mutableHandlers = {
  get(target, key, receiver) {
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isRef(res)) {
      return res.value;
    }
    if (isObject(res)) {
      return reactive(res);
    }
    return Reflect.get(target, key, receiver);
  },
  set(target, key, newValue, receiver) {
    const targetIsArray = Array.isArray(target);
    const oldLength = targetIsArray ? target.length : 0;
    const oldValue = target[key];
    const res = Reflect.set(target, key, newValue, receiver);
    const newLength = targetIsArray ? target.length : 0;
    if (targetIsArray && oldLength !== newLength && key !== "length") {
      trigger(target, "length");
    }
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue;
      return res;
    }
    if (hasChanged(newValue, oldValue)) {
      trigger(target, key);
    }
    return res;
  }
};

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
var reactiveSet = /* @__PURE__ */ new WeakSet();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (isReactive(target)) {
    return target;
  }
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  reactiveSet.add(proxy);
  return proxy;
}
function isReactive(target) {
  return reactiveSet.has(target);
}

// packages/reactivity/src/ref.ts
var ReaactiveFlags = /* @__PURE__ */ ((ReaactiveFlags2) => {
  ReaactiveFlags2["IS_REF"] = "__v_isRef";
  return ReaactiveFlags2;
})(ReaactiveFlags || {});
var RefImpl = class {
  _value;
  ["__v_isRef" /* IS_REF */] = true;
  subs;
  subsTail;
  constructor(value) {
    this._value = isObject(value) ? reactive(value) : value;
  }
  get value() {
    if (activeSub) {
      trackRef(this);
    }
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      triggerRef(this);
    }
  }
};
function ref(value) {
  return new RefImpl(value);
}
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}
function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub);
  }
}
function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs);
  }
}
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
  }
  ["__v_isRef" /* IS_REF */] = true;
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}
function toRefs(target) {
  let result = {};
  for (const key in target) {
    result[key] = new ObjectRefImpl(target, key);
  }
  return result;
}
function unref(value) {
  return isRef(value) ? value.value : value;
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(fn, setter) {
    this.fn = fn;
    this.setter = setter;
  }
  ["__v_isRef" /* IS_REF */] = true;
  // 保存fn的返回值
  _value;
  subs;
  subsTail;
  deps;
  depsTail;
  tracking;
  // 为true，需要执行get value 的update
  dirty = true;
  get value() {
    if (this.dirty) {
      this.update();
    }
    if (activeSub) {
      link(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    } else {
      console.warn("this computed is readOnly");
    }
  }
  // 作为sub与依赖的dep建立关联关系
  update() {
    const prevSub = activeSub;
    setActiveSub(this);
    startTrack(this);
    try {
      const oldValue = this._value;
      this._value = this.fn();
      return hasChanged(this._value, oldValue);
    } finally {
      endTrack(this);
      setActiveSub(prevSub);
    }
  }
};
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/watch.ts
function watch(source, cb, option) {
  let { deep, immediate, once } = option || {};
  if (once) {
    const _cb = cb;
    cb = (...args) => {
      _cb(...args);
      stop();
    };
  }
  let getter;
  if (isRef(source)) {
    getter = () => source.value;
  } else if (isReactive(source)) {
    getter = () => source;
    if (!deep) deep = true;
  } else if (isFunction(source)) {
    getter = source;
  }
  if (deep) {
    const baseGetter = getter;
    const depth = deep === true ? Infinity : deep;
    getter = () => traverse(baseGetter(), depth);
  }
  const effect2 = new ReactiveEffect(getter);
  effect2.scheduler = job;
  let oldValue;
  let cleanup = null;
  function onCleanup(cb2) {
    cleanup = cb2;
  }
  function job() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    const newValue = effect2.run();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue;
  }
  if (immediate) {
    job();
  } else {
    oldValue = effect2.run();
  }
  function stop() {
    effect2.stop();
  }
  return stop;
}
function traverse(value, depth = Infinity, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(value) || depth <= 0) return;
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  depth--;
  for (let key in value) {
    traverse(value[key], depth, seen);
  }
  return value;
}
export {
  ReaactiveFlags,
  ReactiveEffect,
  activeSub,
  computed,
  effect,
  isReactive,
  isRef,
  reactive,
  ref,
  setActiveSub,
  toRef,
  toRefs,
  trackRef,
  triggerRef,
  unref,
  watch
};
