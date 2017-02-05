/* @flow */

export type Key  = string|number;
export type Path = Key[];

function resolve(obj: mixed, path: Path, def?: mixed): mixed {
  let p = path.slice(0);
  let o = obj;

  while(p.length) {
    if(typeof o !== "object" || o === null || !Array.isArray(o)) {
      break;
    }

    o = o[p.pop()];
  }

  return o !== undefined ? o : def;
}

export class Atom<T> {
  _value:     T;
  _observers: Observer<T, void, void>[];
  constructor(value: T, observers: Observer<T, void, void>[] = []) {
    (this: Observable<T, void, void>);

    this._value     = value;
    this._observers = observers;
  }

  cursor(): Cursor<T> {
    return new Cursor(this);
  }

  deref(): T {
    return this._value;
  }

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
    }: observerOrNext;

    const self = this;
    const s    =  {
      closed:      false,
      unsubscribe: function unsubscribe() {
        let i = self._observers.indexOf(o);
        if(i !== -1) {
          self._observers.splice(i, 1);

          s.closed = true;
        }
      }
    };

    if(o.start) {
      o.start(s);
    }

    this._observers.push(o);

    return s;
  }
}

export class Cursor<T> {
  _path: Path;
  _atom: Atom<T>;
  constructor(atom: Atom<T>, path: Path = []) {
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
  get(key: Key): mixed {
    let v = this.deref();

    if(typeof v === "object" && v !== null && key in v) {
      return new Cursor(this._atom, this._path.concat([key]));
    }
    else if(Array.isArray(v) && v[(key: any)] !== undefined) {
      return new Cursor(this._atom, this._path.concat([key]));
    }

    throw new Error("Cannot read property of value at path: [" + this._path.join(", ") + "]");
  }
  set(key: $Keys<T>): Cursor<T> {
    // FIXME
    return this;
  }
  swap(value: mixed): mixed {
    let path = self._path.slice(0);
    let old  = this.deref();

    while(path.length) {
      let segment = path.pop();
      let parent  = resolve(this._atom.deref(), path);

      value   = Object.assign({}, parent, { [segment]: value });
    }

    self._atom.swap(value);

    return old;
  }
  deref(def?: mixed): mixed {
    return resolve(this._atom.deref(), this._path, def);
  }
  cursor(): Cursor<T> {
    return new Cursor(this._atom, this._path);
  }
}
