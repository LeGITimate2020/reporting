import Series from './Series';

import { expectMapsToBeAlmostEqual } from './assertionHelpers';
import pandasDFObject from './fixtures/pandasDFObject';

describe('Series', () => {
  it('imports Object', () => {
    const timeseriesObject = { 1483401600000: 2257.83, 1483488000000: 2270.75, 1483574400000: 2269.0 }; // SPX values
    const expectedValue = new Map([[1483401600000, 2257.83], [1483488000000, 2270.75], [1483574400000, 2269.0]]);
    const output = Series.fromSeriesObject(timeseriesObject);
    expectMapsToBeAlmostEqual(output.seriesMap, expectedValue);
  });

  it('imports Object with keys out of order', () => {
    const timeseriesObject = { 3: 3.01, 2: 2.01, 1: 1.01 };
    const expectedValue = new Map([[1, 1.01], [2, 2.01], [3, 3.01]]);
    const output = Series.fromSeriesObject(timeseriesObject);
    expectMapsToBeAlmostEqual(output.seriesMap, expectedValue);
  });

  it('Exports to XY arrays', () => {
    const timeseriesObject = { 1: 1.01, 2: 2.01, 3: 3.01 };
    const expectedValue = [[1, 2, 3], [1.01, 2.01, 3.01]];
    const series = Series.fromSeriesObject(timeseriesObject);
    const output = series.toXYArrays();
    expect(output).toEqual(expectedValue);
  });

  it('can be filtered by date range (epoch)', () => {
    const seriesA = Series.fromSeriesObject(pandasDFObject['SPX Index']);
    const output = seriesA.getDataBetween(1490832000000, 1491177600000);
    const [outputXValues, outputYValues] = output.toXYArrays();
    const expectedXValues = [1490832000000, 1490918400000, 1491177600000];
    const expectedYValues = [2368.06, 2362.72, 2358.84];
    expect(outputXValues).toEqual(expectedXValues);
    expect(outputYValues).toEqual(expectedYValues);
  });

  it('can get last values with tail (3)', () => {
    const timeseriesObject = {
      1: 111, 2: 222, 3: 333, 4: 444, 9: 999,
    };
    const series = Series.fromSeriesObject(timeseriesObject);

    const output = series.tail(3);
    const [outputXValues, outputYValues] = output.toXYArrays();
    const expectedXValues = [3, 4, 9];
    const expectedYValues = [333, 444, 999];
    expect(outputXValues).toEqual(expectedXValues);
    expect(outputYValues).toEqual(expectedYValues);
  });

  it('can be filtered by date range (Date)', () => {
    const seriesA = Series.fromSeriesObject(pandasDFObject['SPX Index']);
    const output = seriesA.getDataBetween(new Date(1490832000000), new Date(1491177600000));
    const [outputXValues, outputYValues] = output.toXYArrays();
    const expectedXValues = [1490832000000, 1490918400000, 1491177600000];
    const expectedYValues = [2368.06, 2362.72, 2358.84];
    expect(outputXValues).toEqual(expectedXValues);
    expect(outputYValues).toEqual(expectedYValues);
  });

  it('dropNull works on 1D', () => {
    const beforeDrop = Series.fromSeriesObject({ 1: 1.01, 4: null, 5: undefined });
    const afterDrop = Series.fromSeriesObject({ 1: 1.01 });
    expectMapsToBeAlmostEqual(beforeDrop.dropNull().seriesMap, afterDrop.seriesMap);
  });

  it('dropNull works on multiple dimensions', () => {
    const beforeDrop = Series.fromSeriesObject({
      1: { 2: 3, 4: null }, // => { 2: 3 }
      2: { 5: 0 }, // unchanged
      3: { 5: null, 7: undefined }, // should remove the key
    });
    const afterDrop = Series.fromSeriesObject({
      1: { 2: 3 },
      2: { 5: 0 },
    });
    expect(beforeDrop.dropNull().seriesMap).toEqual(afterDrop.seriesMap);
  });

  it('dropNaN works on 1D', () => {
    const beforeDrop = Series.fromSeriesObject({
      1: 1.01, 2: 'asdf', 3: null, 4: undefined,
    });
    const afterDrop = Series.fromSeriesObject({ 1: 1.01, 3: null });
    expect(beforeDrop.dropNaN().seriesMap).toEqual(afterDrop.seriesMap);
  });

  it('dropNaN works on multiple dimensions', () => {
    const beforeDrop = Series.fromSeriesObject({
      1: { 2: 3, 4: null }, // => { 2: 3, 4: null }
      2: { 2: 3, 4: NaN, 5: 'asdflkj' }, // => { 2: 3 }
      3: { 5: 0 }, // unchanged
      4: { 5: 'foo', 7: undefined }, // should remove the key
    });
    const afterDrop = Series.fromSeriesObject({
      1: { 2: 3, 4: null }, // => { 2: 3, 4: null }
      2: { 2: 3 }, // => { 2: 3 }
      3: { 5: 0 }, // unchanged
    });
    expect(beforeDrop.dropNaN().seriesMap).toEqual(afterDrop.seriesMap);
  });

  it('_dropPredicate on multi dimensions', () => {
    const isOdd = int => (int % 2 !== 0);
    const beforeDrop = Series.fromSeriesObject({
      1: { 2: 3, 4: 5 }, // => should remove, no values are even
      2: { 2: 4, 4: 5 }, // => { 2: 4 }
      3: { 5: 2 }, // unchanged
    });
    const afterDrop = Series.fromSeriesObject({
      2: { 2: 4 },
      3: { 5: 2 },
    });
    expect(beforeDrop._dropPredicate(isOdd).seriesMap).toEqual(afterDrop.seriesMap);
  });

  it('_dropPredicate on 1 dimension', () => {
    const isEven = int => (int % 2 === 0);
    const beforeDrop = Series.fromSeriesObject({ 1: 2, 3: 4, 5: 7 });
    const afterDrop = Series.fromSeriesObject({ 5: 7 });
    expect(beforeDrop._dropPredicate(isEven).seriesMap).toEqual(afterDrop.seriesMap);
  });

  it('_seriesToCSVArray with single and multi dimensions', () => {
    const series = [
      Series.fromXYArrays([1, 2, 3], [4, 5, 6], '1d'),
      Series.fromXYArrays([2, 3, 4], [
        {
          open: 1, high: 2.3, low: null, close: 2,
        },
        {
          open: 1.1, high: 2.4, low: 1.3, close: 2.3,
        },
        {
          open: 1.2, high: 2.5, low: 1.2, close: 2.6,
        },
      ], 'ohlc'),
    ];
    const expected = [
      ['timestamp', '1d', 'ohlc | open', 'ohlc | high', 'ohlc | low', 'ohlc | close'],
      ['1970-01-01T00:00:00Z', 4, undefined, undefined, undefined, undefined],
      ['1970-01-01T00:00:00Z', 5, 1, 2.3, null, 2],
      ['1970-01-01T00:00:00Z', 6, 1.1, 2.4, 1.3, 2.3],
      ['1970-01-01T00:00:00Z', undefined, 1.2, 2.5, 1.2, 2.6],
    ];
    expect(Series.seriesToCSVArray(series)).toEqual(expected);
  });


  it('init dimensions with an empty series map is a no-op', () => {
    const series = new Series('foo', undefined, true);
    expect(series.dimensions).toEqual(new Set());
    series.set(1, { dimension1: 1, dimension2: 2 });
    expect(series.dimensions).toEqual(new Set(['dimension1', 'dimension2']));
  });

  it('init dimensions with a non-empty series map is a no-op', () => {
    const nonEmptyMap = new Map();
    nonEmptyMap.set(2, { low: null, close: 2 });
    nonEmptyMap.set(3, {
      open: 1.1, high: 2.4, low: 1.3, close: 2.3,
    });

    const seriesFromMapWithDimensions = new Series('init with map', nonEmptyMap, true);
    expect(seriesFromMapWithDimensions.dimensions).toEqual(new Set(['open', 'high', 'low', 'close']));
    const seriesFromMapWithoutDimensions = new Series('init with map', nonEmptyMap, false);
    expect(seriesFromMapWithoutDimensions.dimensions).toEqual(new Set());
  });

  it('fromXYArrays set dimensions', () => {
    const fromXYArrays = Series.fromXYArrays(
      [2, 3, 4],
      [
        {
          open: 1, high: 2.3, low: null, close: 2,
        },
        { open: 1.1, high: 2.4, close: 2.3 },
      ],
      'ohlc'
    );
    expect(fromXYArrays.dimensions).toEqual(new Set(['open', 'high', 'low', 'close']));
  });

  it('fromSeriesObject set dimensions', () => {
    const fromSeriesObject = Series.fromSeriesObject({
      1: { a: 2, b: 4 },
      2: { b: 6, c: 8 },
    });
    expect(fromSeriesObject.dimensions).toEqual(new Set(['a', 'b', 'c']));
  });

  it('fromSeriesMap set dimensions', () => {
    const fromSeriesMap = Series.fromSeriesMap(new Map([
      [1, { d1: 1.1 }],
      [2, { d2: 2.2 }],
    ]));
    expect(fromSeriesMap.dimensions).toEqual(new Set(['d1', 'd2']));
  });
});
