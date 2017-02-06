/* @flow */

export type Key  = string|number;
export type Path = Key[];

// TODO: How to diff two cursors (or the same) to the same atom when the atom has changed? Maybe just store a ref to the last deref() use? The stored deref() use should be stored outside of the Cursor, otherwise we will probably have a memory leak.
// TODO: Test with preact
// TODO: Pluggable functions for different datatypes? (eg. support for ImmutableJS)

export interface Container<T> {
  cursor(): Cursor<T>;
  get<U: T & Object, K: $Keys<U>>(k: K): Cursor<*>;
  swap(v: T): T;
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
    return new Cursor(this);
  }

  get<U: T & Object, K: $Keys<U>>(k: K): Cursor<*> {
    return this.cursor().get(k);
  }

  deref(): T {
    return this._value;
  }

  update(f: (t: T) => T): T {
    return this.swap(f(this.deref()));
  }

  // TODO: Maybe implement as compare-and-swap + apply function?
  swap(v: T): T {
    let old = this._value;

    this._value = v;

    for(let i = 0; i < this._observers.length; i++) {
      let f = this._observers[i].next;

      if(typeof f === "function") {
        f(v);
      }
    }

    return old;
  }

  /* Observable */

  subscribe(observerOrNext: ((t: T) => void) & Observer<T, void, void>): Subscription {
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
  constructor(atom: Atom<*>, path: Path = []) {
    (this: Container<T>);

    this._atom = atom;
    this._path = path;
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
  get<U: T & Object, K: $Keys<U>>(key: K): Cursor<*> {
    let v = this.deref();

    if(typeof v === "object" && v !== null && key in v) {
      return new Cursor(this._atom, this._path.concat([key]));
    }
    else if(Array.isArray(v) && v[(key: any)] !== undefined) {
      return new Cursor(this._atom, this._path.concat([key]));
    }

    throw new Error("Cannot read property at path: [" + this._path.concat([key]).join(", ") + "]");
  }
  set<K: $Keys<T>>(key: K): Cursor<T> {
    // FIXME
    return this;
  }
  update(f: (t: T) => T): T {
    return this.swap(f(this.deref()));
  }
  swap(value: T): T {
    let data = value;
    let path = this._path.slice(0);
    let old  = this.deref();

    while(path.length) {
      let segment = path.pop();
      let parent  = resolve(this._atom.deref(), path);

      // FIXME: Inherit prototype and so on too?
      data = Object.assign({}, parent, { [segment]: data });
    }

    // TODO: We will probably have to remove the T bound on Atom
    this._atom.swap((data: any));

    return old;
  }
  deref(def?: T): T {
    return (resolve(this._atom.deref(), this._path, def): any);
  }
  cursor(): Cursor<T> {
    return new Cursor(this._atom, this._path);
  }
}
