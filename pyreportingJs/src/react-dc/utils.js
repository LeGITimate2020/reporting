export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));

export const intersect = (obj1, obj2) => {
  const o = {};
  Object.entries(obj2).forEach((key, val) => {
    if (obj1.hasOwnProperty(key)) {
      o[key] = val;
    }
  });
  return o;
};

// map over the object and make sure each value is a React PropType
const extractPropTypes = props => Object.entries(props).reduce((acc, [prop, val]) => {
  acc[prop] = val.propTypes || val;
  return acc;
}, {});

export const withProps = propTypes => Component => class extends Component {
  static propTypes = {
    ...Component.propTypes,
    ...extractPropTypes(propTypes),
  };

  configure() {
    // If the component has defined a special `configure` method, then call that first.
    if (super.configure) {
      super.configure();
    }
    Object.entries(this.props).forEach(([prop, val]) => {
      if (propTypes[prop]) {
        if (propTypes[prop].setter) {
          // if there is a setter function for a chart property, use the setter
          propTypes[prop].setter(this.chart[prop], val);
        } else {
          // Set the value
          this.chart[prop](val);
        }
      }
    });
  }
};
