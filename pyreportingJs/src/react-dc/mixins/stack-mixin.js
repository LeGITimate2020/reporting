import {
  arrayOf, bool, func, oneOfType, shape, string,
} from 'prop-types';
import { withProps } from '../utils';


const groupShape = shape({
  all: func,
});

const stackShape = shape({
  group: groupShape.isRequired,
  name: string,
  accessor: func,
});

const stackType = oneOfType([groupShape, stackShape]);

/**
 * Stack Mixin is an mixin that provides cross-chart support of stackability using d3.stackD3v3.
 *
 * https://dc-js.github.io/dc.js/docs/html/dc.stackMixin.html
 */
export default withProps({
  hidableStacks: bool,
  stack: {
    propTypes: oneOfType([
      stackType,
      arrayOf(stackType),
    ]),
    setter(method, val) {
      const stacks = [].concat(val);
      stacks.forEach((stack) => {
        if (stack.group && stack.name && stack.accessor) {
          method(stack.group, stack.name, stack.accessor);
        } else {
          method(stack);
        }
      });
    },
  },
  stackLayout: func,
  title: {
    propTypes: shape({
      stackName: string,
      titleAccessor: func,
    }),
    setter(method, val) {
      method(val.stackName, val.titleAccessor);
    },
  },
});
