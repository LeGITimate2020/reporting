import React from 'react';
import { shallow } from 'enzyme';
import SimpleMultilineChart from './SimpleMultilineChart';

describe('SimpleMultilineChart', () => {
  const trace1 = {
    x: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    y: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    name: 'Name of Trace 1',
  };
  const trace2 = {
    x: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    y: [1, 0, 3, 2, 5, 4, 7, 6, 8],
    name: 'Name of Trace 2',
  };
  const traces = [trace1, trace2];

  const props = {
    traces,
  };

  it('renders without crashing!', () => {
    shallow(<SimpleMultilineChart {...props} />);
  });

  it('Contains one plotly component with correct props', () => {
    const wrapper = shallow(<SimpleMultilineChart {...props} />);
    expect(wrapper.find('PlotlyComponentFork').length).toBe(1);

    // props on the Plotly component should reflect the input props from SimpleMultilineChart
    expect(wrapper.props().data).toEqual(traces);
  });

  it('Matches snapshot', () => {
    const wrapper = shallow(<SimpleMultilineChart {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
