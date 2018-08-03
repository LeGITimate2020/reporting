import { shallow } from 'enzyme';
import React from 'react';
import configureStore from 'redux-mock-store';
import ColorLegend from './ColorLegend';


describe('ColorLegend.jsx', () => {
  const store = configureStore()();

  const mockFn = jest.fn();
  const props = {
    store,
    domain: [-1, 0, 1],
    onLegendChange: mockFn,
  };
  const diveToComponent = (wrapper) => {
    return wrapper
      .dive()
      .dive()
      .dive()
      .dive();
  };

  it('renders without crashing', () => {
    diveToComponent(shallow(<ColorLegend {...props} />));
  });

  it('Matches snapshot', () => {
    // Use shallow and dive here to prevent 125MB snapshot files
    const wrapper = diveToComponent(shallow(<ColorLegend {...props} />));
    expect(wrapper).toMatchSnapshot();
  });
});
