import React from 'react';

/**
 * React shim to expose chart div as a React "ref" in a consistent way to all subclasses via "this.chart"
 */
export default class BaseChart extends React.Component {
  render() {
    return <div ref={(chart) => { this.chart = chart; }} />;
  }
}
