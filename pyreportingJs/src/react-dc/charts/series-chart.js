import dc from 'dc';
import CompositeChart from './composite-chart';
import seriesMixin from '../mixins/series-mixin';

/**
 * A series chart is a chart that shows multiple series of data overlaid on one chart, where the series is specified in
 * the data. It is a specialization of Composite Chart and inherits all composite features other than recomposing the
 * chart.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.seriesChart.html
 */
class SeriesChart extends CompositeChart {
  static displayName = 'SeriesChart';

  componentDidMount() {
    this.chart = dc.seriesChart(this.chart);
    this.configure();
    this.chart.render();
  }
}

export default seriesMixin(SeriesChart);
