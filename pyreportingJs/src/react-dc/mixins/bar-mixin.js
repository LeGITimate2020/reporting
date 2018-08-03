import { bool, number } from 'prop-types';
import { withProps } from '../utils';

/**
 * Props for bar chart that are included in the shared mixins
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.barChart.html
 */
export default withProps({
  alwaysUseRounding: bool,
  barPadding: number,
  centerBar: bool,
  gap: number,
  outerPadding: number,
});
