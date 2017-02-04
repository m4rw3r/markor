/* @flow */

export type Key  = mixed;
export type Path = Key[];

export interface Item<T> {
  has(key: Key): boolean;
  get(key: Key): T;
  set(key: Key): Item<T>;
  deref(): T;
}

export class Atom<T> {
  _value: T;
  construct(value: T) {
    this._value = value;
  }
  deref(): T {
    return this._value;
  }
  cursor(): Cursor<T> {
    return new Cursor(this);
  }
}

export class Cursor<T> {
  _path: Path;
  _atom: Atom<T>;
  construct(atom: Atom<T>, path: Path = []) {
    this._atom = atom;
    this._path = path;
  }
  deref() {
    return null;
  }
  cursor(): Cursor<T> {
    return new Cursor(this._atom, this._path);
  }
}
