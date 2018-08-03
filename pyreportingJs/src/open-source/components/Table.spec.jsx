import React from 'react';
import { shallow } from 'enzyme';
import Table from './Table';

describe('Table.jsx', () => {
  const data = [
    {
      column1: 11,
      column2: 12,
      column3: 'abc',
    },
    {
      column1: 21,
      column2: 22,
      column3: 'def',
    },
  ];
  const columns = ['column1', 'column2', 'column3'];

  const reactTableColumns = columns.map(column => ({ Header: column, accessor: column }));

  const props = {
    columns: reactTableColumns,
    data,
    title: 'testable test table',
  };

  it('renders without crashing!', () => {
    shallow(<Table {...props} />);
  });

  it('Contains one ReactTable and correct h4 title', () => {
    const wrapper = shallow(<Table {...props} />);
    expect(wrapper.find('h4').text()).toBe(props.title);
    expect(wrapper.find('ReactTable').length).toBe(1);
  });

  it('Matches snapshot', () => {
    const wrapper = shallow(<Table {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
