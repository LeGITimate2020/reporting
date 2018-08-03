import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';
import { calculateDomain, convertDataFrameToHeatmapDataArray, HeatmapDataFrame } from '../utils/heatmapHelpers';
import { PlotlyComponent } from '../index';
import { downloadCSV } from '../utils/commonUI';
import { InlineSelect } from './reduxFormHelpers';
import { areRelevantKeyValuesDifferent } from '../utils/dataManipulationHelpers';
import ColorLegend from './ColorLegend';

const offBlackColor = '#030303';

// TODO: extract Heatmap component from higher level Heatmap + drilldown graphs
/**
 * Heatmap component to visualize multidimensional data with drill down graphs
 */
export default class HeatmapComponent extends React.Component {
  static propTypes = {
    dataFrame: PropTypes.instanceOf(HeatmapDataFrame).isRequired,
    onDataPointHover: PropTypes.func,
    onDataPointSelected: PropTypes.func,

    /**
     * When hovering over the value, this is the prefix
     * '${valueDescription}: ${value}'
     * 'correlation: 0.74'
     * 'myValue: 12'
     */
    valueDescription: PropTypes.string,

    /** Width of canvas in pixels */
    width: PropTypes.number,

    /** Height of canvas in pixels */
    height: PropTypes.number,
  };

  static defaultProps = {
    onDataPointHover: null,
    onDataPointSelected: null,
    valueDescription: 'Value',
    width: 600,
    height: 400,
  };

  // Canvas drawing context
  ctx = null;

  // Number of rows (e.g. dates) in dataset
  rows = null;

  // Number of columns (e.g. window lengths) in dataset
  cols = null;

  // The width/height of a shaded pixel in the heatmap
  rectWidth = null;

  rectHeight = null;

  // The width/height of the drawable region in the Heatmap (e.g. excluding margins where axes and titles are displayed)
  margin = {
    top: 10, right: 20, bottom: 20, left: 50,
  };

  safeWidth = null;

  safeHeight = null;

  // 1 dimensional array of data
  data = null;

  // DOM node of Canvas element
  canvasNode = null;

  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();

