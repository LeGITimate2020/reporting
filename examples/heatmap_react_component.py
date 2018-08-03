# Created: 4/26/18
""" Example implementation of a simple React component """

from bokeh.layouts import column
from bokeh.io import show

from pyreporting.widgets.heatmap import HeatmapWidget


if __name__ == '__main__':
    import pandas as pd

    df: pd.DataFrame = pd.read_csv('./sample_data/rolling-dataframe-good.csv', index_col=0)
    headers = ['date'] + list(df.columns)
    data: list = df.to_records().tolist()
    data.insert(0, headers)

    id_base = 'heatmap-react-div'
    id1 = f'{id_base}-1'
    heatmap_react_component = HeatmapWidget(
        data=data,
        title='Title set from Python!',
        element_id=id1,
    )

    df2: pd.DataFrame = pd.read_csv('./sample_data/AAPL-FB-correlation.csv', index_col=0)
    headers = ['date'] + list(df2.columns)
    data2: list = df2.to_records().tolist()
    data2.insert(0, headers)

    id2 = f'{id_base}-2'
    heatmap_react_component2 = HeatmapWidget(
        data=data2,
        title='AAPL vs FB correlation',
        element_id=id2,
    )

    layout = column(heatmap_react_component, heatmap_react_component2)
    show(layout)
