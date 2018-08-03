# Created: 5/3/18
import os
from pathlib import Path

from bokeh.core.properties import String
from bokeh.models import InputWidget

# TODO: make sure this path works with pip install
bundles_dir = Path(os.path.dirname(os.path.realpath(__file__))) / '../../pyreportingJs/build/'
bundles_dir = Path(os.path.realpath(bundles_dir))
bundle_base_name = 'pyreporting'


class ReactBaseWidget(InputWidget):
    '''
    This includes the basic bundles and element_id. Subclasses will just need to fill in:
    1) __implementation__
    2) properties
    '''
    __javascript__ = [
        # str(bundles_dir / 'vendor.js'),  # Contains react, jQuery, etc -- must be included *before* pyreportingJs

        # Contains just the components specifically included in the pyreportingJs bundle
        str(bundles_dir / f'{bundle_base_name}.js'),
    ]
    __css__ = [
        str(bundles_dir / f'{bundle_base_name}.css')
    ]

    element_id = String(default='react-app', help='The ID for the div to create')
