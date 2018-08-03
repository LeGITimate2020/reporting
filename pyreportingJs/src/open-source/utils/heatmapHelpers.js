import _ from 'lodash';
import moment from 'moment';
import jStat from 'jstat';
import { calculateRollingApplyMatrix, linearRegressionSlope } from './rollingFunctions';
import Series from './Series';
import DataFrame from './DataFrame';

export const fibonacciRange = (count) => {
  const values = [];
  let currentValue = 1;
  let lastValue = 0;
  while (values.length < count) {
    const newValue = lastValue + currentValue;
    lastValue = currentValue;
    currentValue = newValue;
    values.push(currentValue);
  }
  return values;
};

/**
 *
 * @param df {DataFrame} - Dataframe keyed on date with columns with values
 * @param pattern - filter only on columns that end in this pattern
 * @return {{data: Array, rows: number, cols: number}}
 */
export const convertDataFrameToHeatmapDataArray = (df, pattern = 'd_apply') => {
  if (!df) {
    return {
      data: [],
      rows: 0,
      cols: 0,
      valueGetters: [],
    };
  }
  const data = [];
  const matchingColumns = df.findColumns(pattern);
  const heatmapRows = matchingColumns.length;
  const valueGetters = [];

  // in the DataFrame, the number of rows represents the number of unique dates
  const heatmapColumns = df.numRows();

  // dateIndex is effectively the x coordinate
  let dateIndex = 0;

  // iterate through each date. Key = date, entry = all of the columns/values
  for (const [key, entry] of df.entries()) {
    const date = moment.utc(key).toDate();

    // columnIndex is effectively the y coordinate
    for (const [columnIndex, columnName] of Object.entries(matchingColumns)) {
      // index is the position in the 1-dimensional array for D3
      const columnIndexNum = parseInt(columnIndex, 10);
      const index = (dateIndex * heatmapRows) + columnIndexNum;

      // assumes that the column name starts with an integer (e.g. '10d_apply' -> 10)
      const windowLength = df.getWindowLengthFromColumnName(columnName);
      // const windowLength = parseInt(columnName, 10);
      const value = entry.get(columnName);
      if (valueGetters.length === 0 && !!value) {
        if (_.isObject(value)) {
          if (!_.isEmpty(value)) {
            valueGetters.push(...Object.keys(value));
          } else {
            console.info('empty object');
          }
        }
      }
      data[index] = {
        value,
        date,
        window_length: windowLength,
        x: dateIndex,
        y: columnIndexNum,
      };
    }

    dateIndex += 1;
    if (dateIndex > heatmapColumns) {
      console.error(`dateIndex (${dateIndex}) > heatmapColumns (${heatmapColumns}) - This should not happen!`);
    }
  }
  return {
    data,
    rows: heatmapRows,
    cols: heatmapColumns,
    valueGetters,
  };
};

export const createJSDataFrameFromPandasDF = (
  pandasDFData,
  series1Column = 'btc_return',
  series2Column = 'eth_return',
) => {
  const series1 = Series.fromArrayOfObjects(pandasDFData, 'btcReturns', 'date', series1Column);
  const series2 = Series.fromArrayOfObjects(pandasDFData, 'ethReturns', 'date', series2Column);

  const df1 = calculateRollingApplyMatrix({
    func: jStat.corrcoeff,
    seriesArray: [series1, series2],
    maxPeriods: 50,
  });

  const df2 = calculateRollingApplyMatrix({
    func: linearRegressionSlope,
    seriesArray: [series1, series2],
    step: 4,
    maxPeriods: 200,
  });


  const df3 = calculateRollingApplyMatrix({
    func: jStat.corrcoeff,
    seriesArray: [series1, series2],
    periods: fibonacciRange(15),
  });
  return [df1, df2, df3];
};

/**
 * Extends DataFrame with some extra metadata useful for Heatmaps
 */
export class HeatmapDataFrame extends DataFrame {
  constructor() {
    super();
    this.pattern = 'd_apply';
  }

  /**
   *
   * @param columnName {String}
   * @return {Number}
   */
  getWindowLengthFromColumnName = (columnName) => {
    if (columnName.indexOf(this.pattern) === -1) {
      return null;
    }
    return parseInt(columnName, 10);
  };

  // TODO: rename this to getColumnNameFromWindowLength
  getWindowLengthColumnName = (windowLength) => {
    return `${windowLength}${this.pattern}`;
  };

  /**
   *
   * @param windowLength {number}
   */
  getValuesForWindowLength = (windowLength) => {
    // TODO: consider turning this into an iterator

    const columnName = this.getWindowLengthColumnName(windowLength);
    const returnValue = [];
    for (const [key, entry] of this.entries()) {
      returnValue.push({
        epoch: key,
        date: moment.utc(key).format('YYYY-MM-DD'),
        value: entry.get(columnName),
        window_length: windowLength,
      });
    }
    return returnValue;
  };

