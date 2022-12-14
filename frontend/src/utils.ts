import { Atom } from 'jotai';

type Many<T> = T | ReadonlyArray<T>;

export function first<T>(list: T[]): T | undefined {
  return list.length > 0 ? list[0] : undefined;
}

export function last<T>(list: T[]): T | undefined {
  return list.length > 0 ? list[list.length - 1] : undefined;
}

/**
 * オブジェクト`obj`のプロパティのうち, `props`に書かれたものだけを残したものを返す.\
 * 元の`obj`は破壊しない.
 * @param obj
 * @param props
 * @returns
 */
export function pick<T extends object, U extends keyof T>(
  obj: T,
  ...props: Array<Many<U>>
): Pick<T, U> {
  const d: any = {};
  props.forEach((key) => {
    d[key] = (obj as any)[key];
  });
  return d;
}

export function omit<T extends object, U extends keyof T>(
  obj: T,
  ...props: Array<Many<U>>
): Omit<T, U> {
  const d: any = {};
  Object.keys(obj).forEach((key) => {
    d[key] = (obj as any)[key];
  });
  props.forEach((key) => {
    delete d[key];
  });
  return d;
}

export function omitBy<T extends object>(
  obj: T,
  predicate: (val: any, key: keyof T) => boolean
): Partial<T> {
  const d: any = {};
  Object.keys(obj).forEach((key) => {
    const v = (obj as any)[key];
    if (predicate(v, key as keyof T)) {
      d[key] = v;
    }
  });
  return d;
}

export function compact<T>(arr: T[]) {
  return arr.filter((a) => !!a) as Exclude<T, null | undefined>[];
}

export function datifyObject<T extends object, U extends keyof T>(
  obj: T,
  ...props: Array<Many<U>>
): T {
  props.forEach((key) => {
    if ((obj as any)[key]) {
      (obj as any)[key] = datify((obj as any)[key]);
    }
  });
  return obj;
}

export function datify(data: any) {
  if (isNull(data)) {
    return undefined;
  }
  if (typeof data === 'string') {
    return new Date(data);
  }
  if (data instanceof Date) {
    return data;
  }
  if (typeof data === 'number') {
    return new Date(data);
  }
  if (typeof data === 'object') {
    if (Object.keys(data).length === 1 && typeof data.value === 'string') {
      return new Date(data.value);
    }
    if (typeof data.seconds === 'string' && typeof data.nanos === 'number') {
      return new Date(parseFloat(data.seconds) * 1000 + data.nanos / 1000);
    }
    if (
      typeof data._seconds === 'number' &&
      typeof data._nanoseconds === 'number'
    ) {
      return new Date(data._seconds * 1000 + data._nanoseconds / 1000);
    }
  }
  return undefined;
}

/**
 * 配列`array`を, 「`array`の各要素に関数`value`を適用した値」を使って昇順にソートしたものを返す.\
 * 元の`array`は変更しない.
 * @param array
 * @param value
 * @returns
 */
export function sortBy<T, U>(
  array: T[],
  value: (a: T) => U,
  inDescending = false
) {
  const decorated = array.map((e) => ({ e, v: value(e) }));
  const lt = inDescending ? +1 : -1;
  const gt = -lt;
  decorated.sort((a, b) => {
    if (a.v < b.v) {
      return lt;
    } else if (a.v > b.v) {
      return gt;
    }
    return 0;
  });
  return decorated.map((d) => d.e);
}

/**
 * 配列`array`を, 「`array`の各要素に関数`value`を適用した値」に関してユニークになるよう要素を除去したものを返す.\
 * 除去されるのは後から登場したもの.\
 * 元の`array`は変更しない.
 * @param array
 * @param value
 * @returns
 */
export function uniqBy<T, U>(array: T[], value: (a: T) => U) {
  const mem: any = {};
  const uniqufied = array.filter((a) => {
    const v = value(a);
    if (mem[v]) {
      return false;
    }
    mem[v] = true;
    return true;
  });
  return uniqufied;
}

/**
 * オブジェクト `obj` のキーを列挙した配列を返す.\
 * `Object.keys`とは異なり, 配列の要素の型は obj のキーの型になる.
 * @param obj
 * @returns
 */
export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as unknown as Array<keyof typeof obj>;
}

/**
 * 配列`array`を, 「`array`の各要素に関数`value`を適用した値」をキーとしたマップに変換したものを返す.
 * @param array
 * @param value
 * @returns
 */
export function keyBy<T>(
  array: T[],
  value: (a: T) => string
): { [key: string]: T } {
  const r: any = {};
  array.forEach((a) => {
    r[value(a)] = a;
  });
  return r;
}

export function mapValues<T extends object, U>(
  dict: T,
  mapper: (val: T[keyof T], key: keyof T) => U
): { [key in keyof T]: U } {
  const r = {} as { [key in keyof T]: U };
  Object.keys(dict).forEach((key) => {
    const k = key as keyof T;
    r[k] = mapper(dict[k], k);
  });
  return r;
}

export function isfinite(val: any): val is number {
  return typeof val === 'number' && isFinite(val);
}

export function isNull<T>(value: T) {
  return value === null;
}

/**
 * Promiseに内包されている型を返す
 */
export type Promised<P> = P extends Promise<infer E> ? E : never;

/**
 * Atomに内包されている型を返す
 */
export type Atommed<P> = P extends Atom<infer E> ? E : never;
