import {
  func, bool, number, oneOfType, string,
} from 'prop-types';
import { withProps } from '../utils';

/**
 * Cap is a mixin that groups small data elements below a cap into an others grouping for both the Row and Pie Charts.
 * The top ordered elements in the group up to the cap amount will be kept in the chart, and the rest will be replaced
 * with an others element, with value equal to the sum of the replaced values. The keys of the elements below the cap
 * limit are recorded in order to filter by those keys when the others* element is clicked.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.capMixin.html
 */
export default withProps({
  cap: number,
  othersGrouper: oneOfType([func, bool]), // disallow true ! only false is accepted
  othersLabel: string,
});
