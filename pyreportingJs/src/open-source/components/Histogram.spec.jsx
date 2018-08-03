import { shallow } from 'enzyme';
import React from 'react';
import Histogram from './Histogram';

describe('Histogram.jsx', () => {
  const values = [13, 23, 33];

  const props = {
    values,
  };

  it('renders without crashing', () => {
    shallow(<Histogram {...props} />);
  });

  it('Return plotly component with correct props', () => {
    const wrapper = shallow(<Histogram {...props} />);

    // Should be 1 plotly component
    expect(wrapper.find('PlotlyComponentFork').length).toBe(1);

    // props should be transformed to plotly style
    expect(wrapper.props().data[0].x).toEqual(values);
  });

  it('Matches snapshot', () => {
    const wrapper = shallow(<Histogram {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
