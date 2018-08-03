import Series from './Series';
import { percentChange } from './rollingApply';

/**
 *
 * @param size {Number}
 * @param softFail {Boolean}, if we throw an error when `size` isNaN or return []
 * @returns array of length `size`, e.g.
 * @example range(5) == [0, 1, 2, 3, 4]
 */
export const range = (size, softFail = true) => {
  if (isNaN(size)) {
    if (softFail) {
      size = 0;
    } else {
      throw new Error(`size must be a number, but '${size}' has a type of '${typeof (size)}'`);
    }
  }
  return [...Array(size).keys()];
};


export const calcPercentChangeOnPlots = (plots) => {
  return plots.map((plot) => {
    if (plot.percentChangeSeries) {
      return plot;
    }

    return {
      ...plot,
      percentChangeSeries: plot.series.flatten().rollingApply(percentChange, 2),
    };
  });
};
