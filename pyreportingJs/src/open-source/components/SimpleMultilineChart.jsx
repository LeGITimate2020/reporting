import React from 'react';
import PropTypes from 'prop-types';
import PlotlyComponent from './PlotlyComponentFork';

const SimpleMultilineChart = (props) => {
  const {
    traces,
    ...passThroughProps
  } = props;
  let { layout } = props;

  // const watermark = {
  //   x: 0.7,
  //   y: 0.5,
  //   sizex: 0.4,
  //   sizey: 0.4,
  //   opacity: 0.07,
  //   // source: '/static/your-logo.svg',
  //   xanchor: 'right',
  //   xref: 'paper',
  //   yanchor: 'bottom',
  //   yref: 'paper',
  // };

  layout = {
    // images: [watermark],
    ...layout,
  };

  // Remove unnecessary default buttons from plotly
  const config = {
    displaylogo: false,
  };
  return (
    <PlotlyComponent
      {...passThroughProps}
      data={traces}
      layout={layout}
      config={config}
    />
  );
};

SimpleMultilineChart.propTypes = {
  traces: PropTypes.arrayOf(PropTypes.object).isRequired,
  layout: PropTypes.object,
};

SimpleMultilineChart.defaultProps = {
  layout: {},
};

export default SimpleMultilineChart;
