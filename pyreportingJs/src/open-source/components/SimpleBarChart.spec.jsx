import React from 'react';
import { shallow } from 'enzyme';
import SimpleBarChart from './SimpleBarChart';
import { PlotlyComponent } from '../index';

describe('SimpleBarChart', () => {
  const props = {
    xValues: ['bar1', 'bar2', 'bar3'],
    yValues: [0, 1, 2],
  };

  it('renders without crashing!', () => {
    shallow(<SimpleBarChart {...props} />);
  });

  it('Contains one plotly component with correct props', () => {
    const wrapper = shallow(<SimpleBarChart {...props} />);
    expect(wrapper.find(PlotlyComponent).length).toBe(1);
  });

  it('Matches snapshot', () => {
    const wrapper = shallow(<SimpleBarChart {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
