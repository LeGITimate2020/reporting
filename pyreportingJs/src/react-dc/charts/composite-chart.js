import dc from 'dc';
import BaseChart from './base-chart';
import coordinateGridMixin from '../mixins/coordinate-grid-mixin';

/**
 * Composite charts are a special kind of chart that render multiple charts on the same Coordinate Grid. You can
 * overlay (compose) different bar/line/area charts in a single composite chart to achieve some quite flexible charting
 * effects.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.compositeChart.html
 */
class CompositeChart extends BaseChart {
  static displayName = 'CompositeChart';

  componentDidMount() {
    this.chart = dc.compositeChart(this.chart);
    this.configure();
    this.chart.render();
  }
}

export default coordinateGridMixin(CompositeChart);
