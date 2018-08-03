import React from 'react';
import PropTypes from 'prop-types';
import PlotlyComponent from './PlotlyComponentFork';

const Histogram = ({ height, values }) => {
  const layout = {
    margin: {
      t: 0,
    },
    height,
  };
  const data = [
    {
      x: values,
      type: 'histogram',
      marker: {
        color: 'rgba(200,200,250,0.7)',
      },
    },
  ];

  return <PlotlyComponent data={data} layout={layout} autoscaleVisibleYAxis={false} />;
};

Histogram.propTypes = {
  height: PropTypes.number,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};

Histogram.defaultProps = {
  height: 200,
};

export default Histogram;