    this.safeWidth = props.width - (this.margin.left + this.margin.right);
    this.safeHeight = props.height - (this.margin.top + this.margin.bottom);
    this.state = {
      activeValueKey: props.activeValueKey || null,
      hoverValue: null,
      clickValue: null,
      loading: 0,
      reticlePosition: null,
    };
  }

  componentDidMount() {
    this.initialize();
    this.handleDataChange(this.props);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (areRelevantKeyValuesDifferent(['dataFrame', 'activeValueKey'], this.props, nextProps)) {
      this.handleDataChange(nextProps);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Since we are drawing directly on a Canvas and this is not handled by React's eventing system, we need to
    // determine if we should update the Canvas whenever the underlying React component's state has changed. The two
    // pieces of data that would require a redraw are:
    // 1) activeValueKey -- The user selected a different property to view
    // 2) domain -- the user changed the thresholds in the color legend
    if (areRelevantKeyValuesDifferent(['activeValueKey', 'domain'], prevState, this.state)) {
      const props = { ...this.props };
      if (prevState.activeValueKey === this.state.activeValueKey) {
        props.domain = this.state.domain;
      }
      this.handleDataChange(props);
    } else if (this.data) {
      this.draw(this.data);
    }
  }

  incrementLoading = (increment = 1) => {
    // TODO: hook up to redux store to power global throbber?
    this.setState(prevState => ({ loading: prevState.loading + increment }));
  };

  /**
   * Create the lodash get path
   * Examples:
   *   1) ['value'] -- there is only one value per entry
   *   2) ['value', 'beta'] -- the value is an object so pull out the value for the 'beta' key
   * @return {string[]}
   */
  valueGetter = (valueKey) => {
    const getPath = ['value'];
    const tmpValueGetter = valueKey || this.state.activeValueKey;
    if (tmpValueGetter) {
      getPath.push(tmpValueGetter);
    }
    return getPath;
  };

  /**
   * Handle new data being passed into component through a change in props
   * @param props
   */
  handleDataChange = (props) => {
    const calc = () => {
      const {
        data, rows, cols, valueGetters,
      } = convertDataFrameToHeatmapDataArray(props.dataFrame);

      // eslint-disable-next-line react/no-access-state-in-setstate
      let valueKey = this.state.activeValueKey || props.activeValueKey;

      // If the selected key or the passed in key doesn't exist in the new dataframe, default to the first property
      if (!valueGetters.includes(valueKey)) {
        // keys starting with underscores are hidden from the UI. So find first key that shouldn't be hidden.
        valueKey = valueGetters.filter(v => v.substring(0, 1) !== '_')[0];
      }
      const valueGetter = this.valueGetter(valueKey);

      this.rows = rows;
      this.cols = cols;

      const { safeWidth, safeHeight } = this;

      this.rectWidth = safeWidth / this.cols;
      this.rectHeight = safeHeight / this.rows;

      const range = props.colorRange || ['#FF0000', '#FFFFFF', '#0000FF'];
      const domain = props.domain || calculateDomain(data, valueGetter);
      const NAN_COLOR = '#B4B4B4';

      const colorScale = d3.scaleLinear()
        .domain(domain)
        .range(range);

      for (const datum of data) {
        datum.fillStyle = [
          undefined,
          null,
          NaN,
        ].includes(_.get(datum, valueGetter)) ? NAN_COLOR : colorScale(_.get(datum, valueGetter));
      }
      this.data = data;
      this.draw(data);
      this.incrementLoading(-1);

      const theValueGetters = _.size(props.valueGetters) > 0 ? props.valueGetters : valueGetters;

      this.setState({
        activeValueKey: valueKey,
        valueGetters: theValueGetters.filter(v => v.substring(0, 1) !== '_'), // don't show keys starting with "_"
        domain,
      });
    };
    this.incrementLoading();
    setTimeout(calc, 0);
  };


  initialize = () => {
    // store the actual DOM node
    this.canvasNode = this.canvasRef.current;

    // store the Canvas drawing context
    this.ctx = this.canvasNode.getContext('2d');

    // Move 0, 0 to be within our margins
    this.ctx.translate(this.margin.left, this.margin.top);

    // Attach handlers to DOM events
    this.canvasNode.addEventListener('mousemove', this.onHover, false);
    this.canvasNode.addEventListener('mousedown', this.onClick, false);
  };

  /**
   *
   * @param columnIndex (column)
   * @param rowIndex (row)
   * @return {{x: number, y: number, width: number, height: number}}
   */
  virtualPointToCanvasPixel = (columnIndex, rowIndex) => {
    const { rectWidth, rectHeight, safeHeight } = this;

    const point = {
      x: columnIndex * rectWidth, // canvas pixel
      y: safeHeight - ((rowIndex + 1) * rectHeight), // canvas pixel
      width: rectWidth,
      height: rectHeight,
    };
    return point;
  };

  /**
   *
   * @param x (canvas pixel)
   * @param y (canvas pixel)
   */
  isPointWithinSafeArea = (x, y) => {
    return x > 0 && x < this.safeWidth && y > 0 && y < this.safeHeight;
  };

  /**
   * Converts a canvas pixel into a row/column in the DataFrame and returns the actual datum.
   * Assumes 0,0 is top left of safe area
   * @param x (canvas pixel)
   * @param y (canvas pixel)
   * @return {{x: *, y: *} || null}
   */
  canvasPixelToVirtualPoint = (x, y) => {
    if (!this.isPointWithinSafeArea(x, y)) {
      return null;
    }

    const { rectWidth, rectHeight } = this;
    const x2 = Math.floor(x / rectWidth);
    const y2 = Math.floor(y / rectHeight) + 1;

    const point = {
      x: x2,
      y: y2,
    };

    point.index = (x2 * this.rows) + (this.rows - y2);
    point.datum = this.data[point.index];
    return point;
  };

  draw = (data) => {
    const { ctx } = this;

    // Since 0, 0 is no longer the upper left hand corner, we have to go into the margin
    ctx.clearRect(-this.margin.left, -this.margin.top, this.props.width, this.props.height);

    // Draw actual heatmap
    for (const datum of data) {
      const pixelPoint = this.virtualPointToCanvasPixel(datum.x, datum.y);
      ctx.fillStyle = datum.fillStyle;
      ctx.fillRect(
        pixelPoint.x,
        pixelPoint.y,
        pixelPoint.width,
        pixelPoint.height,
      );
    }
    this.drawXAxis(data);
    this.drawYAxis(data);
    const { reticlePosition } = this.state;
    if (reticlePosition) {
      this.drawReticle(reticlePosition[0], reticlePosition[1], 25);
    }
  };

  drawXAxis(data) {
    const { safeWidth, safeHeight, ctx } = this;
    const x = d3.scaleTime().range([0, safeWidth]);
    x.domain(d3.extent(data, d => d.date));

    const tickCount = 10;
    const tickSize = 6;
    const ticks = x.ticks(tickCount);
    const tickFormat = x.tickFormat();

    ctx.beginPath();
    ticks.forEach((d) => {
      ctx.moveTo(x(d), safeHeight);
      ctx.lineTo(x(d), safeHeight + tickSize);
    });
    ctx.strokeStyle = offBlackColor;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = offBlackColor;

    ticks.forEach((d) => {
      ctx.fillText(tickFormat(d), x(d), safeHeight + tickSize);
    });
  }

  drawYAxis = (data) => {
    const { safeHeight, ctx } = this;
    const y = d3.scaleLinear().range([safeHeight, this.margin.bottom]);
    y.domain(d3.extent(data, d => d.window_length));

    const tickCount = 10;
    const tickSize = 6;
    const tickPadding = 3;
    const ticks = y.ticks(tickCount);
    const tickFormat = y.tickFormat(tickCount);

    ctx.beginPath();
    ticks.forEach((d) => {
      ctx.moveTo(0, y(d));
      ctx.lineTo(-tickSize, y(d));
    });
    ctx.strokeStyle = offBlackColor;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-tickSize, 0);
    ctx.lineTo(0.5, 0);
    ctx.lineTo(0.5, safeHeight);
    ctx.lineTo(-tickSize, safeHeight);
    ctx.strokeStyle = offBlackColor;
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = offBlackColor;
    ticks.forEach((d) => {
      ctx.fillText(tickFormat(d), -tickSize - tickPadding, y(d));
    });

    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = offBlackColor;
    ctx.fillText('Window Length', -safeHeight / 2, -this.margin.left);
    ctx.restore();
  };

  drawReticle = (x, y, size) => {
    const ctx = this.ctx;

    ctx.strokeStyle = offBlackColor;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
  };

  onHover = (evt) => {
    const mousePosition = this.getMousePosition(evt);
    const point = this.canvasPixelToVirtualPoint(mousePosition[0], mousePosition[1]);
    this.setState({
      hoverValue: point && point.datum,
    });

    if (typeof this.props.onDataPointHover === 'function') {
      this.props.onDataPointHover(point);
    }
  };

  getMousePosition = (evt) => {
    const rect = this.canvasNode.getBoundingClientRect();
    const canvasX = evt.clientX - (rect.left + this.margin.left);
    const canvasY = evt.clientY - (rect.top + this.margin.top);
    return [canvasX, canvasY];
  };

  onClick = (evt) => {
    const mousePosition = this.getMousePosition(evt);
    const activeValueGetter = this.valueGetter();
    const point = this.canvasPixelToVirtualPoint(mousePosition[0], mousePosition[1]);
    const value = point.datum;

    const x1Values = [];
    const y1Values = [];

    const x2Values = [];
    const y2Values = [];

    const { dataFrame } = this.props;

    const constantWindowLengthValues = dataFrame.getValuesForWindowLength(value.window_length);
    const constantDateValues = dataFrame.getValuesForDate(value.date);

    for (const [key, entry] of constantWindowLengthValues.entries()) {
      x1Values.push(entry.date);
      y1Values.push(_.get(entry, activeValueGetter));
    }

    for (const [key, entry] of constantDateValues.entries()) {
      x2Values.push(entry.window_length);
      y2Values.push(_.get(entry, activeValueGetter));
    }

    this.setState({
      clickValue: value,
      x1Values,
      y1Values,
      x2Values,
      y2Values,
      reticlePosition: mousePosition,
    });

    if (typeof this.props.onDataPointSelected === 'function') {
      this.props.onDataPointSelected(point);
    }
  };

  generateAndDownloadCSV = () => {
    const { dataFrame } = this.props;
    downloadCSV(dataFrame.toCSVDataArray(), dataFrame.name || 'rolling-dataframe');
  };

  handleColorLegendChange = (values) => {
    const { low, midpoint, high } = values;
    // Redux Form returns changed values as Strings... this + is short-hand for coercing them to Numbers.
    const domain = [+low, +midpoint, +high];

    if (!_.isEqual(domain, this.state.domain)) {
      this.setState({ domain });
    }
  };

  render() {
    const { valueDescription, width, height } = this.props;
    const {
      hoverValue, clickValue, valueGetters, domain,
    } = this.state;
    const activeValueGetter = this.valueGetter();
    const commonLayout = {};

    if (domain) {
      commonLayout.yaxis = { range: [domain[0], domain[domain.length - 1]] };
    }

    const slicedData1 = [
      {
        x: this.state.x1Values,
        y: this.state.y1Values,
        marker: {
          color: 'rgba(200,200,250,0.7)',
        },
      },
    ];

    const slicedData2 = [
      {
        x: this.state.x2Values,
        y: this.state.y2Values,
        marker: {
          color: 'rgba(200,200,250,0.7)',
        },
      },
    ];

    return (
      <div className="row">
        <div className="col-lg-2">
          { _.size(valueGetters) > 1
            && (
            <InlineSelect
              selectName="activeValueKey"
              optionValues={valueGetters}
              optionFriendlyNames={valueGetters}
              allowBlank={false}
              onChange={(evt, selectedValue) => { this.setState({ activeValueKey: selectedValue }); }}
            />
            )
          }
          &nbsp;
        </div>
        <div className="col-lg-2">
          { domain && <ColorLegend domain={domain} onLegendChange={this.handleColorLegendChange} /> }
          &nbsp;
        </div>
        <div className="col-lg-8">
          {
            hoverValue
            && (
            <div>
              <table>
                <tbody>
                  <tr>
                    <td>{this.state.activeValueKey || valueDescription}:</td>
                    <td>&nbsp;{_.get(hoverValue, activeValueGetter)}</td>
                  </tr>
                  <tr>
                    <td>Date:</td>
                    <td>&nbsp;{moment(hoverValue.date).format('YYYY-MM-DD')}</td>
                  </tr>
                  <tr>
                    <td>Window Length: </td>
                    <td>&nbsp;{hoverValue.window_length}</td>
                  </tr>
                  <tr>
                    <td>Coordinate: </td>
                    <td>&nbsp;({hoverValue.x},{hoverValue.y})</td>
                  </tr>
                </tbody>
              </table>
            </div>
            )
          }
          &nbsp;
        </div>

        <div className="row">
          <div className="col-md-8">
            {this.state.loading ? 'Rendering. Please wait...' : ''}
            <div>
              <canvas ref={this.canvasRef} width={width} height={height} />
            </div>
            { clickValue
              && (
              <div className="row">
                <div className="col-md-6">
                  <PlotlyComponent
                    data={slicedData1}
                    layout={{ title: `Window Length: ${clickValue.window_length}`, ...commonLayout }}
                  />
                </div>
                <div className="col-md-6">
                  <PlotlyComponent
                    data={slicedData2}
                    layout={{ title: `Date: ${moment(clickValue.date).format('YYYY-MM-DD')}`, ...commonLayout }}
                  />
                </div>
              </div>
              )
            }
          </div>
        </div>
        <div className="row col-sm-12">
          { this.props.dataFrame && <button className="btn btn-small btn-link" onClick={this.generateAndDownloadCSV}>Download CSV</button> }
        </div>
      </div>
    );
  }
}
