# Created: 5/3/18
import os
from pathlib import Path

from bokeh.core.properties import List, Any

from .react_base import ReactBaseWidget

file_dir = Path(os.path.dirname(os.path.realpath(__file__)))


class InteractiveTableWidget(ReactBaseWidget):
    # The special class attribute ``__implementation__`` should contain a string of JavaScript (or CoffeeScript) code
    # that implements the JavaScript side of the custom extension model or a string name of a JavaScript
    # (or CoffeeScript) file with the implementation.
    __implementation__ = str(file_dir / 'interactive_table.js')

    # Below are all the "properties" for this model. Bokeh properties are class attributes that define the fields (and
    # their types) that can be communicated automatically between Python and the browser. Properties also support type
    # validation. More information about properties in can be found here:
    # https://bokeh.pydata.org/en/latest/docs/reference/core.html#bokeh-core-properties

    headers = List(Any)
    data = List(Any)
