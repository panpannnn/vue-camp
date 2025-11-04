// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  // 依赖项链表头节点
  deps;
  // 依赖项链表尾节点
  depsTail;
  run() {
    const prevSub = activeSub;
    activeSub = this;
    this.depsTail = void 0;
    try {
      return this.fn();
    } finally {
      activeSub = prevSub;
    }
  }
  notify() {
    this.scheduler();
  }
  scheduler() {
    this.run();
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

// packages/reactivity/src/system.ts
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    console.log("\u76F8\u540C\u7684\u4F9D\u8D56\uFF0C\u76F4\u63A5\u590D\u7528");
    sub.depsTail = nextDep;
    return;
  }
  const newLink = {
    sub,
    dep,
    nextDep: void 0,
    nextSub: void 0,
    prevSub: void 0
  };
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
function propagate(subs) {
  let link2 = subs;
  let queuedEffect = [];
  while (link2) {
    queuedEffect.push(link2.sub);
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.notify());
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  _value;
  ["__v_isRef" /* IS_REF */] = true;
  subs;
  subsTail;
  constructor(value) {
    this._value = value;
  }
  get value() {
    if (activeSub) {
      trackRef(this);
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    triggerRef(this);
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
export {
  activeSub,
  effect,
  isRef,
  ref,
  trackRef,
  triggerRef
};
