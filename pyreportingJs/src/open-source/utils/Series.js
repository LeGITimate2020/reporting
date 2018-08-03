import * as _ from 'lodash';
import moment from 'moment';
import { compareNumbers } from './dataManipulationHelpers';
import {
  rollingApply as rollingApplyFunc,
  apply as applyFunc,
  scalarApply as scalarApplyFunc,
} from './rollingApply';
import { NotImplementedError } from './CustomErrors';

/**
 * Series represents a timeseries with a sorted date-based index and a set of values of any type (generally number).
 */
export default class Series {
  /**
   * @param {String} name
   * @param {Map} seriesMap Initialize the Series with data from an existing Map
   * @param {Boolean} initDimensions whether to iterate over the supplied seriesMap to create
   *                  the internal set of dimensions. When seriesMap is empty, this is a no-op.
   */
  constructor(name = 'Unnamed Series', seriesMap = new Map(), initDimensions = true) {
    this.name = name;
    /**
     * when a Series is multi-dimensional, the dimensions are a set that may differ amongst datums.
     * We store an internal set of dimensions that is automatically updated with every call to set().
     * I.e. we have a contract with any caller that this set is always accurate, and we use it internally
     * as well.
     * WARNING: as a tradeoff, we do not remove from the dimensions set if a datum is removed and it was the
     * only datum with a given dimension, as this would require checking ALL values against ALL dimensions
     * of the deleted datum on every delete: O(n*d), n = size of series, d = # of dimensions of deleted datum
     */
    this.dimensions = new Set();
    /**
     * Under the hood Series uses an ES6 Map() type. Map is used because it preserves insertion order. This is important
     * for timeseries to be consistently returned in the correct order). Unlike a JS Object, it also allows for
     * non-string keys. For example, if we want to use a Number (epoch ms time) or an actual Date. For now, this class
     * requires the index to be an integer representing epoch time.
     * @type {Map}
     */
    this.seriesMap = seriesMap;

    if (initDimensions) {
      this._initDimensions();
    }
  }

  _initDimensions = () => {
    for (const value of this.values()) {
      if (_.isPlainObject(value)) {
        Object.keys(value).map(dimension => this.dimensions.add(dimension));
      }
    }
  }

  /**
   * Import series from Object. Expects keys to be epoch ms. It will sort them chronologically upon import.
   * @param seriesObject {{number-parsable, Number}} {"1483401600000":2257.83, "1483488000000":2270.75}
   * @returns {Map}
   */
  initWithObject(seriesObject) {
    const sortedKeys = Object.keys(seriesObject).map(key => (
      typeof (key) === 'number' ? key : parseInt(key, 10)
    )).sort(compareNumbers);

    for (const key of sortedKeys) {
      if (!(key in seriesObject)) {
        throw new Error(`Error parsing series map keys. After parsing and sorting we could not find ${key} in the
        series object. Was a float converted to an int, or the reverse?`);
      }
      this.set(key, seriesObject[key]);
    }
  }

  // TODO: ensure series stays sorted by key?
  set = (key, value) => {
    if (_.isPlainObject(value)) {
      Object.keys(value).map(dimension => this.dimensions.add(dimension));
    }
    this.seriesMap.set(parseInt(key, 10), value);
  };

  delete = key => this.seriesMap.delete(key);

  /**
   * Iterators
   */
  entries = () => this.seriesMap.entries();

  keys = () => this.seriesMap.keys();

  values = () => this.seriesMap.values();

  flatEntries = (flattenToDimension) => {
    if (this.isScalar()) {
      return this.seriesMap.entries();
    }
    flattenToDimension = this._ensureFlattenDimension(flattenToDimension);
    return this.mapEntries((key, val) => [key, val[flattenToDimension]]);
  };

  flatValues = (flattenToDimension) => {
    if (this.isScalar()) {
      return this.seriesMap.values();
    }
    flattenToDimension = this._ensureFlattenDimension(flattenToDimension);
    return this.mapValues(value => value[flattenToDimension]);
  };


  flatten = (flattenToDimension) => {
    if (this.isScalar()) {
      return this;
    }
    flattenToDimension = this._ensureFlattenDimension(flattenToDimension);
    return Series.fromXYArrays(
      [...this.keys()],
      [...this.flatValues(flattenToDimension)],
      `${this.name} | ${flattenToDimension}`
    );
  };

