import React from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import _ from 'lodash';
import CrossFilterPanel from './CrossFilterPanel';
import PCAPanel from './PCAPanel';
import { convertRecordArraysToRecordObjects, runPCA } from '../utils/dataManipulationHelpers';

import Table from './Table';

/**
 * Pure component to generate tab strip based on props
 */
const TableExplorerTabStrip = (props) => {
  const {
    data, pcaData, reactTableColumns, title, fileId,
  } = props;
  if (data.length === 0) {
    return null;
  }

  return (
    <Tabs animation={false} className="csv-panel-tab" id="csv-panel-tabs">
      <Tab eventKey={1} title="Table">
        <Table
          key={fileId}
          title={title}
          columns={reactTableColumns}
          data={data}
          colorByColumn
          reactTableProps={{ defaultPageSize: 25 }}
        />
      </Tab>
      <Tab eventKey={2} title="Linked Scatter">
        <div>
          {data.length > 0 && <CrossFilterPanel key={fileId} data={data} title={title} />}
        </div>
      </Tab>
      <Tab eventKey={3} title="Principal Component Analysis">
        <div>
          <PCAPanel {...pcaData} />
        </div>
      </Tab>
    </Tabs>
  );
};

/**
 * Tabular data explorer:
 * 1) Sortable table
 * 2) Linked Scatter
 * 3) Optional PCA analysis
 *
 * Data format:
 * [
 *   ['header1', 'header2', 'header3'],
 *   [11, 21, 31],
 *   [12, 22, 32],
 *   [13, 23, 33],
 * ];
 */
export default class TableExplorer extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    shouldRunPCA: PropTypes.bool,
    title: PropTypes.string,
  };

  static defaultProps = {
    data: [],
    shouldRunPCA: false,
    title: '',
  };

  constructor(props) {
    super(props);

    this.state = {
      shouldRunPCA: !!this.props.shouldRunPCA,
      fileId: 0,
    };
  }

  _derivePropsFromData = (data, shouldRunPCA) => {
    let recordArrays;
    let pcaData = {};

    if (shouldRunPCA) {
      [recordArrays, pcaData] = runPCA(data);
    } else {
      recordArrays = data;
    }

    const columns = recordArrays[0];

    // convert to a format usable by <ReactTable />
    const reactTableColumns = columns.map(column => ({ Header: column, accessor: column }));
    return {
      columns,
      reactTableColumns,
      data: convertRecordArraysToRecordObjects(recordArrays),
      pcaData,
    };
  };

  onPCAClick = () => {
    this.setState(state => ({
      shouldRunPCA: true,
      fileId: state.fileId + 1,
    }));
  };

  render() {
    const { data, title } = this.props;
    if (data.length === 0) {
      return null;
    }
    const { fileId, shouldRunPCA } = this.state;

    // In order to minimize component state, it is fine to do data manipulation here in the render method. The important
    // thing to keep in mind is to make sure there are no unnecessary renders.
    const derivedProps = this._derivePropsFromData(data, shouldRunPCA);

    return (
      <div className="row">
        <div className="col-lg-9">
          {
            _.isEmpty(derivedProps.pcaData)
            && (
            <button
              className="btn btn-sm btn-info btn-run-pca"
              onClick={this.onPCAClick}
            >
              Run PCA
            </button>
            )
          }
        </div>
        <div className="col-lg-12">
          <TableExplorerTabStrip title={title} fileId={fileId} {...derivedProps} />
        </div>
      </div>
    );
  }
}
