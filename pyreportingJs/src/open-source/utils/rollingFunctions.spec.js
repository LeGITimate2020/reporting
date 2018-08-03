import jStat from 'jstat';
import Series from './Series';
import {
  calculateRollingApplyMatrix, linearRegression,
  linearRegressionRSquared,
  linearRegressionSlope,
} from './rollingFunctions';

import sampleCryptoData from './fixtures/ETH-BTC-close-rolling-corr-matrix-gdax.json';
import { HeatmapDataFrame } from './heatmapHelpers';

describe('statsHelpers.rollingFunctions Matrix', () => {
  const sampleDataSlice = sampleCryptoData.slice(1, 5);
  const series1a = Series.fromArrayOfObjects(sampleDataSlice, 'btcReturns', 'date', 'btc_return');
  const series2a = Series.fromArrayOfObjects(sampleDataSlice, 'ethReturns', 'date', 'eth_return');

  const seriesSimple10PctReturn = Series.fromXYArrays([1, 2, 3, 4, 5], [0.10, 0.10, 0.10, 0.10, 0.10], '10% Return');
  const seriesSimple3PctReturn = Series.fromXYArrays([1, 2, 3, 4, 5], [0.03, 0.03, 0.03, 0.03, 0.03], '3% Return');

  it('calculates linear regression - r^2', () => {
    // TODO: don't use golden values, generate results
    const expected = [
      [1471478400000, [['btcReturns', -0.0006266864], ['ethReturns', -0.0046210721], ['2d_apply', undefined], ['3d_apply', undefined], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471564800000, [['btcReturns', -0.0007315926], ['ethReturns', 0], ['2d_apply', 1], ['3d_apply', undefined], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471651200000, [['btcReturns', 0.0142939321], ['ethReturns', 0.0492107707], ['2d_apply', 1], ['3d_apply', 0.9932], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471737600000, [['btcReturns', -0.0009967862], ['ethReturns', -0.0079646018], ['2d_apply', 1], ['3d_apply', 0.987], ['4d_apply', 0.9878], ['5d_apply', undefined]]],
    ];
    const df = calculateRollingApplyMatrix({
      func: linearRegressionRSquared,
      minPeriods: 2,
      maxPeriods: 5,
      seriesArray: [series1a, series2a],
    });
    const actual = df.toMapDataArray();
    expect(actual).toEqual(expected);
  });

  it('calculates linear regression - Slope', () => {
    const expected = [
      [1471478400000, [['btcReturns', -0.0006266864], ['ethReturns', -0.0046210721], ['2d_apply', undefined], ['3d_apply', undefined], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471564800000, [['btcReturns', -0.0007315926], ['ethReturns', 0], ['2d_apply', -44.0496], ['3d_apply', undefined], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471651200000, [['btcReturns', 0.0142939321], ['ethReturns', 0.0492107707], ['2d_apply', 3.2751], ['3d_apply', 3.4392], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471737600000, [['btcReturns', -0.0009967862], ['ethReturns', -0.0079646018], ['2d_apply', 3.7392], ['3d_apply', 3.5153], ['4d_apply', 3.5458], ['5d_apply', undefined]]],
    ];
    const df = calculateRollingApplyMatrix({
      func: linearRegressionSlope,
      minPeriods: 2,
      maxPeriods: 5,
      seriesArray: [series1a, series2a],
    });

    const actual = df.toMapDataArray();
    expect(actual).toEqual(expected);
  });

  it('calculates correlation', () => {
    const expected = [
      [1471478400000, [['btcReturns', -0.0006266864], ['ethReturns', -0.0046210721], ['2d_apply', undefined], ['3d_apply', undefined], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471564800000, [['btcReturns', -0.0007315926], ['ethReturns', 0], ['2d_apply', -1], ['3d_apply', undefined], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471651200000, [['btcReturns', 0.0142939321], ['ethReturns', 0.0492107707], ['2d_apply', 1], ['3d_apply', 0.996508568305369], ['4d_apply', undefined], ['5d_apply', undefined]]],
      [1471737600000, [['btcReturns', -0.0009967862], ['ethReturns', -0.0079646018], ['2d_apply', 1], ['3d_apply', 0.9935317167870789], ['4d_apply', 0.9939630281576997], ['5d_apply', undefined]]],
    ];
    const df = calculateRollingApplyMatrix({
      func: jStat.corrcoeff,
      minPeriods: 2,
      maxPeriods: 5,
      seriesArray: [series1a, series2a],
    });
    const actual = df.toMapDataArray();
    expect(actual).toEqual(expected);
  });

  it('loads HeatmapDataFrame from array of arrays', () => {
    const input = [
      [1471478400000, [['btcReturns', -0.0006266864], ['ethReturns', -0.0046210721]]],
      [1471564800000, [['btcReturns', -0.0007315926], ['ethReturns', 0], ['2d_apply', -1]]],
      [1471651200000, [['btcReturns', 0.0142939321], ['ethReturns', 0.0492107707], ['2d_apply', 1], ['3d_apply', 0.996508568305369]]],
      [1471737600000, [['btcReturns', -0.0009967862], ['ethReturns', -0.0079646018], ['2d_apply', 1], ['3d_apply', 0.9935317167870789], ['4d_apply', 0.9939630281576997]]],
    ];

    const df = HeatmapDataFrame.fromArrayOfArrays(input);
    const output = df.toMapDataArray();
    expect(output).toEqual(input);
  });

  it('gets window lengths and values for date', () => {
    const df = calculateRollingApplyMatrix({
      func: jStat.corrcoeff,
      minPeriods: 2,
      maxPeriods: 5,
      seriesArray: [series1a, series2a],
    });
    const constantWindowLengthValues = df.getValuesForWindowLength(2);
    const expectedValues = [{
      epoch: 1471478400000,
      date: '2016-08-18',
      value: undefined,
      window_length: 2,
    },
    {
      epoch: 1471564800000,
      date: '2016-08-19',
      value: -1,
      window_length: 2,
    },
    {
      epoch: 1471651200000,
      date: '2016-08-20',
      value: 1,
      window_length: 2,
    },
    {
      epoch: 1471737600000,
      date: '2016-08-21',
      value: 1,
      window_length: 2,
    }];
    expect(constantWindowLengthValues).toEqual(expectedValues);

    const valuesForConstantDate = df.getValuesForDate(1471737600000);
    const expectedValuesForConstantDate = [
      {
        epoch: 1471737600000,
        date: '2016-08-21',
        value: 1,
        window_length: 2,
      },
      {
        epoch: 1471737600000,
        date: '2016-08-21',
        value: 0.9935317167870789,
        window_length: 3,
      },
      {
        epoch: 1471737600000,
        date: '2016-08-21',
        value: 0.9939630281576997,
        window_length: 4,
      },
      {
        epoch: 1471737600000,
        date: '2016-08-21',
        value: undefined,
        window_length: 5,
      },
    ];
    expect(valuesForConstantDate).toEqual(expectedValuesForConstantDate);
  });

  it('Stores objects with multiple values', () => {
    const df = calculateRollingApplyMatrix({
      func: linearRegression,
      minPeriods: 2,
      maxPeriods: 5,
      seriesArray: [series1a, series2a],
    });
    const constantWindowLengthValues = df.getValuesForWindowLength(2);

    const valuesForConstantDate = df.getValuesForDate(1471737600000);
    const expectedValuesForConstantDate = [
      {
        epoch: 1471737600000,
        date: '2016-08-21',
        value: 1,
        window_length: 2,
      },
      {
        epoch: 1471737600000,
        date: '2016-08-21',
        value: 0.9935317167870789,
        window_length: 3,
      },
      {
        epoch: 1471737600000,
        date: '2016-08-21',
        value: 0.9939630281576997,
        window_length: 4,
      },
    ];
    // expect(valuesForConstantDate).toEqual(expectedValuesForConstantDate);
  });
});
