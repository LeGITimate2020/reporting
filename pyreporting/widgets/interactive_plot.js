// The "core/properties" module has all the property types
import * as p from 'core/properties';

import {empty, div} from 'core/dom';

// We will subclass in JavaScript from the same class that was subclassed from in Python
import {InputWidget, InputWidgetView} from 'models/widgets/input_widget';

// This model will actually need to render things, so we must provide
// view. The LayoutDOM model has a view already, so we will start with that
export class InteractivePlotWidgetView extends InputWidgetView {

  initialize(options) {
    super.initialize(options);
    empty(this.el);
    const reactDiv = div({id: this.model.element_id});
    this.el.appendChild(reactDiv);
    const initializeReact = () => {
      // Must delay-load React because the reactDiv hasn't been written to the DOM yet
      pyreporting.initializeBokehInteractivePlot({model: this.model});
    };
    setTimeout(initializeReact, 0);
  }
}

export class InteractivePlotWidget extends InputWidget {
  static initClass() {

    this.prototype.default_view = InteractivePlotWidgetView;

    this.prototype.type = "InteractivePlotWidget";

    this.define({
      traces: [p.Any,],
      element_id: [p.String,],
    });
  }
}

InteractivePlotWidget.initClass();
