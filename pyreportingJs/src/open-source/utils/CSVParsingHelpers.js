/**
 * Detect if a column is completely numeric
 */
export const detectNumericColumns = (data) => {
  const rowIterator = data.values();
  const columnNames = rowIterator.next().value;
  const columnIsNumericMask = columnNames.map(() => true);
  for (const row of rowIterator) {
    for (const [colIndex, value] of row.entries()) {
      columnIsNumericMask[colIndex] = columnIsNumericMask[colIndex] && !isNaN(value);
    }
  }
  return columnIsNumericMask;
};

/**
 * Ensure specific columns are numbers
 * @param data {Array} - Array of Arrays e.g. [['10', 'abc', '30'], ['11', 'def', '31']]
 * @param columnIsNumericMask {Array} - [true, false, true] would indicate you want to parseFloat on columns 0 and 2
 */
export const parseColumns = (data, columnIsNumericMask) => {
  const rowIterator = data.values();

  // skip header row
  const columnNames = rowIterator.next().value;

  for (const row of rowIterator) {
    for (const [colIndex, value] of row.entries()) {
      row[colIndex] = columnIsNumericMask[colIndex] ? parseFloat(value) : value;
    }
  }
};

/**
 * Copy columns that are Numeric into new array of arrays
 * @return {Array}
 */
const _extractNumericColumns = (data, columnIsNumericMask) => {
  const rowIterator = data.values();
  const columnNames = rowIterator.next().value.filter((item, index) => columnIsNumericMask[index]);
  const recordArrays = [columnNames];
  for (const row of rowIterator) {
    const newRow = [];
    for (const [colIndex, value] of row.entries()) {
      if (columnIsNumericMask[colIndex]) {
        newRow.push(value);
      }
    }
    recordArrays.push(newRow);
  }
  return recordArrays;
};

export const parseAndExtractNumericColumns = (data) => {
  const columnIsNumericMask = detectNumericColumns(data);
  parseColumns(data, columnIsNumericMask);
  return _extractNumericColumns(data, columnIsNumericMask);
};