  /**
   * a generalized Series object shouldn't have to know about the specific dimensions
   * (e.g. OHLC) of any kind of series. However, you should also be able to .flatten()
   * a series without knowing the dimensionality (e.g. when making scatters between series
   * that have varying dimensionality).
   *
   * The solution is to warn if a caller doesn't explicitly say which dimension to flatten
   * to, and then pick the first key of the first value.
   *
   * @param dimension {string}
   * @returns {string}
   */
  _ensureFlattenDimension(dimension) {
    const firstVal = this.values().next().value;
    if (!_.isPlainObject(firstVal)) {
      return dimension;
    }

    if (!this.dimensions.has(dimension)) {
      const arbitraryDimension = this.dimensions.values().next().value;
      if (dimension) {
        console.warn(
          `Flattened an N-D series into 1D using "${dimension}", but that's not in: ${Object.keys(firstVal)}.
          Defaulting to ${arbitraryDimension}. If the calling code does not know if a series is 1-D or N-D, this can be ok.`
        );
      } else {
        console.warn(
          `Flattened an N-D series into 1D without specifying which dimension. Defaulting to ${arbitraryDimension}. If the
          calling code does not know if a series is 1-D or N-D, this can be ok.`
        );
      }
      return arbitraryDimension;
    }
    return dimension;
  }

  size = () => this.seriesMap.size;

  /**
   * Used with Plotly
   * @returns {[[], []]} [[key1, key2, key3], [value1, value2, value3]]
   */
  toXYArrays = () => [[...this.keys()], [...this.values()]];

  // TODO: make this an Iterator?
  keysAsDates = () => [...this.seriesMap.keys()].map(key => new Date(key));

  /**
   * @param start {Date|number|string} -- anything moment()able
   * @param end {Date|number|string} -- anything moment()able
   * @returns {Series} copy of Series with only data between start and ends dates.
   *                   if start is null, includes all data before end
   *                   if end is null, includes all data after start
   */
  getDataBetween = (start = null, end = null) => {
    // TODO: make this an Iterator?
    const startMoment = moment(start);
    const endMoment = moment(end);
    const series = new Series(this.name);
    for (const [key, value] of this.entries()) {
      const afterStart = !start || key >= startMoment.valueOf();
      const beforeEnd = !end || key <= endMoment.valueOf();
      if (afterStart && beforeEnd) {
        series.set(key, value);
        // TODO: if we can assume that Series is always sorted by key, we can just break if key >= end
      }
    }
    return series.dropNaN(true, true).dropNull(true, true);
  };


  /**
   * @param desiredDate {number|Date} epoch ms timestamp
   * @param exactOnly {boolean} If false, this will return a value at the next available row after `timestamp`.
   * @return {[key, value]}
   */
  getDataAt = (desiredDate, exactOnly = false) => {
    const desiredDateMoment = desiredDate ? moment(desiredDate) : moment();
    const epochTimestampMS = desiredDateMoment.valueOf();

    const valueAtExactTimestamp = this.seriesMap.get(epochTimestampMS);
    if (valueAtExactTimestamp || exactOnly) {
      return [epochTimestampMS, valueAtExactTimestamp];
    }

    for (const [key, value] of this.entries()) {
      // TODO: consider checking T-1 timestamp to see which timestamp is closer.
      // TODO: consider some tolerance threshold
      if (key >= epochTimestampMS) {
        return [key, value];
      }
    }
    console.warn(`Could not find date in timeseries: ${desiredDateMoment.format('YYYY-MM-DD')}.`);
    return null;
  };


  /**
   * @param desiredDate {number|Date} epoch ms timestamp
   * @param exactOnly {boolean} If false, this will return a value at the next available row after `timestamp`.
   * @return {value}
  */
  getValueAt = (desiredDate, exactOnly = false) => (_.get(
    this.getDataAt(desiredDate, exactOnly),
    '[1]'
  ));

  /**
   * @param desiredDate {number|Date} epoch ms timestamp
   * @return {timestamp}
   */
  getClosestTimestampTo = desiredDate => (_.get(
    this.getDataAt(desiredDate, false),
    '[0]'
  ));

  copy = () => {
    const series = new Series(this.name);
    for (const [key, value] of this.entries()) {
      series.set(key, value);
    }
    return series;
  };