  /**
   * Hold date constant and get the values for all of the rolling window lengths
   * @param date
   */
  getValuesForDate = (date) => {
    const epoch = this._convertToDateKey(date);
    const dateFormatted = moment.utc(epoch).format('YYYY-MM-DD');
    const valuesMap = this.dataFrameMap.get(epoch);
    if (!valuesMap) {
      console.log('date', date);
      console.log('epoch', epoch);
      console.log('dateFormatted', dateFormatted);
      const [low, high] = this.getNearestKeys(epoch);
      console.log('Nearest keys:', low, high);
    }
    const returnValues = [];
    for (const [key, value] of valuesMap) {
      const windowLength = this.getWindowLengthFromColumnName(key);
      if (!windowLength) {
        continue;
      }
      returnValues.push({
        epoch,
        date: dateFormatted,
        value,
        window_length: windowLength,
      });
    }
    return returnValues;
  };

  _convertToDateKey = (date, { dateFormat = 'YYYY-MM-DD' } = {}) => {
    if (typeof date === 'string') {
      return moment.utc(date, dateFormat).valueOf();
    }
    return date.valueOf();
  };

  /**
   *
   * @param seriesArray
   * @return {HeatmapDataFrame}
   */
  static fromSeriesArray(seriesArray) {
    const dataFrame = new HeatmapDataFrame();
    dataFrame.initWithSeriesArray(seriesArray);
    return dataFrame;
  }

  /**
   *
   * @param array
   * @return {HeatmapDataFrame}
   */
  static fromArrayOfArrays(array) {
    const dataFrame = new HeatmapDataFrame();
    const columns = new Set();

    // TODO: consider refactoring out to DataFrame.addRow()?
    for (const [index, [key, entry]] of array.entries()) {
      for (const [index, [column, value]] of entry.entries()) {
        columns.add(column);
      }
      dataFrame.dataFrameMap.set(key, new Map(entry));
    }

    dataFrame.columns = Array.from(columns);
    return dataFrame;
  }
}

/**
 * @param data
 * @param valueGetter
 * @return {[Number, Number, Number]}
 */
export const calculateDomain = (data, valueGetter = 'value') => {
  const DOMAIN_PERCENTILE_MARGIN = 0.05;
  const DOMAIN_PERCENTILE_HIGH = 1.0 - DOMAIN_PERCENTILE_MARGIN;
  const DOMAIN_PERCENTILE_LOW = 0.0 + DOMAIN_PERCENTILE_MARGIN;
  const values = _.without(data.map(d => _.get(d, valueGetter)), undefined, null, NaN);

  const jObj = jStat(values);
  const min = jObj.min();
  const max = jObj.max();
  const mean = jObj.mean();
  const stDev = jObj.stdev();
  const high = jStat.normal.inv(DOMAIN_PERCENTILE_HIGH, mean, stDev);
  const low = jStat.normal.inv(DOMAIN_PERCENTILE_LOW, mean, stDev);
  const biggestInAbsoluteValue = Math.max(0 - low, high);

  return [-biggestInAbsoluteValue, 0, biggestInAbsoluteValue];
};

/**
 * given a color, returns the text color on top of it.
 * @param {String} backgroundRGB, e.g. "rgb(255, 200, 197)"
 * @return {String}: hex color, a string
 */
export const textColor = (backgroundRGB) => {
  const [dark, light] = ['#333', '#fff'];
  if (!backgroundRGB) {
    return dark;
  }

  const [r, g, b] = backgroundRGB
    .substring(4, backgroundRGB.length - 1)
    .replace(/ /g, '')
    .split(',');
  // http://stackoverflow.com/a/3943023/112731
  const isLightBackground = ((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186;
  return isLightBackground ? dark : light;
};

/**
 *
 * @param data -
 *  first row should be headers. Headers should be in the format ['date', '30d_apply', '60d_apply']
 *  First column on each row should be a moment-able date
 *  Rest of columns in each row should be arrays of Numbers
 *  ['2017-01-01', 1.1, 2.2]
 * @return {HeatmapDataFrame}
 */
export const heatmapCSVArrayToHeatmapDataFrame = (data) => {
  // TODO: handle errors

  const rowCount = data.length;

  const rowIterator = data.entries();

  // All headers from CSV except left-most column which should be a date
  const headers = rowIterator.next().value[1];
  const df = new HeatmapDataFrame();
  for (const [index, row] of rowIterator) {
    if ((index + 1) === rowCount && row[0] === '') {
      // last row is just an empty line, skip it
      continue;
    }

    const colIterator = row.entries();

    // left-most column must be a date
    const rawDateValue = colIterator.next().value[1];
    const date = moment.utc(rawDateValue);
    if (!date.isValid()) {
      console.error(`Moment could not parse "${rawDateValue}" into a Date object. Row index #${index}:`, row);
    }

    // iterate through rest of columns, parse float values and set them in HeatmapDataFrame
    for (const [colIndex, colValue] of colIterator) {
      const colHeader = headers[colIndex];
      const parsedColValue = parseFloat(colValue);
      df.setValue(date, colHeader, parsedColValue);
    }
  }
  return df;
};
