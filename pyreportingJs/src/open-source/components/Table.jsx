import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as d3 from 'd3';
import ReactTable from 'react-table';

import { calculateDomain, textColor } from '../utils/heatmapHelpers';

const MAX_DEFAULT_PAGE_SIZE = 10;
const DEFAULT_COLOR_RANGE = ['#ff9980', '#ffffff', '#8099ff'];


/**
 * Extends ReactTable functionality with conditional formatting
 */
class Table extends React.Component {
  /**
   * returns a d3 color scale for individual scalar values in the table
   * @return {Object} - { all: d3ColorScale, columns: { 'col A': d3ColorScale, ...} }
   *
   */
  colorScalesFromData = () => {
    const { data } = this.props;
    const colorScales = { all: null, columns: {} };

    // scan over all values and columns, bucketing into all and by column
    const allValues = [];
    const allColumns = Object.keys(data[0]);
    const columnToValues = {};
    for (const column of allColumns) {
      for (const row of data) {
        const value = _.get(row, column);
        if (!isNaN(Number(value))) {
          if (this.props.colorByColumn) {
            if (!columnToValues[column]) {
              columnToValues[column] = [];
            }
            columnToValues[column].push({ value });
          }
          allValues.push({ value });
        }
      }
    }

    colorScales.all = d3.scaleLinear()
      .domain(calculateDomain(allValues))
      .range(this.props.colorRange)
      .clamp(true);

    if (this.props.colorByColumn) {
      for (const [column, values] of Object.entries(columnToValues)) {
        // TODO: generate N different color gradients for
        // N columns. v0: enumerate primary color pairs. v1: generate N color gradients
        // with largest possible distance between them in HSV space.
        // perhaps w/ http://gka.github.io/chroma.js/
        colorScales.columns[column] = d3.scaleLinear()
          .domain(calculateDomain(values))
          .range(this.props.colorRange)
          .clamp(true);
      }
    }

    return colorScales;
  };

  getTdProps = (state, rowInfo, column) => {
    if (!rowInfo || !column) {
      return {};
    }
    if (!this.colorScales) {
      this.colorScales = this.colorScalesFromData();
    }
    const value = rowInfo.row[column.id];
    let colorScale = null;
    if (this.props.colorByColumn) {
      colorScale = (this.colorScales.columns[column.id] || (() => ('')));
    } else {
      colorScale = this.colorScales.all;
    }
    const backgroundColor = isNaN(Number(value)) ? '' : colorScale(value);
    const color = textColor(backgroundColor);
    return {
      style: { backgroundColor, color },
    };
  };

  render() {
    const {
      title, renderEmptyChart, data, columns, reactTableProps,
    } = this.props;

    const haveEnoughToRender = columns.length > 0;
    if (!haveEnoughToRender && !renderEmptyChart) {
      return <div />;
    }
    return (
      <div>
        <h4 style={{ textAlign: 'center' }}>
          {title}
        </h4>
        <ReactTable
          data={data}
          columns={columns}
          className="allow-wrap compact"
          defaultPageSize={10}
          getTdProps={this.getTdProps}
          showPaginationBottom={data.length > MAX_DEFAULT_PAGE_SIZE}
          {...reactTableProps}
        />
      </div>
    );
  }
}

Table.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  colorRange: PropTypes.arrayOf(PropTypes.string),
  colorByColumn: PropTypes.bool,
  reactTableProps: PropTypes.object,
  renderEmptyChart: PropTypes.bool,
};

Table.defaultProps = {
  colorRange: DEFAULT_COLOR_RANGE,
  colorByColumn: false,
  reactTableProps: {},
  renderEmptyChart: false,
};

export default Table;
