/**
 * This file is the entry point for building pyreportingBundle.js. The exports here can be called from any web page (e.g. a
 * Bokeh generated HTML file). To modify how it is built, see the pyreportingBundle entry in webpack.config.babel.js.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import configureStore from './store/configureStore';
import { heatmapCSVArrayToHeatmapDataFrame } from './utils/heatmapHelpers';

import {
  HeatmapComponent,
  Table,
  TableExplorer,
  SimpleMultilineChart,
} from './index';

import 'react-table/react-table.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../react-dc/react-dc.css';
import 'react-dropzone-component/styles/filepicker.css';

const initializeReactWithRedux = (components, elementId) => {
  const store = configureStore();

  ReactDOM.render((
    <Provider store={store}>
      {components}
    </Provider>
  ), document.getElementById(elementId));
};

export const initializeBokehReact = (props) => {
  const { model } = props;
  const {
    start, end, title, element_id,
  } = model;
  ReactDOM.render(
    (
      <div>
        <h2>{title}</h2>
        This is a test from React!
        <ul>
          <li>Start: {start}</li>
          <li>End: {end}</li>
        </ul>
      </div>
    ),
    document.getElementById(element_id),
  );
};

/**
 * Entry point for HeatmapWidget (based on Bokeh)
 */
export const initializeBokehHeatmap = (props) => {
  const { model } = props;
  const {
    title, element_id, data, valueDescription, domain, height, width,
  } = model;
  const dataFrame = heatmapCSVArrayToHeatmapDataFrame(data);
  const components = (
    <div>
      <h2>{title}</h2>
      <HeatmapComponent
        dataFrame={dataFrame}
        valueDescription={valueDescription}
        domain={domain || null}
        height={height || 400}
        width={width || 1000}
      />
    </div>
  );
  initializeReactWithRedux(components, element_id);
};

/**
 * Entry point for InteractiveTableWidget (based on Bokeh)
 */
export const initializeBokehInteractiveTable = (props) => {
  const { model } = props;
  const {
    title, element_id, data, headers, width,
  } = model;
  const columns = headers.map(header => ({
    Header: header,
    accessor: header,
  }));

  const components = (
    <div style={{ width }}>
      <Table
        title={title}
        data={data}
        columns={columns}
      />
    </div>
  );
  initializeReactWithRedux(components, element_id);
};

/**
 * Entry point for InteractivePlotWidget (based on Bokeh)
 */
export const initializeBokehInteractivePlot = (props) => {
  const { model } = props;
  const {
    title, element_id, traces, width,
  } = model;

  const components = (
    <div style={{ width }}>
      <h3>{title}</h3>
      <SimpleMultilineChart traces={traces} />
    </div>
  );
  initializeReactWithRedux(components, element_id);
};

/**
 * Entry point for InteractivePlotWidget (based on Bokeh)
 */
export const initializeBokehTableExplorer = (props) => {
  const { model } = props;
  const {
    title, element_id, data, width,
  } = model;

  const components = (
    <div style={{ width }}>
      <TableExplorer data={data} title={title} />
    </div>
  );
  initializeReactWithRedux(components, element_id);
};
