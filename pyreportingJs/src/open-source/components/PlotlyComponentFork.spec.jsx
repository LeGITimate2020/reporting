import { mount } from 'enzyme';
import React from 'react';
import PlotlyComponentFork from './PlotlyComponentFork';

describe('PlotlyComponentFork.jsx', () => {
  const values = [1, 2, 3, 4, 5];
  const data = [
    {
      x: values,
      type: 'histogram',
      marker: {
        color: 'rgba(200,200,250,0.7)',
      },
    },
  ];

  const props = {
    data,
  };

  it('renders without crashing', () => {
    // note: Plotly has to use mount because it interacts with the DOM. `shallow` doesn't seem to work here
    mount(<PlotlyComponentFork {...props} />);
  });
});
