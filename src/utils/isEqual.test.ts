import {isEqual} from './isEqual';

describe('isEqual', () => {
  it.each(['object', 'array'])(
    'does not traverse identical %s references',
    (type) => {
      const ownKeys = jest.fn(Reflect.ownKeys);
      const get = jest.fn(Reflect.get);
      const value = new Proxy(
        type === 'object' ? {theme: 'stripe'} : ['font'],
        {
          ownKeys,
          get,
        }
      );

      expect(isEqual(value, value)).toBe(true);
      expect(ownKeys).not.toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
    }
  );

  it('skips shared subtrees while still comparing distinct parent objects', () => {
    const ownKeys = jest.fn(Reflect.ownKeys);
    const get = jest.fn(Reflect.get);
    const appearance = new Proxy({theme: 'stripe'}, {ownKeys, get});

    expect(
      isEqual({appearance, loader: 'auto'}, {appearance, loader: 'auto'})
    ).toBe(true);
    expect(
      isEqual({appearance, loader: 'auto'}, {appearance, loader: 'never'})
    ).toBe(false);
    expect(ownKeys).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it('treats identical references as equal even when a property is NaN', () => {
    const value = {number: NaN};

    expect(isEqual(value, value)).toBe(true);
    expect(isEqual(value, {number: NaN})).toBe(false);
  });

  it('keeps primitive NaN unequal to itself', () => {
    expect(isEqual(NaN, NaN)).toBe(false);
  });

  it('treats positive and negative zero as equal', () => {
    expect(isEqual(0, -0)).toBe(true);
    expect(isEqual(-0, 0)).toBe(true);
  });

  [
    ['a', 'a'],
    [100, 100],
    [false, false],
    [undefined, undefined],
    [null, null],
    [{}, {}],
    [{a: 10}, {a: 10}],
    [{a: null}, {a: null}],
    [{a: undefined}, {a: undefined}],
    [[], []],
    [
      ['a', 'b', 'c'],
      ['a', 'b', 'c'],
    ],
    [
      ['a', {inner: [12]}, 'c'],
      ['a', {inner: [12]}, 'c'],
    ],
    [{a: {nested: {more: [1, 2, 3]}}}, {a: {nested: {more: [1, 2, 3]}}}],
  ].forEach(([left, right]) => {
    it(`should return true for isEqual(${JSON.stringify(
      left
    )}, ${JSON.stringify(right)})`, () => {
      expect(isEqual(left, right)).toBe(true);
      expect(isEqual(right, left)).toBe(true);
    });
  });

  [
    ['a', 'b'],
    ['0', 0],
    [new Date(1), {}],
    [false, ''],
    [false, true],
    [null, undefined],
    [{}, []],
    [/foo/, /foo/],
    [new Date(1), new Date(1)],
    [{a: 10}, {a: 11}],
    [{appearance: {theme: 'stripe'}}, {appearance: {theme: 'night'}}],
    [
      ['a', 'b', 'c'],
      ['a', 'b', 'c', 'd'],
    ],
    [
      ['a', 'b', 'c', 'd'],
      ['a', 'b', 'c'],
    ],
    [
      ['a', {inner: [12]}, 'c'],
      ['a', {inner: [null]}, 'c'],
    ],
    [{a: {nested: {more: [1, 2, 3]}}}, {b: {nested: {more: [1, 2, 3]}}}],
  ].forEach(([left, right]) => {
    it(`should return false for isEqual(${JSON.stringify(
      left
    )}, ${JSON.stringify(right)})`, () => {
      expect(isEqual(left, right)).toBe(false);
      expect(isEqual(right, left)).toBe(false);
    });
  });
});
