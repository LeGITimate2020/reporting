import { shape, number } from 'prop-types';
import { withProps } from '../utils';

/**
 * Margin is a mixin that provides margin utility functions for both the Row Chart and Coordinate Grid Charts.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.marginMixin.html
 */
export default withProps({
  margins: shape({
    left: number.isRequired,
    right: number.isRequired,
    top: number.isRequired,
    bottom: number.isRequired,
  }),
});
