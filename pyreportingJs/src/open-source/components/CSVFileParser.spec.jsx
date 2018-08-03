import { shallow } from 'enzyme';
import React from 'react';
import { DropzoneComponent } from 'react-dropzone-component';
import CSVFileParser from './CSVFileParser';

describe('CSVFileParser.jsx', () => {
  const noOp = () => {};
  const props = {
    onLoad: noOp,
  };

  it('renders without crashing', () => {
    shallow(<CSVFileParser {...props} />);
  });

  it('Return DropzoneComponent with correct props', () => {
    const wrapper = shallow(<CSVFileParser {...props} />);
    // Should be 1 Dropzonecomponent
    expect(wrapper.find(DropzoneComponent).length).toBe(1);
  });

  it('Matches snapshot', () => {
    const wrapper = shallow(<CSVFileParser {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
