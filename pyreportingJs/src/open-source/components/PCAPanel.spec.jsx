import { shallow } from 'enzyme';
import React from 'react';
import PCAPanel from './PCAPanel';


describe('PCAPanel.jsx', () => {
  const props = {
    columns: ['col1', 'col2', 'col3'],
    eigenvectors: [[0.1, -0.1, -0.3], [0.3, 0.6, -0.1], [0.01, 0.02, 0.03]],
    explainedVariance: [0.80, 0.14, 0.06],
  };

  it('renders without crashing', () => {
    shallow(<PCAPanel {...props} />);
  });

  it('Return simple component with missing props', () => {
    const wrapper = shallow(<PCAPanel />);
    expect(wrapper.find('ScreePlot').length).toBe(0);
    expect(wrapper.find('Eigenvectors').length).toBe(0);
  });

  it('Return component with correct props', () => {
    const wrapper = shallow(<PCAPanel {...props} />);
    expect(wrapper.find('ScreePlot').length).toBe(1);
    expect(wrapper.find('Eigenvectors').length).toBe(1);
  });

  it('Matches snapshot without props', () => {
    const wrapper = shallow(<PCAPanel />);
    expect(wrapper).toMatchSnapshot();
  });

  it('Matches snapshot with props', () => {
    const wrapper = shallow(<PCAPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
