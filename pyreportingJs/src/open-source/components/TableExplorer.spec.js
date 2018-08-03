import React from 'react';
import { shallow } from 'enzyme';
import TableExplorer from './TableExplorer';

describe('TableExplorer.jsx', () => {
  const csvData = [
    ['header1', 'header2', 'header3'],
    [11, 21, 31],
    [12, 22, 32],
    [13, 23, 33],
  ];

  const props = { data: csvData };

  it('renders without crashing', () => {
    shallow(<TableExplorer />);
  });

  it('Can run PCA on data from props', () => {
    const wrapper = shallow(<TableExplorer {...props} />);
    const btnWrapper = wrapper.find('.btn-run-pca');

    // Button exists because data was successfully imported (without drag-and-drop)
    expect(btnWrapper.length).toBe(1);
    btnWrapper.simulate('click');

    // Button disappears after running PCA
    expect(wrapper.find('.btn-run-pca').length).toBe(0);
  });

  it('Matches snapshot', () => {
    const wrapper = shallow(<TableExplorer {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
