import {
  arrayOf, func, number, string,
} from 'prop-types';
import { withProps } from '../utils';

/**
 * The Color Mixin is an abstract chart functional class providing universal coloring support as a mix-in for any
 * concrete chart implementation.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.colorMixin.html
 */
export default withProps({
  colorAccessor: func,
  colorDomain: arrayOf(string),
  colors: func, // TO DO : shape a scale
  linearColors: arrayOf(number),
  ordinalColors: arrayOf(string),
});
