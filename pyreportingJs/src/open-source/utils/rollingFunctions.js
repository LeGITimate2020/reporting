import { zip } from 'lodash';
import regression from 'regression';

import { rollingApply } from './rollingApply';
import { HeatmapDataFrame } from './heatmapHelpers';

/**
 * Generate an array of values (1, 5, 2) => [1, 3, 5]
 * @return {Array}
 */
const range = (start, stop, step) => {
  const values = [];
  for (let value = start; value <= stop; value += step) {
    values.push(value);
  }
  return values;
};

/**
 *
 * @param func - any function that accepts 1 or more input series. For detailed examples see definition of rollingApply
 * @param seriesArray {[Series]} - array of series to pass into func e.g. [Series1, Series2, Series3]
 * @param minPeriods {Number}
 * @param maxPeriods {Number}
 * @param step {Number}
 * @param periods {[Number]} - Custom number of periods on which to apply e.g. [1, 2, 3, 5, 8, 13, 21]
 * @param pattern {String} - Naming convention for calculated columns
 * @return {HeatmapDataFrame}
 */
export const calculateRollingApplyMatrix = ({
  func,
  seriesArray,
  minPeriods = 1,
  maxPeriods = 50,
  step = 1,
  periods = null,
  pattern = 'd_apply',
} = {}) => {
  const df = HeatmapDataFrame.fromSeriesArray(seriesArray);

  // TODO: move fillNA somewhere else?
  df.fillNA();

  const _periods = periods === null ? range(minPeriods, maxPeriods, step) : periods;

  for (const period of _periods) {
    const newSeries = rollingApply(func, period, ...seriesArray);
    newSeries.name = `${period}${pattern}`;
    df.addSeries(newSeries);
  }

  return df;
};

export const linearRegressionRaw = (xValues, yValues, { precision = 4 } = {}) => {
  const xyPairs = zip(xValues, yValues);
  return regression.linear(xyPairs, { precision });
};

export const linearRegression = (xValues, yValues, { precision = 4 } = {}) => {
  const xyPairs = zip(xValues, yValues);
  const results = regression.linear(xyPairs, { precision });
  return {
    beta: results.equation[0],
    'r^2': results.r2,
  };
};

/**
 * Convenience function to extract just the r^2 for use in rollingApply
 */
export const linearRegressionRSquared = (xValues, yValues, { precision = 4 } = {}) => {
  const result = linearRegressionRaw(xValues, yValues, { precision });
  return result.r2;
};

/**
 * Convenience function to extract just the slope for use in rollingApply
 */
export const linearRegressionSlope = (xValues, yValues, { precision = 4 } = {}) => {
  const result = linearRegressionRaw(xValues, yValues, { precision });
  return result.equation[0];
};
