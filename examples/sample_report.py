import os
from io import StringIO
from pathlib import Path

import pandas as pd
from bokeh.sampledata.stocks import AAPL, GOOG

from pyreporting.reports import BokehReportRenderer


# TODO: if you want to send email reports, you need to implement your own send_email logic found in email_renderer.py
# from pyreporting.reports import EmailReportRenderer

from pyreporting.reports import Report, ReportLineGraphItem, ReportTableItem, ReportFileItem, ReportImageItem, \
    ReportTextItem, ReportGraphItem, ReportHeatmapItem, ReportInteractivePlotItem, ReportInteractiveTableItem, \
    ReportTableExplorerItem


def make_dataframe():
    aapl = pd.DataFrame(data=AAPL)
    aapl = aapl[['date', 'adj_close']].rename(index=str, columns={'adj_close': 'aapl'})
    aapl = aapl.set_index('date')

    goog = pd.DataFrame(data=GOOG)
    goog = goog[['date', 'adj_close']].rename(index=str, columns={'adj_close': 'goog'})
    goog = goog.set_index('date')

    stocks = goog.join(aapl, how='outer', sort=True)
    stocks.set_index(pd.to_datetime(stocks.index), inplace=True)

    return stocks


def main():
    stocks = make_dataframe()
    report = Report('Sample Report')
    report.add_label("Reports/My Sample Report2")  # Optional

    # Add a line graph item with multiple lines
    report.add_item(ReportLineGraphItem(stocks, "Sample Stock Item", "LOREM IPSUM DOLOR SIT AMET"))

    # Add a Table item.
    report.add_item(ReportTableItem(stocks, "Stock Table", description="LOREM IPSUM"))

    # Get the directory where we are storing the example files.
    file_dir = Path(os.path.dirname(os.path.realpath(__file__))) / 'sample_data'

    # An example with a table created from a csv sitting on the filesystem somewhere.
    example_csv_path = file_dir / "example_csv.csv"
    report.add_item(ReportTableItem.from_csv(example_csv_path,
                                             "Example csv from file",
                                             "An Example CSV created from the filesystem"))

    # A line graph item created from said table
    report.add_item(ReportLineGraphItem.from_csv(example_csv_path, "Line Graph From CSV",
                                                 "Example Line Graph From File System"))

    # An example adding an existing file in the OS somewhere.
    example_filename = file_dir / 'lorem.txt'
    report.add_item(ReportFileItem("Sample File", "Sample File Description Text", open(example_filename, 'r')))

    # An example adding a file in a memory buffer.
    with open(example_filename, 'r') as f:
        lines = f.readlines()
        lines.reverse()
        lines = [line[::-1] for line in lines]  # Reverse every line.
    in_memory_file = StringIO()
    [in_memory_file.write(line) for line in lines]
    report.add_item(
        ReportFileItem("Reversed In_Memory File", "Testing In-memory file ops", in_memory_file, extension=".txt"))

    # Test Text addition.
    free_text = "This is some freetext...\n" * 10
    report.add_item(ReportTextItem("Some Freetext", free_text))

    # Test an image item given as a filename.
    gif_filename = file_dir / 'wink.gif'
    report.add_item(ReportImageItem("You Got This", "An image rendering from disk", gif_filename))

    # Test a line and stacked plot of returns using report graph item
    returns = stocks.pct_change().tail(100)
    for output_type in [ReportGraphItem.LINE, ReportGraphItem.STACKED]:
        report.add_item(
            ReportGraphItem(
                data_frame=returns,
                name=f'Sample {output_type} Chart',
                description=f'Sample {output_type} chart description',
                output_type=output_type
            )
        )

    interactive_table_item = ReportInteractiveTableItem.from_csv(file_dir / 'AAPL-FB-correlation.csv',
                                                                 'Interactive Table for AAPL-FB',
                                                                 'AAPL-FB description')
    report.add_item(interactive_table_item)

    heatmap_item1 = ReportHeatmapItem.from_csv(file_dir / 'AAPL-FB-correlation.csv',
                                               'AAPL-FB',
                                               'AAPL-FB description')
    report.add_item(heatmap_item1)

    report.add_item(ReportHeatmapItem.from_csv(file_dir / 'rolling-dataframe-good.csv',
                                               'rolling-dataframe-good',
                                               'This should be red'))

    report.add_item(ReportInteractivePlotItem.from_csv(file_dir / 'rolling-dataframe-good.csv',
                                                       'interactive-plot',
                                                       'should be some lines'))

    report.add_item(ReportTableExplorerItem.from_csv(file_dir / 'example_csv.csv',
                                                     'table-explorer',
                                                     'Table Explorer example'))

    renderer = BokehReportRenderer()
    renderer.render(report)

    # TODO: if you want to send email reports, you need to implement your own send_email logic found in email_renderer.py
    # sample_email_addresses = ['no-reply@youraddress.com']
    # renderer = EmailReportRenderer()
    # renderer.render(
    #     report=report,
    #     email_addresses=sample_email_addresses,
    #     email_subject=f'Sample report {report.name}',
    # )


if __name__ == '__main__':
    main()
