import { round } from 'lodash';

/**
 * returns a download link for a nested array of CSV data
 * @param csvDataOrFunc {Array|Function} - nested arrays of CSV data, e.g. [['a', 'b'], [1,2], [3,4]]
 *        if type(csvDataOrFunc) is 'function', will call it and use the result as the data.
 *        helpful to only generate the data as-needed.
 * @param name {String} - the name of the file that will be downloaded on click.
 */
export const downloadCSV = (csvDataOrFunc, name) => {
  // TODO: consider rewriting using Blob to overcome 2MB limit
  // blob: https://developer.mozilla.org/en-US/docs/Web/API/Blob
  // TODO: Maybe use this library: https://github.com/eligrey/FileSaver.js/

  let csvContent = 'data:text/csv;charset=utf-8,';

  const csvData = typeof (csvDataOrFunc) === 'function' ? csvDataOrFunc() : csvDataOrFunc;

  csvData.forEach((row, index) => {
    const dataString = row.join(',');
    csvContent += index < csvData.length ? `${dataString}\n` : dataString;
  });

  const encodedURI = encodeURI(csvContent);
  const TWO_MEGABYTES_IN_BYTES = 2 * 1024 * 1024;
  if (encodedURI.length > (TWO_MEGABYTES_IN_BYTES)) {
    // TODO: add user-visible toastr notification
    console.warn(
      'This client-side generated CSV will likely fail to download in Chrome because it is bigger than 2MB. '
      + 'See https://stackoverflow.com/a/16762555/872328 for more information.'
      + `Actual size: ${round(encodedURI.length / 1024 / 1024, 2)}MB`
    );
  }
  const link = document.createElement('a');
  link.setAttribute('href', encodedURI);
  link.setAttribute('download', `${name}.csv`);
  document.body.appendChild(link); // Required for Firefox
  link.click();
};
