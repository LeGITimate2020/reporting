from os import path
from pathlib import Path
from logging import getLogger
import time
import pandas as pd

from bokeh.layouts import column
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import DataTable, TableColumn, Div
from bokeh.palettes import Spectral6
from bokeh.plotting import figure, show, output_file

from pyreporting.widgets import HeatmapWidget, InteractiveTableWidget, InteractivePlotWidget, TableExplorerWidget
from . import Report
from .plotutils import generate_stacked_bar_plot_figure

import numpy as np

from . import ReportTableItem, ReportImageItem, ReportLineGraphItem, ReportFileItem, ReportGraphItem,\
    ReportHeatmapItem, ReportInteractiveTableItem, ReportInteractivePlotItem, ReportTableExplorerItem


logger = getLogger(__name__)


class BokehReportRenderer:

    def render(self, report: Report, output_dir='./report'):

        # Get a unique name for this report
        report_name = report.get_name()

        run_string = time.strftime('%Y%m%d_%H%M%S')

        # Create a sequence of sub-paths to make unique reports by name and time run.
        path = Path('.') / output_dir / report_name / run_string

        files_path = path / 'Files'

        if not path.exists():
            path.mkdir(parents=True)
        assert path.exists(), f"Couldn't create directory {path}"

        files_path.mkdir(parents=True)

        assert files_path.exists(), f"Couldn't create directory {path}"

        plots = []
        for unique_id, item in report.get_uniquely_keyed_items():

            plots.append(self.make_div(f'<h2>{item.name}</h2><br>'))

            if isinstance(item, ReportLineGraphItem):
                plots.append(self.make_plot_from_line_graph_item(item))
            elif isinstance(item, ReportTableExplorerItem):
                plots.append(self.make_table_explorer_item(item))
            elif isinstance(item, ReportHeatmapItem):
                plots.append(self.make_heatmap_item(item))
            elif isinstance(item, ReportInteractiveTableItem):
                plots.append(self.make_interactive_table_item(item))
            elif isinstance(item, ReportInteractivePlotItem):
                plots.append(self.make_interactive_plot_item(item))
            elif isinstance(item, ReportTableItem):
                plots.append(self.make_table_item(item))
            elif isinstance(item, ReportImageItem):
                plots.append(self.make_image_item(item, unique_id, files_path))
            elif isinstance(item, ReportFileItem):
                plots.append(self.make_file_item(item, unique_id, files_path))  # TODO: Not the best unique ID
            elif isinstance(item, ReportGraphItem):
                plots.append(self.make_plot_from_graph_item(item, unique_id, path))

            # Add a description for every item.
            if item.description and len(item.description) > 0:
                plots.append(self.make_div(f'Description:<br>{item.description}<hr width=100%>'))

        output_file(path / "report.html", title=f'{report.get_name()} (Local Report Render)')
        show(column(*plots))  # open a browser

    @staticmethod
    def make_div(text):
        div = Div(text=text)
        return div

    def make_image_item(self, item: ReportImageItem, unique_id, dest_path):
        plot = figure(x_range=(0, 1), y_range=(0, 1))
        file_path = item.copy_to(dest_path, filename=unique_id)
        return self.make_div(f'<img src="file://{file_path.resolve()}" alt="{item.name}">')

    def make_file_item(self, item: ReportFileItem, unique_id, dest_path):
        file_path = item.copy_to(dest_path, filename=unique_id)
        return self.make_div(f"<a href='file://{file_path.resolve()}'>{item.name}</a><br>")

    def make_plot_from_line_graph_item(self, line_graph_item: ReportLineGraphItem):
        df = line_graph_item.as_data_frame()
        return self.make_plot_from_dataframe(df, line_graph_item.get_name())

    def make_plot_from_graph_item(self, item, unique_id, dest_path):
        output_type = item.get_output_type()
        if output_type is ReportGraphItem.LINE:
            p = self.make_plot_from_line_graph_item(item)
        elif output_type is ReportGraphItem.STACKED:
            # TODO: consider http://bokeh.pydata.org/en/latest/docs/gallery/bar_stacked.html
            fig = generate_stacked_bar_plot_figure(
                item.as_data_frame(),
                title=item.get_name(),
                y_label='Value'
            )
            filename = path.join(Path(dest_path).resolve(), f'{unique_id}.png')
            fig.savefig(filename, bbox_inches='tight')
            p = self.make_div(f'<img src="file://{filename}" alt="{item.get_name()}">')
        else:
            raise NotImplementedError(f'Unexpected output type: {output_type}')
        return p

    def make_table_item(self, table_item: ReportTableItem):
        df = table_item.as_data_frame()
        return self.make_table_from_dataframe(df)

    @staticmethod
    def make_plot_from_dataframe(df: pd.DataFrame, name='DataFrame'):
        p1 = figure(x_axis_type="datetime", title=name)
        p1.grid.grid_line_alpha = 0.3
        p1.xaxis.axis_label = df.index.name
        p1.yaxis.axis_label = 'VALUE'

        def datetime(x):
            return np.array(pd.to_datetime(x, infer_datetime_format=True), dtype=np.datetime64)

        palette = Spectral6
        for index, col in enumerate(df.columns):
            color = palette[index % len(palette)]
            p1.line(datetime(df.index.values), df[col], line_color=color, legend=col)
        p1.legend.location = "top_left"
        return p1

    @staticmethod
    def make_table_from_dataframe(df: pd.DataFrame):
        source = ColumnDataSource(df)
        columns = [TableColumn(field=df.index.name, title=df.index.name)]
        for col in df.columns:
            # TODO: If a column contains datetime objects, format to strings here.
            columns.append(TableColumn(field=col, title=col))
        data_table = DataTable(source=source, columns=columns, width=400, height=280)
        return data_table

    @staticmethod
    def make_heatmap_item(item: ReportHeatmapItem):
        id_base = 'heatmap-react-div'

        # get pandas DataFrame of heatmap data
        df = item.as_data_frame()
        headers = ['date'] + list(df.columns)

        # Create a list of lists with headers as the first row and data as every other row, example:
        # data = [
        #     ['date', '30d_apply', '60d_apply'],
        #     ['2017-01-01', 1.2, 3.3],
        #     ['2017-01-11', 1.8, 3.7],
        # ]
        data: list = df.to_records().tolist()
        data.insert(0, headers)

        return HeatmapWidget(
            data=data,
            title=item.name,
            element_id=f'{id_base}-{item.name}',
        )

    @staticmethod
    def make_interactive_table_item(item: ReportTableItem):
        id_base = 'interactive-table-react-div'

        # get pandas DataFrame of heatmap data
        df = item.as_data_frame()
        headers = list(df.columns)

        # Sample: [{'col1': 'row1_value1', 'col2': 'row1_value2'}, {'col1': 'row2_value1', 'col2': 'row2_value2'}]
        data: list = df.to_dict('records')

        return InteractiveTableWidget(
            headers=headers,
            data=data,
            title=item.name,
            width=1200,
            element_id=f'{id_base}-{item.name}',
        )

    @staticmethod
    def make_table_explorer_item(item: ReportTableItem):
        id_base = 'table-explorer-react-div'

        # get pandas DataFrame of heatmap data
        df = item.as_data_frame()
        headers = list(df.columns)

        # Sample: [
        #   ['header1', 'header2', 'header3'],
        #   [11, 21, 31],
        #   [12, 22, 32],
        # ]
        data: list = df.to_records(index=False).tolist()
        data.insert(0, headers)

        return TableExplorerWidget(
            data=data,
            title=item.name,
            width=1200,
            element_id=f'{id_base}-{item.name}',
        )

    @staticmethod
    def make_interactive_plot_item(item: ReportInteractivePlotItem):
        id_base = 'interactive-plot-react-div'

        return InteractivePlotWidget(
            traces=item.item_as_traces(),
            title=item.name,
            width=1200,
            element_id=f'{id_base}-{item.name}',
        )