  /**
   * takes two time series and extracts overlapping pairs of points, e.g. for a scatterplot
   * @param otherSeries {Series}
   * @param exact {boolean} whether points must share the exact same timestamp, or just the closest
   */
  pairwisePointsWith = (otherSeries, exact = true) => {
    const pairs = [];
    for (const [index, series1Value] of this.seriesMap.entries()) {
      if (isNaN(series1Value)) {
        continue;
      }
      let series2Value = otherSeries.getValueAt(index, true);
      if (isNaN(series2Value) && !exact) {
        series2Value = otherSeries.getValueAt(index, false);
      }
      if (isNaN(series2Value)) {
        continue;
      }
      pairs.push([parseFloat(series1Value), parseFloat(series2Value)]);
    }
    return pairs;
  };

  /**
   * Convenience function to log Series data to console
   */
  show() {
    console.log(`id\t${this.name}`);
    for (const [key, value] of this.entries()) {
      console.log(key, value);
    }
  }

  /**
   *
   * @param func
   * @param windowSize {Number} - number of rows to pass into function
   * @param args
   * @return {Series}
   */
  rollingApply = (func, windowSize, ...args) => rollingApplyFunc(func, windowSize, this, ...args);

  apply = (func, ...args) => applyFunc(func, this, ...args);

  scalarApply = (func, scalar) => scalarApplyFunc(func, this, scalar);

  /**
   * Drop all NaN and undefined values. null remains.
   * if the series is multi-dimensional, drops all key/value pairs
   * in values that are NaN, e.g. { 3: undefined, 4: 5} => { 4: 5 }
   * @param inPlace {Boolean} whether to perform the dropping in place
   * @return {Series}
   */
  dropNaN = (inPlace = false) => {
    return this._dropPredicate(isNaN, inPlace);
  };

  /**
   * Drop all null and undefined values. NaN remains.
   * if the series is multi-dimensional, drops all key/value pairs
   * in values that are null, e.g. { 3: null, 4: '5'} => { 4: '5' }
   * @param inPlace {Boolean} whether to perform the dropping in place
   * @return {Series}
   */
  dropNull = (inPlace = true) => {
    const isNullOrUndefined = value => (value === undefined || value === null);
    return this._dropPredicate(isNullOrUndefined, inPlace);
  };

  dimensionality = () => (this.dimensions.size);

  /**
   * returns wether this series has scalar or multidmensional values
   * this is different from dimensionality of 1, since a single value
   * could technically be { 'one dimension': 3.2 }.
   */
  isScalar = () => {
    const firstVal = this.values().next().value;
    return !_.isPlainObject(firstVal);
  };

  /**
   * Drop all values for which shouldDropValueFunc returns true.
   * if the series is multi-dimensional, drops all key/value pairs
   * in values that are true, e.g. for 'is null?' { 3: null, 4: '5'} => { 4: '5' }
   * @param shouldDropValueFunc {Function} - function to determine if drop should take place
   * @param inPlace {Boolean} whether to perform the dropping in place
   * @return {Series}
   */
  _dropPredicate = (shouldDropValueFunc, inPlace = false) => {
    if (inPlace) {
      for (const [key, value] of this.entries()) {
        if (this.isScalar()) {
          if (shouldDropValueFunc(value)) {
            this.delete(key);
          }
        } else {
          for (const [dimension, dimensionValue] of Object.entries(value)) {
            if (shouldDropValueFunc(dimensionValue)) {
              delete value[dimension];
            }
          }
          const allDimensionsDropped = Object.keys(value).length === 0;
          if (allDimensionsDropped) {
            this.delete(key);
          }
        }
      }
      return this;
    }

    const series = new Series(this.name);
    for (const [key, value] of this.entries()) {
      if (this.isScalar()) {
        if (!shouldDropValueFunc(value)) {
          series.set(key, value);
        }
      } else {
        const filtered = {};
        for (const [dimension, dimensionValue] of Object.entries(value)) {
          if (!shouldDropValueFunc(dimensionValue)) {
            filtered[dimension] = dimensionValue;
          }
        }
        if (Object.keys(filtered).length > 0) {
          series.set(key, filtered);
        }
      }
    }
    return series;
  };

  /**
   * Generator function to function as a map iterator over the key/value pairs
   * @param fn - function that takes 2 parameters: key, value
   * @return {IterableIterator<*>}
   */
  * mapEntries(fn) {
    for (const [key, value] of this.entries()) {
      yield fn(key, value);
    }
  }

  /**
   * Generator function to function as a map iterator over the values
   * @param fn - function that takes 1 parameters: value
   * @return {IterableIterator<*>}
   */
  * mapValues(fn) {
    for (const value of this.values()) {
      yield fn(value);
    }
  }

