import _ from 'lodash';
import PCA from 'ml-pca';
import { parseAndExtractNumericColumns } from './CSVParsingHelpers';

/**
 * Input values:
 * [
 *   ['col1', 'col2', 'col3'],
 *   [11, 12, 13],
 *   [21, 22, 23],
 * ]
 * Output values:
 * [
 *   {'col1': 11, 'col2': 12, 'col3': 13},
 *   {'col1': 21, 'col2': 22, 'col3': 23},
 * ]
 * @param data {Array} - Papaparse data object
 */
export const convertRecordArraysToRecordObjects = (data) => {
  const rowIterator = data.values();
  const columns = rowIterator.next().value;
  const recordObjects = [];
  for (const row of rowIterator) {
    const recordObject = _.zipObject(columns, row);
    recordObjects.push(recordObject);
  }
  return recordObjects;
};

/**
 * Input values:
 * [
 *   {'col1': 11, 'col2': 12, 'col3': 13},
 *   {'col1': 21, 'col2': 22, 'col3': 23},
 * ]
 * Output values:
 * [
 *   ['col1', 'col2', 'col3'],
 *   [11, 12, 13],
 *   [21, 22, 23],
 * ]
 * @param data {Array}
 */
export const convertRecordObjectsToRecordArrays = (data) => {
  const headers = Object.keys(data[0]);
  const recordArrays = data.map(Object.values);
  recordArrays.unshift(headers);
  return recordArrays;
};

/**
 * Concatenate 2 arrays of arrays
 * @param array1 {Array} - Sample input:
 * [
 *   [1, 2, 3],
 *   [4, 5, 6],
 * ]
 * @param array2 {Array} - Sample input:
 * [
 *   ['a', 'b', 'c'],
 *   ['d', 'e', 'f'],
 * ]
 * @return {Array} - Sample output:
 *  [
 *    [1, 2, 3, 'a', 'b', 'c'],
 *    [4, 5, 6, 'd', 'e', 'f'],
 *  ]
 */
export const concatArraysOfArrays = (array1, array2) => {
  return _.zipWith(array1, array2, (x, y) => x.concat(y));
};

/**
 *
 * @param data {Array} - Array of Arrays. First row is header.
 * [
 *   ['header1', 'header2', 'header3'],
 *   [11, 21, 31],
 *   [12, 22, 32],
 * ]
 * @return {*[]} - Return Array of
 * 1) new array of arrays with PCA added to each row.
 * 2) pcaData
 */
export const runPCA = (data) => {
  // TODO: load into DataFrame and then export into appropriate data format
  let recordArrays = data;
  const originalColumns = recordArrays[0];

  const onlyNumericColumns = parseAndExtractNumericColumns(recordArrays);
  const onlyNumericDataNoHeaders = onlyNumericColumns.slice(1, onlyNumericColumns.length);

  // run PCA
  const pca = new PCA(onlyNumericDataNoHeaders);

  // project original values into PCA space
  const projectedValues = pca.predict(onlyNumericDataNoHeaders);

  // Auto-generate column names for the different principal components
  const principalComponentColumnNames = projectedValues[0].map((item, index) => `Principal Component ${index + 1}`);

  // insert column names as the first row
  projectedValues.unshift(principalComponentColumnNames);

  // add the projected values into the array
  recordArrays = concatArraysOfArrays(recordArrays, projectedValues);


  const pcaData = {
    columns: originalColumns,
    eigenvalues: pca.getEigenvalues(),
    eigenvectors: pca.getEigenvectors(),
    explainedVariance: pca.getExplainedVariance(),
    projectedValues,
  };
  return [recordArrays, pcaData];
};

/**
 * Array.sort() only works with String types by default. O_o This makes it work with numbers.
 */
export const compareNumbers = (a, b) => a - b;

/**
 * ES6 Maps cannot be serialized to JSON. This will serialize it into a hierarchy of arrays.
 * @param m
 * @return {Array}
 */
export const mapToArrays = (m) => {
  return ((m && m.constructor === Map) ? [...m].map(([v, k]) => [mapToArrays(v), mapToArrays(k)]) : m);
};

/**
 * Compare two object maps, and detect if they are different.
 * @param relevantKeys {Array}
 * @param object1 {object}
 * @param object2 {object}
 * @returns {boolean}
 */
export const areRelevantKeyValuesDifferent = (relevantKeys, object1, object2) => {
  const relevantObject1Props = _.pickBy(object1, (value, key) => relevantKeys.includes(key));
  const relevantObject2Props = _.pickBy(object2, (value, key) => relevantKeys.includes(key));

  const areDifferent = !(_.isEqual(relevantObject2Props, relevantObject1Props));
  return areDifferent;
};

/**
 * Create an object based on CSV string input
 *
 * @param inputValue {string} 'key1=value1,key2=value2'
 * @return {Object} { key1: 'value1', key2: 'value2' }
 */
export const convertCSVEqualsStringToObject = (inputValue) => {
  if (typeof inputValue !== 'string') {
    return undefined;
  }

  const valuesObject = {};

  const splitValues = inputValue.split(',');
  for (const keyValuePair of splitValues) {
    if (!keyValuePair.includes('=')) {
      continue;
    }
    const [key, value] = keyValuePair.split('=');
    valuesObject[key] = value;
  }
  return valuesObject;
};
