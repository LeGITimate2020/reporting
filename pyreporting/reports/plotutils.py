# Created: 6/4/18
import matplotlib

# Avoid using Xwindows by default by matplotlib:
# https://stackoverflow.com/questions/37604289/tkinter-tclerror-no-display-name-and-no-display-environment-variable
# matplotlib.use() must be called before pylab, matplotlib.pyplot, or matplotlib.backends is imported for the first time
matplotlib.use('Agg')

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
# import statsmodels.api as stats
# from statsmodels.sandbox.regression.predstd import wls_prediction_std
#


def setup_x_axis_with_major_ticks_on_years(ax, year_format='%Y', xdata_format='%Y-%m-%d'):
    """ Setup axis with major ticks on each year, minor ticks on months """
    # set year and month locators
    ax.xaxis.set_major_locator(mdates.YearLocator()) # every year
    ax.xaxis.set_major_formatter(mdates.DateFormatter(year_format))
    ax.xaxis.set_minor_locator(mdates.MonthLocator()) # every month

    # set formatter
    ax.format_xdata = mdates.DateFormatter(xdata_format)


def plot_stacked_bars(data, ax, labels=None, column_color_map=None, bar_width=1.0, bar_alpha=1.0):
    """
    Plot stacked bar chart.
    DataFrame.plot(kind='bar') does not display the x-axis labels correctly.
    https://github.com/pandas-dev/pandas/issues/7612

    :param data: pandas.DataFrame
    :param ax: matplotlib.axis
    :param labels: Labels to use for each column
    :param column_color_map: The colors to use by column.
    :param bar_width: The `bar` argument passed into matplotlib.axis.bar
    :param bar_alpha: The `alpha` argument passed into matplotlib.axis.bar
    :return:
    """
    # get the original list of columns
    if column_color_map is None:
        column_color_map = {}
    if labels is None:
        labels = {}
    data_columns = data.columns

    # keep track of the top (positive values)/bottom (negative values) of the last column; add a column
    data['last-column-top'] = 0.0
    for column in data_columns:
        ax.bar(
            data.index.to_pydatetime(),
            data[column],
            bottom=data['last-column-top'],
            label=labels.get(column),
            color=column_color_map.get(column),
            width=bar_width,
            alpha=bar_alpha
        )
        data['last-column-top'] += data[column]

    # now clean up
    del data['last-column-top']


def plot_positive_and_negative_stacked_bar_chart(data, ax, bar_width=1.0, bar_alpha=1.0):
    """
    Plot stacked bar chart allowing positive and negative values

    :param data: A pandas.DataFrame
    :param ax: Matplotlib axis
    :param bar_width: The `bar` argument passed into `matplotlib.axis.bar()`
    :param bar_alpha: The `alpha` argument passed into `matplotlib.axis.bar()`
    :return: None
    """
    # separate into positive and negative frames to ensure positive and negative values do not over write each other graphically
    df_positive = data.clip(lower=0.0)
    df_negative = data.clip(upper=0.0)

    # for each column, ensure we use the same color map across calls to plot_stacked_bars
    # get the color prop cycle, then map to column
    prop_cycle = plt.rcParams['axes.prop_cycle']
    colors = prop_cycle.by_key()['color']
    column_color_map = {column: color for column, color in zip(data.columns, colors)}

    # now plot the stacked bar chart; only pass in labels for one and not the other to ensure labels do not appear twice
    labels = {column: column for column in data.columns}
    plot_stacked_bars(df_positive, ax, labels=labels, column_color_map=column_color_map, bar_width=bar_width,
                      bar_alpha=bar_alpha)
    plot_stacked_bars(df_negative, ax, column_color_map=column_color_map, bar_width=bar_width, bar_alpha=bar_alpha)


def generate_stacked_bar_plot_figure(data, title, y_label, bar_alpha=1.0, bar_width=1.0, figure_size=(18, 12)):
    """
    Take data, generate stacked bar plot, and return.

    :param data: A pandas data frame of values.
    :param title: The title of the output chart.
    :param y_label: The label for the y-axis
    :param bar_width: The `bar` argument passed into `matplotlib.axis.bar()`
    :param bar_alpha: The `alpha` argument passed into `matplotlib.axis.bar()`
    :param figure_size: The `figsize` argument passed into `matplotlib.pyplot.figure()`
    :return:
    """
    fig = plt.figure(figsize=figure_size)
    ax = fig.add_subplot(111)
    ax.set_title(title)
    ax.set_ylabel(y_label)

    # set major/minor ticking by year
    setup_x_axis_with_major_ticks_on_years(ax)

    # plot stacked bars
    plot_positive_and_negative_stacked_bar_chart(data, ax, bar_width=bar_width, bar_alpha=bar_alpha)

    # plot sum of bars
    summation = np.sum(data, axis=1)
    ax.plot(summation.index.to_pydatetime(), summation, color='black')

    plt.legend(loc='best')
    plt.tight_layout()

    return fig
