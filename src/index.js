/* @flow */

export type Key  = string|number;
export type Path = Key[];

// TODO: How to diff two cursors (or the same) to the same atom when the atom has changed? Maybe just store a ref to the last deref() use? The stored deref() use should be stored outside of the Cursor, otherwise we will probably have a memory leak.
// TODO: Test with preact
// TODO: Pluggable functions for different datatypes? (eg. support for ImmutableJS)

export interface Container<T> {
  cursor(): Cursor<T>;
  get<U: T & Object, K: $Keys<U>>(k: K): Cursor<*>;
  swap(v: T, ...extraArgs: mixed[]): T;
  deref(def?: T): mixed;
}

function resolve(obj: mixed, path: Path, def?: mixed): mixed {
  let o = obj;

  for(let i = 0; i < path.length; i++) {
    if(typeof o !== "object" && !Array.isArray(o) || o === null) {
      // TODO: We probably want to throw here instead when path cannot be resolved
      break;
    }

    o = o[(path[i]: any)];
  }

  return o !== undefined ? o : def;
}

export class Atom<T> {
  _value:     T;
  _observers: Observer<T, void, void>[];
  constructor(value: T, observers: Observer<T, void, void>[] = []) {
    (this: Observable<T, void, void>);
    (this: Container<T>);

    this._value     = value;
    this._observers = observers;
  }

  cursor(): Cursor<T> {
    return new Cursor(this, []);
  }

  get<U: T & Object, K: $Keys<U>, V>(key: K, def?: V): Cursor<V> {
    return this.cursor().get(key, def);
  }

  deref(): T {
    return this._value;
  }

  update(f: (t: T) => T): T {
    return this.swap(f(this.deref()));
  }

  // TODO: Maybe implement as compare-and-swap + apply function?
  swap(v: T, ...extraArgs: mixed[]): T {
    let old = this._value;

    this._value = v;

    for(let i = 0; i < this._observers.length; i++) {
      let f = this._observers[i].next;

      if(typeof f === "function") {
        f(v, old, ...extraArgs);
      }
    }

    return old;
  }

  /* Observable */

  subscribe(observerOrNext: ((t: T, o: T) => void) & Observer<T, void, void>): Subscription {
    let o: Observer<T, void, void> = typeof observerOrNext === "function" ? {
      next: observerOrNext
    } : observerOrNext;

    const self         = this;
    const subscription = {
      closed:      false,
      unsubscribe: function unsubscribe() {
        let i = self._observers.indexOf(o);

        if(i !== -1) {
          self._observers.splice(i, 1);

          subscription.closed = true;
        }
      }
    };

    if(o.start) {
      o.start(subscription);
    }

    this._observers.push(o);

    return subscription;
  }
}

export class Cursor<T> {
  _path: Path;
  _atom: Atom<*>;
  _def:  ?T;
  constructor(atom: Atom<*>, path: Path, def?: any) {
    (this: Container<T>);

    this._atom = atom;
    this._path = path;
    this._def  = def;
  }
  has(key: Key): boolean {
    let v = this.deref();

    if(typeof v === "object" && v !== null) {
      return key in v;
    }
    else if(Array.isArray(v)) {
      return v[(key: any)] !== undefined;
    }

    return false;
  }
  get<U: T & Object, K: $Keys<U>, V>(key: K, def?: V): Cursor<V> {
    let v = this.deref();

    if(typeof def !== "undefined") {
      return new Cursor(this._atom, this._path.concat([key]), def);
    }

    if(typeof v === "object" && v != null && key in v) {
      return new Cursor(this._atom, this._path.concat([key]), v[key]);
    }
    else if(Array.isArray(v) && v[(key: any)] !== undefined) {
      return new Cursor(this._atom, this._path.concat([key]), v[(key: any)]);
    }

    throw new Error("Cannot read property at path: [" + this._path.concat([key]).join(", ") + "]");
  }
  update(f: (t: T) => T): T {
    return this.swap(f(this.deref()));
  }
  swap(value: T, ...extraArgs: mixed[]): T {
    let data = value;
    let path = this._path.slice(0);
    let old  = this.deref();

    // TODO: For-loop
    while(path.length) {
      let segment = path.pop();
      let parent  = resolve(this._atom.deref(), path);

      // FIXME: Inherit prototype and so on too?
      data = Object.assign({}, parent, { [segment]: data });
    }

    // TODO: We will probably have to remove the T bound on Atom
    this._atom.swap((data: any), this._path, ...extraArgs);

    return old;
  }
  deref(): T {
    // FIXME: Proper return value, this._def can be undefined
    return (resolve(this._atom.deref(), this._path, this._def): any);
  }
  cursor(): Cursor<T> {
    return new Cursor(this._atom, this._path, this._def);
  }
}