  /**
   * get the first N values of the series
   * @param maxRows {Number}
   */
  head = (maxRows) => {
    if (maxRows >= this.size()) {
      return this;
    }
    const series = new Series(this.name);
    let rowIndex = 0;
    for (const [key, value] of this.entries()) {
      series.set(key, value);
      if (rowIndex >= maxRows) {
        break;
      }
      rowIndex++;
    }
    return series;
  };

  /**
   * get the last N values of the series
   * @param maxRows {Number}
   */
  tail = (maxRows) => {
    if (maxRows >= this.size()) {
      return this;
    }
    const series = new Series(this.name);
    const startOffset = this.size() - maxRows;
    let rowIndex = 0;
    for (const [key, value] of this.entries()) {
      if (rowIndex >= startOffset) {
        series.set(key, value);
      }
      rowIndex++;
    }
    return series;
  };


  lastKey = () => (Array.from(this.keys())[this.size() - 1]);

  firstKey = () => this.keys().next().value;

  /**
   * extends the seriesMap latest value to the current time.
   * @return this series, extended.
   */
  continueToToday = () => {
    if (this.size() === 0) {
      return this;
    }
    // relies on our series maps to be inserted in-order, i.e. the latest timestamp
    // is the last key in the map.
    const latestValue = this.getDataAt(this.lastKey())[1];
    const today = (new Date()).getTime();
    this.set(today, latestValue);
    return this;
  };

  /**
   * TODO: Ensure that all of the keys are whole days and not off by fractions of a day
   * @param series
   */
  static verifyAllKeysAreDays = (series) => {
    throw new NotImplementedError();
  };

  static fromXYArrays(keys, values, name) {
    const series = new Series(name);
    series.initWithObject(_.zipObject(keys, values));
    return series;
  }

  static fromSeriesObject(seriesObject, name) {
    const series = new Series(name);
    series.initWithObject(seriesObject);
    return series;
  }

  static fromSeriesMap(seriesMap, name, initDimensions = true) {
    return new Series(name, seriesMap, initDimensions);
  }

  /**
   *
   * @param arrayOfObjects
   *  [
   *    {date: 14000000110, myCol1: 1.1, myCol2: 2.1},
   *    {date: 14000000220, myCol1: 1.2, myCol2: 2.2},
   *  ]
   * @param name - 'MySeries'
   * @param keyColumn - 'date'
   * @param valueColumn - 'myCol1' or 'myCol2'
   * @return {Series}
   */
  static fromArrayOfObjects(arrayOfObjects, name, keyColumn, valueColumn) {
    const seriesObject = {};
    for (const [index, item] of arrayOfObjects.entries()) {
      const key = item[keyColumn];
      seriesObject[key] = item[valueColumn];
    }
    return Series.fromSeriesObject(seriesObject, name);
  }

  /**
   * @param seriesList - list of Series instances
   * @return {Array} a CSV-formatted array for downloadCSV in utils/commonUI.js
   */
  static seriesToCSVArray(seriesList = []) {
    // expand out OHLC into their own series for cleaner CSV array generation
    const seriesListFlattened = _.flatten(seriesList.map((series) => {
      if (series.isScalar()) {
        return series;
      }
      const ohlcSeries = [];
      series.dimensions.forEach((dimension) => {
        ohlcSeries.push(series.flatten(dimension));
      });
      return ohlcSeries;
    }));

    const header = ['timestamp'].concat(seriesListFlattened.map(series => series.name));
    const csvArray = [header];
    // merge all the timestamps to make sure we get all dates, even those
    // where some series have no data
    const allTimestamps = new Set();
    for (const series of seriesListFlattened) {
      for (const timestamp of series.keys()) {
        allTimestamps.add(timestamp);
      }
    }

    // TODO: sorted insertion set data structure so we can pull
    // all the seriesMap timestamps into a sorted list more quickly?
    const sortedTimestamps = [...allTimestamps].sort(compareNumbers);

    for (const timestamp of sortedTimestamps) {
      const csvRow = [moment.utc(timestamp).format()];
      for (const series of seriesListFlattened) {
        const valueAt = _.get(series.getDataAt(timestamp, true /* exact timestamp data only */), '[1]');
        csvRow.push(valueAt);
      }
      csvArray.push(csvRow);
    }

    return csvArray;
  }
}
