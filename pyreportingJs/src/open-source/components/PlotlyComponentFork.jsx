import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import Plotly from 'plotly.js/dist/plotly.min';
import { areRelevantKeyValuesDifferent } from '../utils/dataManipulationHelpers';


const LOG_SVG_ICON = {
  width: 800,
  // built using https://codepen.io/anthonydugois/pen/mewdyZ
  path: 'M 50 750 Q 50 50 750 50 L 750 100 Q 100 100 100 750 Z',
  ascent: 800,
  descent: 0,
};

class PlotlyComponentFork extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    layout: PropTypes.object,
    config: PropTypes.object,
    onClick: PropTypes.func,
    onBeforeHover: PropTypes.func,
    onHover: PropTypes.func,
    onUnHover: PropTypes.func,
    onSelected: PropTypes.func,
    onRelayout: PropTypes.func,
    onRedraw: PropTypes.func,
    onRestyle: PropTypes.func,
    onUpdate: PropTypes.func,
    onAnimated: PropTypes.func,
    onAfterPlot: PropTypes.func,
    onSliderChange: PropTypes.func,
    autoscaleVisibleYAxis: PropTypes.bool,
  };

  attachListeners = () => {
    if (this.props.onClick) { this.container.on('plotly_click', this.props.onClick); }
    if (this.props.onBeforeHover) { this.container.on('plotly_beforehover', this.props.onBeforeHover); }
    if (this.props.onHover) { this.container.on('plotly_hover', this.props.onHover); }
    if (this.props.onUnHover) { this.container.on('plotly_unhover', this.props.onUnHover); }
    if (this.props.onSelected) { this.container.on('plotly_selected', this.props.onSelected); }
    this.container.on('plotly_relayout', this.onRelayout);
    if (this.props.onRedraw) { this.container.on('plotly_redraw', this.props.onRedraw); }
    if (this.props.onRestyle) { this.container.on('plotly_restyle', this.props.onRestyle); }
    if (this.props.onUpdate) { this.container.on('plotly_update', this.props.onUpdate); }
    if (this.props.onAnimated) { this.container.on('plotly_animated', this.props.onAnimated); }
    if (this.props.onAfterPlot) { this.container.on('plotly_afterplot', this.props.onAfterPlot); }
    if (this.props.onSliderChange) { this.container.on('plotly_sliderchange', this.props.onSliderChange); }
  };

  componentDidMount() {
    const { data, layout } = this.props;
    this.areLogAxesToggled = false;
    this.createPlotlyDOM(this.container, data, layout, this.config());
  }

  config = () => {
    const { config } = this.props;
    return {
      ...config,
      modeBarButtonsToAdd: [
        ..._.get(config, 'modeBarButtonsToAdd', []),
        {
          name: 'log/linear axes',
          icon: LOG_SVG_ICON,
          click: this.toggleLogAxes,
        },
      ],
      modeBarButtonsToRemove: [
        ..._.get(config, 'modeBarButtonsToRemove', []),
        'sendDataToCloud',
      ],
    };
  };

  toggleLogAxes = () => {
    const { layout } = this.props;
    const layoutUpdate = {};
    // special case when layout.yaxis is null
    if (!layout.yaxis) {
      layoutUpdate['yaxis.type'] = this.areLogAxesToggled ? '' : 'log';
    } else {
      // plotly's layout is { yaxis: {...}, yaxis2: {...}, yaxis3: {...}, ...}
      let i = 1;
      while (_.get(layout, `yaxis${i === 1 ? '' : i}`)) {
        // plotly updates are flattened string keys, e.g. {'yaxis2.type': 'log'}
        layoutUpdate[`yaxis${i === 1 ? '' : i}.type`] = this.areLogAxesToggled ? '' : 'log';
        i++;
      }
    }
    this.areLogAxesToggled = !this.areLogAxesToggled;
    Plotly.relayout(this.container, layoutUpdate);
  };

  createPlotlyDOM = (container, data, layout, config) => {
    // TODO: when data is an empty array, plotly can throw an error, specifically w/
    // these args:
    // div.js-plotly-plot
    // []
    // {title: "some chart title", xaxis: {…}, showlegend: true, legend: {…}, images: Array(1), …}
    // {displaylogo: false, modeBarButtonsToRemove: Array(1)}

    // We clone the layout since plotly mutates it.
    Plotly.newPlot(this.container, data, _.cloneDeep(layout), config);
    this.attachListeners();
  };

  shouldComponentUpdate(nextProps) {
    // TODO: how to determine all relevant keys? perhaps exclude keys like 'uid'

    // compare every plot and see if anything has changed
    const prevData = this.props.data || [];
    const nextData = nextProps.data || [];
    let dataHasChanged = prevData.length !== nextData.length;

    if (!dataHasChanged) {
      // TODO: For the x and y values, consider comparing only a subset?
      const VALIDATION_FIELDS = ['name', 'marker', 'x', 'y'];
      for (const [index, prevDatum] of prevData.entries()) {
        const nextDatum = nextData[index];
        dataHasChanged = areRelevantKeyValuesDifferent(VALIDATION_FIELDS, prevDatum, nextDatum);
        if (dataHasChanged) {
          break;
        }
      }
    }

    const layoutHasChanged = !_.isEqual(this.props.layout, nextProps.layout);
    const configHasChanged = !_.isEqual(this.props.config, nextProps.config);
    return dataHasChanged || layoutHasChanged || configHasChanged;
  }

  componentDidUpdate() {
    this.createPlotlyDOM(this.container, this.props.data, this.props.layout, this.config());
  }

  componentWillUnmount() {
    Plotly.purge(this.container);
  }

  resize() {
    Plotly.Plots.resize(this.container);
  }

  getPlotlyNode = (node) => {
    this.container = node;
    if (this.props.plotlyNodeListeners) {
      for (const listener of this.props.plotlyNodeListeners) {
        listener.plotlyNode = node;
      }
    }
    return this.container;
  };

  getScalarAt = (trace, index, dimensionsToTryToGetValue = ['y', 'close', 'x']) => {
    // some traces, e.g. a histogram, only have an 'x' array, in those we filter using
    // the x values (which are array index -> array value plots). some are candle charts.
    // TODO: for candle charts, compare y axis range to high and low.
    let scalarValueAt;
    for (const dimension of dimensionsToTryToGetValue) {
      const valAtIndex = _.get(trace, `${dimension}[${index}]`);
      if (valAtIndex) {
        scalarValueAt = valAtIndex;
        break;
      }
    }
    return scalarValueAt;
  };

  onRelayout = (event) => {
    const { data, layout: initialLayout } = this.props;
    const { layout } = this.container;

    if (!this.props.autoscaleVisibleYAxis) {
      return;
    }
    if (!this.container || this.rescaling || this.areLogAxesToggled) {
      return;
    }

    let [xRangeMin, xRangeMax] = _.get(this, 'container.layout.xaxis.range', []) || [];
    const shouldAdjustAxes = (xRangeMin && xRangeMax);
    if (shouldAdjustAxes) {
      [xRangeMin, xRangeMax] = [xRangeMin, xRangeMax].map(bound => Number(bound) || moment(bound));
      const yAxisToRange = {};
      for (const trace of data) {
        const layoutAxisKey = this._traceToLayoutAxisKey(trace);
        const traceIsInvisible = 'visible' in trace && (trace.visible === 'legendonly' || !trace.visible);
        const yAxisHasExplicitRange = _.get(initialLayout, `[${layoutAxisKey}].range`, []).length === 2;
        if (traceIsInvisible || yAxisHasExplicitRange) {
          continue;
        }
        if (!(layoutAxisKey in yAxisToRange)) {
          yAxisToRange[layoutAxisKey] = [Infinity, -Infinity];
        }
        // TODO: binary search for start of the new range's xmin,
        // start scanning from there.
        for (let i = 0; i <= trace.x.length; i++) {
          const x = trace.x[i];
          if ((Number(x) || moment(x)) > xRangeMax) {
            break;
          }
          if ((Number(x) || moment(x)) >= xRangeMin) {
            const y = this.getScalarAt(trace, i);
            if (y === undefined) {
              continue;
            }
            const [lowWaterMark, highWaterMark] = yAxisToRange[layoutAxisKey];
            if (y < lowWaterMark) {
              yAxisToRange[layoutAxisKey][0] = y;
            }
            if (y > highWaterMark) {
              yAxisToRange[layoutAxisKey][1] = y;
            }
          }
        }
      }

      const layoutUpdate = {};
      for (const [layoutAxisKey, range] of Object.entries(yAxisToRange)) {
        const isLogAxis = _.get(layout[layoutAxisKey], 'type') === 'log';
        // on log axes, plotly interprets a negative range as a negative exponent, and
        // ergo punts the question of how to handle a "log" scale into negatives.
        // Thus, we can too. Discussion of the dataviz UI problem:
        // http://blog.originlab.com/graphing/visualizing-the-negative-log
        const exactRange = isLogAxis ? range.map(Math.log10) : range;
        const buffer = 0.05 * (exactRange[1] - exactRange[0]);
        layoutUpdate[`${layoutAxisKey}.range`] = [exactRange[0] - buffer, exactRange[1] + buffer];
      }


      if (!this.rescaling) {
        this.rescaling = true;
        Plotly.relayout(this.container, layoutUpdate).then(() => { this.rescaling = false; });
        // and any caller hooks.
        if (this.props.onRelayout) {
          this.props.onRelayout(event);
        }
      }
    }
  };

  _traceToLayoutAxisKey = (trace) => {
    // plotly's data structure does this: 'y' -> layout.yaxis, 'y2' -> layout.yaxis2, etc.
    return `yaxis${_.get(trace, 'yaxis', '').split('')[1] || ''}`;
  };

  /**
   * Remove props that would cause React to warn for unknown props.
   */
  cleanupPropsPassedToDiv = (props) => {
    const copyOfProps = { ...props };
    return _.omit(copyOfProps, [
      'data',
      'layout',
      'config',
      'onClick',
      'onBeforeHover',
      'onHover',
      'onUnHover',
      'onSelected',
      'onRelayout',
      'onRedraw',
      'onRestyle',
      'onUpdate',
      'onAnimated',
      'onAfterPlot',
      'onSliderChange',
      'plotlyNodeListeners',
      'autoscaleVisibleYAxis',
    ]);
  };

  render() {
    const passThroughProps = this.cleanupPropsPassedToDiv(this.props);

    return (
      <div {...passThroughProps} ref={this.getPlotlyNode} />
    );
  }
}

PlotlyComponentFork.defaultProps = {
  autoscaleVisibleYAxis: true,
};


export default PlotlyComponentFork;
