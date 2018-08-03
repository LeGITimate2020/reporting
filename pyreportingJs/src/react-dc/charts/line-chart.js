import dc from 'dc';
import BaseChart from './base-chart';
import coordinateGridMixin from '../mixins/coordinate-grid-mixin';
import stackMixin from '../mixins/stack-mixin';
import lineMixin from '../mixins/line-mixin';

/**
 * Concrete line/area chart implementation.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.lineChart.html
 */
class LineChart extends BaseChart {
  static displayName = 'LineChart';

  componentDidMount() {
    this.chart = dc.lineChart(this.chart);
    this.configure();
    this.chart.render();
  }
}

export default stackMixin(coordinateGridMixin(lineMixin(LineChart)));
