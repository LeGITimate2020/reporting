import dc from 'dc';
import BaseChart from './base-chart';
import coordinateGridMixin from '../mixins/coordinate-grid-mixin';
import scatterMixin from '../mixins/scatter-mixin';

/**
 * A scatter plot chart
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.scatterPlot.html
 */
class ScatterPlot extends BaseChart {
  static displayName = 'ScatterPlot';

  componentDidMount() {
    this.chart = dc.scatterPlot(this.chart);
    this.configure();
    this.chart.render();
  }
}

export default scatterMixin(coordinateGridMixin(ScatterPlot));
