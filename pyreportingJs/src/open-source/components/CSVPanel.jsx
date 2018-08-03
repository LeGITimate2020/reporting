import React from 'react';
import { uniqueId } from 'lodash';
import CSVFileParser from './CSVFileParser';
import TableExplorer from './TableExplorer';

/**
 * Higher level component to combine CSVFileParser to TableExplorer
 * - passes data and filename to Table Explorer
 */
export default class CSVPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileName: null,
      data: [],
      fileId: 0,
    };
  }

  /**
   * @param values {Object} -- Papa.parsed object
   * @param fileName {String}
   */
  onCSVImport = (values, fileName) => {
    this.setState({
      fileName,
      data: values.data,
      fileId: uniqueId('CSVPanel'),
    });
  };

  render() {
    return (
      <div className="row">
        <div className="col-lg-6">
          <CSVFileParser onLoad={this.onCSVImport} />
        </div>
        <div className="col-lg-12">
          <TableExplorer key={this.state.fileId} data={this.state.data} title={this.state.fileName || 'CSV Content'} />
        </div>
      </div>
    );
  }
}
