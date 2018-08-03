import React from 'react';
import PropTypes from 'prop-types';
import { zipObject, isEmpty } from 'lodash';
import ReactTable from 'react-table';
import SimpleBarChart from './SimpleBarChart';

/**
 * Pure React component to show Scree Plot
 */
const ScreePlot = ({ data }) => {
  const PCNames = data.map((item, index) => `PC${index + 1}`);
  const layout = {
    showlegend: false,
    width: 400,
    yaxis: {
      range: [0, 1],
    },
  };
  return (
    <div className="row">
      <h4>Scree Plot</h4>
      <div className="col-lg-1">
        {
          data.map((item, index) => (
            <div key={index}>{PCNames[index]}: {item.toFixed(3)}</div>
          ))
        }
      </div>
      <div className="col-lg-11">
        <SimpleBarChart xValues={PCNames} yValues={data} layout={layout} />
      </div>
    </div>
  );
};

ScreePlot.propTypes = {
  /**
   * Array of explained variance e.g. [0.85, 0.10, 0.05]
   * Must be in descending order
   * Should add up to 1.0 (100%)
   * */
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
};

const Eigenvectors = ({ eigenvectors, columns }) => {
  const listOfObjects = eigenvectors.map(eigenvector => zipObject(columns, eigenvector));
  const reactTableColumns = columns.map(column => ({ Header: column, accessor: column }));
  const column = {
    Header: '',
    id: 'row',
    filterable: false,
    Cell: row => <div>PC{row.index + 1}</div>,
  };
  reactTableColumns.unshift(column);
  return (
    <div>
      <h4>Eigenvectors</h4>
      <ReactTable data={listOfObjects} columns={reactTableColumns} defaultPageSize={eigenvectors.length} />
    </div>
  );
};

Eigenvectors.propTypes = {

  /** e.g. [ [4, -1, 3.2], [0.32, -2, -7] ] */
  eigenvectors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,

  /** e.g. ['petal width', 'petal height', 'color'] */
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const PCAPanel = (props) => {
  if (isEmpty(props)) {
    return <div>Click the Run PCA button to populate this tab.</div>;
  }

  const {
    explainedVariance,
    eigenvectors,
    columns,
  } = props;

  return (
    <div>
      <h3>Principal Components</h3>
      <div>
        <ScreePlot data={explainedVariance} />
        <Eigenvectors eigenvectors={eigenvectors} columns={columns} />
      </div>
    </div>
  );
};

PCAPanel.propTypes = {
  /**
   * Array of explained variance e.g. [0.85, 0.10, 0.05]
   * Must be in descending order
   * */
  explainedVariance: PropTypes.arrayOf(PropTypes.number),

  /** e.g. [ [4, -1, 3.2], [0.32, -2, -7] ] */
  eigenvectors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),

  /** e.g. ['petal width', 'petal height', 'color'] */
  columns: PropTypes.arrayOf(PropTypes.string),
};

export default PCAPanel;
