import dc from 'dc';
import BaseChart from './base-chart';
import baseMixin from '../mixins/base-mixin';
import capMixin from '../mixins/cap-mixin';
import colorMixin from '../mixins/color-mixin';
import pieMixin from '../mixins/pie-mixin';

/**
 * The pie chart implementation is usually used to visualize a small categorical distribution. The pie chart uses
 * keyAccessor to determine the slices, and valueAccessor to calculate the size of each slice relative to the sum of
 * all values. Slices are ordered by ordering which defaults to sorting by key.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.pieChart.html
 */
class PieChart extends BaseChart {
  static displayName = 'PieChart';

  componentDidMount() {
    this.chart = dc.pieChart(this.chart);
    this.configure();
    this.chart.render();
  }
}

export default pieMixin(colorMixin(capMixin(baseMixin(PieChart))));
