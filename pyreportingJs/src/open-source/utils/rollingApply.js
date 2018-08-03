import Series from './Series';
import DataFrame from './DataFrame';

export const multiply = (value1, value2) => value1 * value2;
export const divide = (value1, value2) => value1 / value2;
export const add = (value1, value2) => value1 + value2;
export const subtract = (value1, value2) => value1 - value2;

/**
 *
 * @param values {Array}
 * @returns {number}
 */
export const percentChange = (values) => {
  if (values.length !== 2) throw new TypeError(`Expected array with exactly 2 items. ${values.length}`);
  return (values[1] - values[0]) / values[0];
};

/**
 *
 * @param values {Array}
 * @returns {number}
 */
export const diff = (values) => {
  if (values.length !== 2) throw new TypeError(`Expected array with exactly 2 items. ${values.length}`);
  return (values[1] - values[0]);
};

/**
 * Examples:
 *
 * Function that accepts 1 Array...
 * rollingApplyDataArrays(jStat.mean, 2, [1, 2, 3, 4, 5]) --> [ 1.5, 2.5, 3.5, 4.5 ]
 *
 * Function that accepts 2 Arrays...
 * rollingApplyDataArrays(jStat.corrcoeff, 3, [1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) --> [1, 1, 1]
 *
 *
 * @param func {function} - any function that accepts 1 or more arrays of data. e.g. jStat.mean, jStat.corrcoeff
 * @param windowSize {Number} - Size of the moving window. This is the number of observations used for calculating the
 * statistic.
 * @param args {[Array]} - N args of arrays that correspond to the expected number of func functions arguments
 * @returns {Array}
 */
export const rollingApplyDataArrays = (func, windowSize, ...args) => {
  const seriesLengths = args.map(series => series.length);
  const minSeriesLength = Math.min(...seriesLengths);
  const maxSeriesLength = Math.max(...seriesLengths);

  if (minSeriesLength !== maxSeriesLength) {
    console.warn(`Series have different lengths. ${minSeriesLength} !== ${maxSeriesLength}. Using ${minSeriesLength}.`);
  }

  // this queue represents the rolling window of arguments to pass into the func
  const queue = [];
  const returnSeries = [];

  const seriesCount = args.length;

  // rowIndex to iterate through data points across all series.
  for (let rowIndex = 0; rowIndex < minSeriesLength; rowIndex += 1) {
    // Iterate through each of the different series
    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
      // Initialize a rolling window queue for each series
      if (!queue[seriesIndex]) queue[seriesIndex] = [];

      // Add item to the window
      queue[seriesIndex].push(args[seriesIndex][rowIndex]);

      // If too many items in the window, remove the oldest item
      if (queue[seriesIndex].length > windowSize) queue[seriesIndex].shift();
    }

    // If all windows have the correct amount of items, then send them to the func & add the value to the returnSeries.
    if (queue.every(item => item.length === windowSize)) {
      returnSeries.push(func(...queue));
    }
  }
  return returnSeries;
};

/**
 * Convenience function to convert common objects into a DataFrame. Currently all args need to be of the same type.
 *
 * Examples:
 * 1) getDataFrameFromArgs(series1, series2, series3)
 * 2) getDataFrameFromArgs(dataFrame)
 *
 * @param args
 * @return {DataFrame}
 */
const getDataFrameFromArgs = (...args) => {
  let dataFrame;
  if (args.every(item => item instanceof Series)) {
    // If we are passed in an array of Series, turn them into a DataFrame
    dataFrame = DataFrame.fromSeriesArray(args);
  } else if (args[0] instanceof DataFrame) {
    if (args.length > 1) {
      throw new Error('args can only accept 1 DataFrame currently.');
    }
    // TODO: this points to the original object, should we create a copy instead?
    dataFrame = args[0];
  } else if (args.every(item => item instanceof Map)) {
    const seriesArray = args.map((arg, index) => Series.fromSeriesMap(arg, `Series Map ${index}`, false));
    dataFrame = DataFrame.fromSeriesArray(seriesArray);
  } else {
    throw new TypeError('args are of unknown type. Expect one of: [Series, DataFrame, Map].');
  }
  return dataFrame;
};

/**
 * Examples:
 *
 * Function that accepts 1 Series...
 * rollingApply(jStat.mean, 2, new Series(... [1, 2, 3, 4, 5] ...)) --> [ 1.5, 2.5, 3.5, 4.5 ]
 *
 * Function that accepts 2 Series...
 * rollingApply(jStat.corrcoeff, 3, new Series(...), new Series(...)) --> [1, 1, 1]
 *
 * Function that accepts 1 DataFrame with multiple series...
 * rollingApply(jStat.corrcoeff, 3, new DataFrame(...)) --> [1, 1, 1]
 *
 *
 * @param func {function} - any function that accepts 1 or more arrays of data. e.g. jStat.mean, jStat.corrcoeff
 * @param windowSize {Number} - Size of the moving window (in rows). This is the number of observations used for
 * calculating the statistic.
 * @param args {Series} - N args of Series or DataFrame that correspond to the expected number of arguments for func
 * @returns {Series}
 */
export const rollingApply = (func, windowSize, ...args) => {
  const dataFrame = getDataFrameFromArgs(...args);
  // this queue represents the rolling window of arguments to pass into the func
  const queue = [];

  const returnSeries = new Series('calculated');

  // key = timestamp, row = Map of row accessible by seriesName/columnName
  for (const [key, row] of dataFrame.entries()) {
    for (const [columnIndex, columnName] of dataFrame.columns.entries()) {
      // Initialize a rolling window queue for each series
      if (!queue[columnIndex]) queue[columnIndex] = [];

      const value = row.get(columnName);

      // TODO: check here for NaN, undefined, etc and adjust logic accordingly
      // Add item to the window
      queue[columnIndex].push(value);

      // If too many items in the window, remove the oldest item
      if (queue[columnIndex].length > windowSize) queue[columnIndex].shift();
    }

    if (queue.every(item => item.length === windowSize)) {
      // If all windows have the correct amount of items, then send them to the func & add the value to the returnSeries.
      returnSeries.set(key, func(...queue));
    } else {
      // If not, return undefined
      returnSeries.set(key, undefined);
    }
  }
  return returnSeries;
};

/**
 * Applies function with arguments from series in left to right order
 * @param func {function}
 * @param args {Series}
 * @return {Series}
 */
export const apply = (func, ...args) => {
  const dataFrame = getDataFrameFromArgs(...args);
  const returnSeries = new Series('calculated');
  for (const [key, row] of dataFrame.entries()) {
    returnSeries.set(key, func(...row.values()));
  }
  return returnSeries;
};

/**
 *
 * @param func
 * @param series {Series}
 * @param scalar
 * @return {Series}
 */
export const scalarApply = (func, series, scalar) => {
  const returnSeries = new Series('calculated');
  for (const [key, value] of series.entries()) {
    returnSeries.set(key, func(value, scalar));
  }
  return returnSeries;
};
