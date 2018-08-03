import React from 'react';
import PropTypes from 'prop-types';
import { PlotlyComponent } from '../index';

/**
 * Pure React component to create a Plotly bar chart.
 * <SimpleBarChart xValues={['thing1', 'thing2', 'thing3']} yValues={[12, 13.9, 1]}  />
 */
const SimpleBarChart = ({ xValues, yValues, layout }) => {
  const _layout = {
    margin: {
      t: 10,
    },
    height: 300,
    showlegend: true,
    legend: { orientation: 'h' },
    ...layout,
  };
  const config = {
    displaylogo: false,
    modeBarButtonsToRemove: ['sendDataToCloud'],
  };
  const data = [
    {
      type: 'bar',
      x: xValues,
      y: yValues,
    },
  ];

  return (
    <PlotlyComponent
      data={data}
      layout={_layout}
      config={config}
    />
  );
};

SimpleBarChart.propTypes = {
  xValues: PropTypes.array.isRequired,
  yValues: PropTypes.arrayOf(PropTypes.number).isRequired,

  /** Plotly layout options */
  layout: PropTypes.object,
};

SimpleBarChart.defaultProps = {
  layout: {},
};

export default SimpleBarChart;
