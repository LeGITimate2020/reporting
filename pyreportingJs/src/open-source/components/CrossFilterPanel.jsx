import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { reduxForm, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import * as d3 from 'd3';
import crossfilter from 'crossfilter2';
import dc from 'dc';
import { ScatterPlot } from '../../react-dc/react-dc';
import { DropDownList } from './reduxFormHelpers';
import '../../react-dc/react-dc.css';


/**
 * This component should accept data and then be the hub through which you can add multiple related graphs. Currently
 * the only graph implemented is the ScatterPlot.
 */
class CrossFilterPanel extends Component {
  static propTypes = {
    /**
     * Sample:
     *  [
     *    {date: "2011-11-14T16:17:54Z", quantity: 2, total: 190, tip: 100, type: "tab", productIDs:["001"]},
     *    ...
     *  ]
     * More detail here: https://github.com/crossfilter/crossfilter/wiki/API-Reference
     */
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  constructor(props) {
    super(props);
    this.state = this._initializeCrossFilter(props.data);
  }

  _initializeCrossFilter = (data) => {
    // TODO: do validation/sanity checks on the data?

    // these SHOULD NOT live in this.state because they are rich objects and we will be mutating them directly
    this.cfData = crossfilter(data);
    this.dimensions = {};
    this.groups = {};

    const columns = this._getColumnNamesFromData(data);

    // these SHOULD all live in this.state because they are simple objects that will only be read/re-created
    return {
      columns,
      dimensionNames: [],
      charts: [],
    };
  };

  _getColumnNamesFromData = (data) => {
    if (Array.isArray(data) && data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  };

  renderCFGroup = (dimensionName) => {
    return this.groups[dimensionName].all().map(item => (
      <div key={item.key}>
        {item.key} = {item.value}
        <button onClick={() => { this.filter(dimensionName, item.key); }}>Filter {dimensionName} to {item.key}</button>
      </div>
    ));
  };

  filter = (dimension, value) => {
    this.dimensions[dimension].filter(value);
    this.forceUpdate();
  };

  createDimensionAndGroup = (dimensionName, dimensionFn) => {
    if (dimensionName in this.dimensions) {
      console.log(`${dimensionName} already exists. Skipping creating a new one.`);
      return;
    }

    const _dimFn = typeof dimensionFn !== 'function' ? d => d[dimensionName] : dimensionFn;

    // create new crossfilter dimension & group
    const dimension = this.cfData.dimension(_dimFn);
    const group = dimension.group();

    // store these in instance Objects for easy access throughout this component
    this.dimensions[dimensionName] = dimension;
    this.groups[dimensionName] = group;

    this.setState({
      dimensionNames: [...this.state.dimensionNames, dimensionName],
    });

    return [dimension, group];
  };

  renderDimension = (dimensionName) => {
    return (
      <div key={dimensionName}>
        <h4>{dimensionName}</h4>
        {this.renderCFGroup(dimensionName)}
      </div>
    );
  };

  renderDimensions = () => {
    return Object.keys(this.dimensions).map(d => this.renderDimension(d));
  };

  render() {
    const { columns } = this.state;
    const { column1, column2, title } = this.props;
    return (
      <div className="container-fluid">
        <div className="row">
          <h2>{title}</h2>
          <div className="col-lg-2">
            xAxis
            <DropDownList name="column1" values={columns} />
          </div>
          <div className="col-lg-2">
            yAxis
            <DropDownList name="column2" values={columns} />
          </div>
          <div className="col-lg-8">&nbsp;</div>
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={() => { this.createScatter(column1, column2); }}>
            Create scatter: ({column1}, {column2})
          </button>

          {this.renderScatters()}
        </div>

      </div>
    );
  }

  /**
   *
   * @param column1 - xAxis column name
   * @param column2 - yAxis column name
   * @param props - any additional props you'd like to passthrough to the ScatterPlot component
   */
  createScatter = (column1, column2, props = {}) => {
    const dimensionName = `scatter-${column1}-${column2}`;
    const [dimension, group] = this.createDimensionAndGroup(dimensionName, r => [r[column1], r[column2]]);
    const [xMin, xMax] = d3.extent(this.props.data, d => d[column1]);
    const [yMin, yMax] = d3.extent(this.props.data, d => d[column2]);
    const scaleFactor = 0.1;

    const chart = {
      // this type is some term we made up so that we could do some switch/case rendering
      type: 'scatter',

      props: {
        key: dimensionName,

        // these props are props from react-dc
        dimension,
        group,
        x: d3.scaleLinear().domain([xMin - (Math.abs(xMin) * scaleFactor), xMax * (1 + scaleFactor)]),
        y: d3.scaleLinear().domain([yMin - (Math.abs(yMin) * scaleFactor), yMax * (1 + scaleFactor)]),
        xAxisLabel: column1,
        yAxisLabel: column2,
        height: 500,
        width: 500,

        // allow caller to inject any other props, or override props defined above (e.g. height/width)
        ...props,
      },
    };

    this.setState(state => ({ charts: [...state.charts, chart] }));
  };

  renderScatters = () => {
    // Find all scatter charts
    const scatterCharts = this.state.charts.filter(chart => chart.type === 'scatter');

    return (
      <div>
        { scatterCharts.map(chart => (<ScatterPlot {...chart.props} />)) }
      </div>
    );
  };

  clearAllFilters = () => {
    for (const [dimensionName, dimension] of Object.entries(this.dimensions)) {
      dimension.filterAll();
    }
    dc.renderAll();
    this.forceUpdate();
  };
}

const formName = 'crossFilterPanel';
const ReduxForm = reduxForm({
  form: formName,
  enableReinitialize: true,
})(CrossFilterPanel);

const selector = formValueSelector(formName);

const mapStateToProps = (state, ownProps) => {
  const initialValues = {};
  return {
    initialValues,
    column1: selector(state, 'column1'),
    column2: selector(state, 'column2'),
    ...ownProps,
  };
};

export default connect(mapStateToProps)(ReduxForm);
