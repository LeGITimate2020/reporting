import { shallow } from 'enzyme';
import React from 'react';
import CSVPanel from './CSVPanel';

describe('CSVPanel.jsx', () => {
  const csvData = [
    ['header1', 'header2', 'header3'],
    [11, 21, 31],
    [12, 22, 32],
    [13, 23, 33],
  ];

  it('renders without crashing', () => {
    shallow(<CSVPanel />);
  });

  it('Loads CSV data into component state', () => {
    const wrapper = shallow(<CSVPanel />);

    // Run PCA button should not exist
    expect(wrapper.find('.btn-run-pca').length).toBe(0);

    // Tab strip should not exist
    expect(wrapper.find('.csv-panel-tab').length).toBe(0);

    // no data should be loaded into state
    expect(wrapper.instance().state.data.length).toBe(0);

    // Simulate dropping CSV file
    wrapper.instance().onCSVImport({ data: csvData }, 'mySampleFile.csv');

    // data should be in state now
    expect(wrapper.instance().state.data.length).toBe(csvData.length);
    expect(wrapper.instance().state.data).toEqual(csvData);
  });

  it('Matches snapshot', () => {
    const wrapper = shallow(<CSVPanel />);
    expect(wrapper).toMatchSnapshot();
  });
});
