import moment from 'moment';
import Series from './Series';
import { mapToArrays, compareNumbers } from './dataManipulationHelpers';
import { NotImplementedError } from './CustomErrors';

export default class DataFrame {
  constructor() {
    /**
     * Array of unique column names
     * @type {Array}
     */
    this.columns = [];
    this.dataFrameMap = new Map();
  }

  initWithSeriesArray = (seriesArray) => {
    for (const series of seriesArray) {
      this.addSeries(series);
    }
  };

  /**
   * This mutates the existing DataFrame
   * @param series {Series}
   * @param replaceExistingSeries {Boolean} - if true, delete any existing column before adding new series
   * @param upsertSeries {Boolean} - if true, new series will overwrite existing column in matching rows
   */
  addSeries = (series, { replaceExistingSeries = false, upsertSeries = false } = {}) => {
    if (replaceExistingSeries) {
      this.deleteColumn(series.name);
    }

    let columnName = series.name;
    if (!upsertSeries) {
      // If this data frame already includes a column with this same name, generate a unique name for the new column
      columnName = this.columns.includes(columnName) ? `${columnName}-${this.columns.length}` : columnName;
    }

    if (!this.columns.includes(columnName)) {
      this.columns.push(columnName);
    }

    const originalKeyCount = this.dataFrameMap.size;

    for (const [key, value] of series.entries()) {
      const row = this.dataFrameMap.get(key) || new Map();
      row.set(columnName, value);
      this.dataFrameMap.set(key, row);
    }

    // TODO: could have better logic where .set() tracks if a sort is necessary
    if (this.dataFrameMap.size > originalKeyCount) {
      // New keys were appended, need to sort the Map
      this.dataFrameMap = this._sort();
    }
  };

  /**
   * Adds or updates existing row
   * @param date {number|Date|moment}
   * @param row {Map}
   * @return {Map} - Pointer to final row (it's mutable, so be careful)
   */
  upsertRow = (date, row) => {
    // check if there is an existing row for this date. If not, create new row.
    const key = date.valueOf();
    const existingRow = this.get(key) || new Map();

    for (const [columnName, value] of row.entries()) {
      existingRow.set(columnName, value);
    }
    return this.set(key, existingRow);
  };

  /**
   * Ensure that a column name exists in our store
   * @param columnName {String}
   * @return {boolean} - return true if added to list, return false if already present in list
   * @private
   */
  _ensureColumnExists = (columnName) => {
    if (!this.columns.includes(columnName)) {
      this.columns.push(columnName);
      return true;
    }
    return false;
  };

  set = (key, row) => {
    const originalKeyCount = this.dataFrameMap.size;
    for (const [columnName, value] of row.entries()) {
      this._ensureColumnExists(columnName);
    }

    this.dataFrameMap.set(key.valueOf(), row);

    // TODO: could have better logic where .set() tracks if a sort is necessary
    if (this.dataFrameMap.size > originalKeyCount) {
      this._sort();
    }
    return row;
  };

  setValue = (key, columnName, value) => {
    return this.upsertRow(key, new Map([[columnName, value]]));
  };

  /**
   * Currently only sorts by the index (key)
   * @returns {Map}
   */
  _sort = () => {
    const newMap = new Map();
    for (const key of Array.from(this.dataFrameMap.keys()).sort(compareNumbers)) {
      const row = this.dataFrameMap.get(key);
      newMap.set(key, row);
    }
    this.dataFrameMap = newMap;
    return newMap;
  };

  entries = () => this.dataFrameMap.entries();

  keys = () => this.dataFrameMap.entries();

  rowFormatter = (row) => {
    const list = [];
    for (const column of this.columns) {
      list.push(row.get(column));
    }
    return list.join('\t');
  };

  /**
   *
   * @param columnName {String} column name
   * @returns {Series}
   */
  getSeries = (columnName) => {
    if (!this.columns.includes(columnName)) throw new Error(`'${columnName}' does not exist in DataFrame.`);
    const series = new Series(columnName);
    for (const [key, value] of this.entries()) {
      // TODO: add logic to optionally drop or fill `undefined`
      series.set(key, value.get(columnName));
    }
    return series;
  };

  /**
   *
   * @param columnName {String} column name
   * @returns {boolean} whether the column was found in the dataframe.
   */
  deleteColumn = (columnName) => {
    const column_index = this.columns.indexOf(columnName);
    if (column_index === -1) {
      return false;
    }
    this.columns.splice(column_index, 1);
    for (const [key, value] of this.entries()) {
      value.delete(columnName);
    }

    return true;
  };

  /**
   *
   * @param maxRows
   * @param keyFormat - if null, will display raw key (e.g. epoch ms). If 'YYYY-MM-DD', will parse key with moment and
   * then pass in keyFormat moment().format().
   */
  show({ maxRows = Infinity, keyFormat = null } = {}) {
    const header = this.columns.join('\t');
    console.log(`DataFrame: ${this.name}`);
    console.log(`id\t${header}`);
    let count = 0;
    for (const [key, row] of this.entries()) {
      if (count > maxRows) {
        break;
      }
      const keyFormatted = keyFormat ? moment.utc(key).format(keyFormat) : key;
      const rowFormatted = `${keyFormatted}\t${this.rowFormatter(row)}`;
      console.log(rowFormatted);
      count += 1;
    }
  }

  /**
   * Return number of columns matching pattern.
   * @param pattern - if pattern is Falsey, it will return count of all columns
   * @return {Number}
   */
  numColumns = ({ pattern } = {}) => {
    if (!pattern) {
      return this.columns.length;
    }
    const matchCount = this.columns.reduce((count, column) => {
      if (column.indexOf(pattern) !== -1) {
        return count + 1;
      }
      return count;
    }, 0);
    return matchCount;
  };

