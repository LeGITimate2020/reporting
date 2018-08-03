import {
  any, bool, func, number, oneOfType, shape, string,
} from 'prop-types';
import { withProps } from '../utils';

const groupShape = shape({
  all: func,
});

/**
 * dc.baseMixin is an abstract functional object representing a basic dc chart object for all chart and widget
 * implementations. Methods from the dc.baseMixin are inherited and available on all chart implementations in the dc
 * library.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.baseMixin.html
 */
export default withProps({
  dimension: shape({
    filter: func,
  }).isRequired, // TO DO : crossfilter.dimension
  keyAccessor: func,
  label: {
    propTypes: oneOfType([func, shape({
      labelFunction: func.isRequired,
      enableLabels: bool.isRequired,
    })]),
    setter(method, val) {
      if (val.labelFunction && val.enableLabels) {
        method(val.labelFunction, val.enableLabels);
      } else {
        method(val);
      }
    },
  },
  filter: any,
  group: {
    propTypes: oneOfType([groupShape, shape({
      group: groupShape.isRequired,
      name: string.isRequired,
    })]).isRequired,
    setter: (method, val) => ((val.group && val.name) ? method(val.group, val.name) : method(val)),
  },
  height: oneOfType([func, number]),
  ordering: func,
  title: func,
  valueAccessor: func,
  width: oneOfType([func, number]),
});
