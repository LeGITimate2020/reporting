import { shallow } from 'enzyme';
import React from 'react';
import configureStore from 'redux-mock-store';
import CrossFilterPanel from './CrossFilterPanel';
import { DropDownList } from './reduxFormHelpers';

describe('CrossFilterPanel.jsx', () => {
  const data = [
    {
      date: '2011-11-14T16:17:54Z', quantity: 2, total: 190, tip: 100, type: 'tab', productIDs: ['001'],
    },
    {
      date: '2011-11-14T16:20:19Z', quantity: 2, total: 190, tip: 100, type: 'tab', productIDs: ['001', '005'],
    },
    {
      date: '2011-11-14T16:28:54Z', quantity: 1, total: 300, tip: 200, type: 'visa', productIDs: ['004', '005'],
    },
    {
      date: '2011-11-14T16:30:43Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001', '002'],
    },
    {
      date: '2011-11-14T16:48:46Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['005'],
    },
    {
      date: '2011-11-14T16:53:41Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001', '004', '005'],
    },
    {
      date: '2011-11-14T16:54:06Z', quantity: 1, total: 100, tip: 0, type: 'cash', productIDs: ['001', '002', '003', '004', '005'],
    },
    {
      date: '2011-11-14T16:58:03Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001'],
    },
    {
      date: '2011-11-14T17:07:21Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['004', '005'],
    },
    {
      date: '2011-11-14T17:22:59Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001', '002', '004', '005'],
    },
    {
      date: '2011-11-14T17:25:45Z', quantity: 2, total: 200, tip: 0, type: 'cash', productIDs: ['002'],
    },
    {
      date: '2011-11-14T17:29:52Z', quantity: 1, total: 200, tip: 100, type: 'visa', productIDs: ['004'],
    },
  ];
  const store = configureStore()();
  const props = {
    data,
    store,
  };

  const diveToComponent = (wrapper) => {
    return wrapper
      .dive()
      .dive()
      .dive()
      .dive();
  };

  it('renders without crashing', () => {
    diveToComponent(shallow(<CrossFilterPanel {...props} />));
  });

  it('Return CrossFilterPanel with correct props', () => {
    const wrapper = diveToComponent(shallow(<CrossFilterPanel {...props} />));

    // Should be 2 DropDownList components (x and y axes)
    expect(wrapper.find(DropDownList).length).toBe(2);
  });

  it('Matches snapshot', () => {
    const wrapper = diveToComponent(shallow(<CrossFilterPanel {...props} />));
    expect(wrapper).toMatchSnapshot();
  });
});
