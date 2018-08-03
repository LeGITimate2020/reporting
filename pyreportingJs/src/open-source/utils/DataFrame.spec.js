import Series from './Series';
import DataFrame from './DataFrame';
import { mapToArrays } from './dataManipulationHelpers';

describe('DataFrame', () => {
  const timeseriesObject1 = {
    1: 1.01, 2: 2.01, 3: 3.01, 5: 5.01,
  };
  const timeseriesObject2 = { 1: 1.02, 4: 4.02 };
  const timeseriesObject3 = { 1: 1.03, 3: 3.03, 4: 4.03 };

  it('imports and exports Series', () => {
    const series1 = Series.fromSeriesObject(timeseriesObject1, 'series1');
    const series2 = Series.fromSeriesObject(timeseriesObject2, 'series2');
    const series3 = Series.fromSeriesObject(timeseriesObject3, 'series3');
    const dataFrame = DataFrame.fromSeriesArray([series1, series2, series3]);
    const series1output = dataFrame.getSeries('series1');
    const series2output = dataFrame.getSeries('series2');
    const series3output = dataFrame.getSeries('series3');

    const xValues = [1, 2, 3, 4, 5];
    expect(series1output.toXYArrays()).toEqual([xValues, [1.01, 2.01, 3.01, undefined, 5.01]]);
    expect(series2output.toXYArrays()).toEqual([xValues, [1.02, undefined, undefined, 4.02, undefined]]);
    expect(series3output.toXYArrays()).toEqual([xValues, [1.03, undefined, 3.03, 4.03, undefined]]);
  });

  it('Upserts Series', () => {
    const series1 = Series.fromSeriesObject(timeseriesObject1, 'series1');
    const series2 = Series.fromSeriesObject(timeseriesObject2, 'series1');
    const dataFrame = DataFrame.fromSeriesArray([series1]);
    dataFrame.addSeries(series2, { upsertSeries: true });
    const series1output = dataFrame.getSeries('series1');

    const xValues = [1, 2, 3, 4, 5];
    expect(series1output.toXYArrays()).toEqual([xValues, [1.02, 2.01, 3.01, 4.02, 5.01]]);
  });

  it('deletes columns', () => {
    const series1 = Series.fromSeriesObject(timeseriesObject1, 'series1');
    const series2 = Series.fromSeriesObject(timeseriesObject2, 'series2');
    const series3 = Series.fromSeriesObject(timeseriesObject3, 'series3');

    const dataFrame = DataFrame.fromSeriesArray([series1, series2, series3]);

    const rowBefore = mapToArrays(dataFrame.get(1));
    const columnsBefore = [...dataFrame.columns];

    dataFrame.deleteColumn('series1');

    const rowAfter = mapToArrays(dataFrame.get(1));
    const columnsAfter = [...dataFrame.columns];

    /**
     * As a first check that the column was deleted, check that a row before and after the deletion has one fewer element
     */
    expect(rowAfter).not.toEqual(rowBefore);
    expect(columnsBefore.length - 1).toEqual(columnsAfter.length);

    expect(() => {
      dataFrame.getSeries('series1');
    }).toThrow("'series1' does not exist in DataFrame.");

    const series2output = dataFrame.getSeries('series2');
    const series3output = dataFrame.getSeries('series3');

    const xValues = [1, 2, 3, 4, 5];
    expect(series2output.toXYArrays()).toEqual([xValues, [1.02, undefined, undefined, 4.02, undefined]]);
    expect(series3output.toXYArrays()).toEqual([xValues, [1.03, undefined, 3.03, 4.03, undefined]]);
  });

  it('Fills forward', () => {
    const series1 = Series.fromSeriesObject(timeseriesObject1, 'series1');
    const series2 = Series.fromSeriesObject(timeseriesObject2, 'series2');
    const series3 = Series.fromSeriesObject(timeseriesObject3, 'series3');
    const dataFrame = DataFrame.fromSeriesArray([series1, series2, series3]).fillNA();
    const series1output = dataFrame.getSeries('series1');
    const series2output = dataFrame.getSeries('series2');
    const series3output = dataFrame.getSeries('series3');

    const xValues = [1, 2, 3, 4, 5];
    expect(series1output.toXYArrays()).toEqual([xValues, [1.01, 2.01, 3.01, 3.01, 5.01]]);
    expect(series2output.toXYArrays()).toEqual([xValues, [1.02, 1.02, 1.02, 4.02, 4.02]]);
    expect(series3output.toXYArrays()).toEqual([xValues, [1.03, 1.03, 3.03, 4.03, 4.03]]);
  });

  it('dropNA', () => {
    const timeseriesObjectA = {
      1: 1.01, 2: 2.01, 3: 3.01, 4: 4.01, 5: 5.01,
    };

    const series1 = Series.fromSeriesObject(timeseriesObjectA, 'series1');
    const series2 = Series.fromSeriesObject(timeseriesObject2, 'series2');
    const series3 = Series.fromSeriesObject(timeseriesObject3, 'series3');
    const dataFrame = DataFrame.fromSeriesArray([series1, series2, series3]);
    dataFrame.dropNA();
    const series1output = dataFrame.getSeries('series1');
    const series2output = dataFrame.getSeries('series2');
    const series3output = dataFrame.getSeries('series3');

    expect(series1output.toXYArrays()).toEqual([[1, 4], [1.01, 4.01]]);
    expect(series2output.toXYArrays()).toEqual([[1, 4], [1.02, 4.02]]);
    expect(series3output.toXYArrays()).toEqual([[1, 4], [1.03, 4.03]]);
  });

  it('can getDataBetween', () => {
    const series1 = Series.fromSeriesObject(timeseriesObject1, 'series1');
    const series2 = Series.fromSeriesObject(timeseriesObject2, 'series2');
    const series3 = Series.fromSeriesObject(timeseriesObject3, 'series3');
    const dataFrame = DataFrame.fromSeriesArray([series1, series2, series3]).getDataBetween(2, 4);
    const series1output = dataFrame.getSeries('series1');
    const series2output = dataFrame.getSeries('series2');
    const series3output = dataFrame.getSeries('series3');

    const xValues = [2, 3, 4];
    expect(series1output.toXYArrays()).toEqual([xValues, [2.01, 3.01, undefined]]);
    expect(series2output.toXYArrays()).toEqual([xValues, [undefined, undefined, 4.02]]);
    expect(series3output.toXYArrays()).toEqual([xValues, [undefined, 3.03, 4.03]]);
  });
});
