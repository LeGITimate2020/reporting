// The "core/properties" module has all the property types
import * as p from 'core/properties';

import {empty, div} from 'core/dom';

// We will subclass in JavaScript from the same class that was subclassed from in Python
import {InputWidget, InputWidgetView} from 'models/widgets/input_widget';

// This model will actually need to render things, so we must provide
// view. The LayoutDOM model has a view already, so we will start with that
export class TableExplorerWidgetView extends InputWidgetView {

  initialize(options) {
    super.initialize(options);
    empty(this.el);
    const reactDiv = div({id: this.model.element_id});
    this.el.appendChild(reactDiv);
    const initializeReact = () => {
      // Must delay-load React because the reactDiv hasn't been written to the DOM yet
      pyreporting.initializeBokehTableExplorer({model: this.model});
    };
    setTimeout(initializeReact, 0);
  }
}

export class TableExplorerWidget extends InputWidget {
  static initClass() {

    // If there is an associated view, this is boilerplate.
    this.prototype.default_view = TableExplorerWidgetView;

    // The ``type`` class attribute should generally match exactly the name
    // of the corresponding Python class.
    this.prototype.type = "TableExplorerWidget";

    // The @define block adds corresponding "properties" to the JS model. These
    // should basically line up 1-1 with the Python model class. Most property
    // types have counterparts, e.g. bokeh.core.properties.String will be
    // p.String in the JS implementation. Where the JS type system is not yet
    // as rich, you can use p.Any as a "wildcard" property type.
    this.define({
      data: [p.Any,],
      element_id: [p.String,],
    });
  }
}

TableExplorerWidget.initClass();
