import { mount } from 'enzyme';
import React from 'react';
import HeatmapComponent from './HeatmapComponent';
import { heatmapCSVArrayToHeatmapDataFrame } from '../utils/heatmapHelpers';

describe('HeatmapComponent.jsx', () => {
  const data = [
    ['date', '30d_apply', '60d_apply'],
    ['2017-01-01', 1.1, 2.1],
    ['2017-01-02', 1.2, 2.2],
    ['2017-01-03', 1.3, 2.3],
  ];
  const dataFrame = heatmapCSVArrayToHeatmapDataFrame(data);
  const canvasProps = {
    width: 722,
    height: 128,
  };
  const props = {
    dataFrame,
    ...canvasProps,
  };

  it('renders without crashing', () => {
    // Have to use mount here (and not shallow) because it requires a canvas node
    mount(<HeatmapComponent {...props} />);
  });

  it('Return DropzoneComponent with correct props', () => {
    const wrapper = mount(<HeatmapComponent {...props} />);

    // // Should be 1 canvas
    const canvas = wrapper.find('canvas');
    expect(canvas.length).toBe(1);
    expect(canvas.props()).toEqual(canvasProps);
  });

  // snapshots do not appear to be working with canvas elements
  // This library seems promising, but couldn't get it to work.
  // https://www.npmjs.com/package/jest-canvas-snapshot-serializer
  // it('Matches snapshot', () => {
  //   const wrapper = mount(<HeatmapComponent {...props} />);
  //   expect(wrapper).toMatchSnapshot();
  // });
});