  /**
   * Return Array of columns that contain the text supplied in pattern
   * @param pattern {String}
   * @return {[String]}
   */
  findColumns = (pattern) => {
    const matchingColumns = this.columns.reduce((columns, column) => {
      if (column.indexOf(pattern) !== -1) {
        columns.push(column);
      }
      return columns;
    }, []);
    return matchingColumns;
  };

  /**
   * Replaces null, undefined, and NaN with the value from the previous entry
   * @return {DataFrame}
   */
  fillNA = () => {
    // TODO: implement an immutable version that doesn't forward fill in place
    let previousEntry = new Map();
    for (const [key, entry] of this.entries()) {
      for (const column of this.columns) {
        if ([null, undefined, NaN].includes(entry.get(column))) {
          entry.set(column, previousEntry.get(column));
          this.dataFrameMap.set(key, entry);
        }
      }
      previousEntry = entry;
    }
    return this;
  };

  /**
   * Drop entire row if count of NaN, undefined, and null values exceeds treshold.
   * @param threshold - maximum number of acceptable bad values
   * @return {DataFrame}
   */
  dropNA = ({ threshold = 0 } = {}) => {
    // TODO: implement an immutable version that doesn't forward fill in place
    const dataFrameMapWithoutNaNs = new Map();
    for (const [key, entry] of this.entries()) {
      let keepRow = true;
      let falseyColumnCount = 0;
      for (const column of this.columns) {
        if ([null, undefined, NaN].includes(entry.get(column))) {
          falseyColumnCount += 1;
        }
        if (falseyColumnCount > threshold) {
          keepRow = false;
          break;
        }
      }
      if (keepRow) {
        dataFrameMapWithoutNaNs.set(key, entry);
      }
    }
    this.dataFrameMap = dataFrameMapWithoutNaNs;
    return this;
  };

  numRows = () => {
    return this.dataFrameMap.size;
  };

  /**
   * Find the nearest keys to the provided epoch (1 smaller, 1 bigger).
   * @param epoch
   * @return {*}
   */
  getNearestKeys = (epoch) => {
    let lastKey = null;
    for (const key of this.dataFrameMap.keys()) {
      if (epoch > lastKey && epoch < key) {
        return [lastKey, key];
      }
      lastKey = key;
    }
    return null;
  };

  tail = (maxRows) => {
    this._sort();
    if (maxRows >= this.size()) {
      return this;
    }

    // doing this because there may be a subclass like HeatmapDataFrame
    const Klass = this.constructor;
    const df = new Klass();
    const startOffset = this.size() - maxRows;
    let rowIndex = 0;
    for (const [key, value] of this.entries()) {
      if (rowIndex >= startOffset) {
        df.set(key, value);
      }
      rowIndex++;
    }
    return df;
  };

  /**
   * Return an array of arrays in the format of
   * row 1: [header1, header2, ..., header N]
   * row n: [value1, value2, ..., value N]
   * @return {*[]}
   */
  toCSVDataArray = () => {
    const csvData = [['date', ...this.columns]];
    for (const [key, entry] of this.entries()) {
      const formattedDate = moment.utc(key).format('YYYY-MM-DD');
      const row = [formattedDate];
      for (const column of this.columns) {
        row.push(entry.get(column));
      }
      csvData.push(row);
    }
    return csvData;
  };

  /**
   * Return an array of arrays that are easily imported by Map(). The format looks like this:
   * [
   *   [keyA, [[header1A, value1A], [header2A, value2A]]]
   *   [keyB, [[header1B, value1B], [header2B, value2B]]]
   * ]
   * Sample:
   * [
   *   [1471478400000, [['btcReturns', -0.0006266864], ['ethReturns', -0.0046210721]]],
   *   [1471564800000, [['btcReturns', -0.0007315926], ['ethReturns', 0], ['2d_apply', 1]]],
   *   [1471651200000, [['btcReturns', 0.0142939321], ['ethReturns', 0.0492107707], ['2d_apply', 1], ['3d_apply', 0.9932]]],
   * ]
   */
  toMapDataArray = () => {
    return mapToArrays(this.dataFrameMap);
  };

  /**
   * TODO: Ensure that all of the keys are whole days and not off by fractions of a day
   * @param dataFrame
   */
  static verifyAllKeysAreDays = (dataFrame) => {
    throw new NotImplementedError();
  };


  /**
   *
   * @param seriesArray
   * @return {DataFrame}
   */
  static fromSeriesArray(seriesArray) {
    const dataFrame = new DataFrame();
    // const dataFrame = new this.constructor;
    dataFrame.initWithSeriesArray(seriesArray);
    return dataFrame;
  }

  get = key => this.dataFrameMap.get(key.valueOf());

  /**
   * @param start {Date|number|moment}
   * @param end {Date|number|moment}
   * @returns {DataFrame} copy of DataFrame with only data between start and ends dates.
   *                   if start is null, includes all data before end
   *                   if end is null, includes all data after start
   */
  getDataBetween = (start = null, end = null) => {
    // TODO: make this an Iterator?
    const df = new DataFrame();
    for (const [key, value] of this.entries()) {
      const afterStart = !start || key >= start;
      const beforeEnd = !end || key <= end;
      if (afterStart && beforeEnd) {
        df.set(key, value);
        // TODO: if we can assume that DataFrame is always sorted by key, we can just break if key >= end
      }
    }
    return df;
  };

  size = () => this.dataFrameMap.size;
}
