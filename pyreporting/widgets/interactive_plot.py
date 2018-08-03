# Created: 5/3/18
import os
from pathlib import Path

from bokeh.core.properties import List, Any

from .react_base import ReactBaseWidget

file_dir = Path(os.path.dirname(os.path.realpath(__file__)))


class InteractivePlotWidget(ReactBaseWidget):
    __implementation__ = str(file_dir / 'interactive_plot.js')

    # List of traces. Example:
    # traces = [
    #     { 'name': 'my trace 1', 'x': [1, 2, 3], 'y': [10, 20, 30] },
    #     { 'name': 'my trace 2', 'x': [1, 3, 9], 'y': [2, 5, -8] },
    # ]
    traces = List(Any)
