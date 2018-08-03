import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { StandardInput } from './reduxFormHelpers';

const DECIMALS_FOR_LEGEND = 3;

class ColorLegend extends React.Component {
  static propTypes = {
    /**
     * Domain for color scales. [red, white, blue]
     * Examples:
     * [-1, 0, 1] -- [-1 is most red, 0 is most white, 1 is most blue]
     * [-2.5, 2, 10] -- [-2.5 is most red, 2 is most white, 10 is most blue]
     */
    domain: PropTypes.arrayOf(PropTypes.number).isRequired,

    /** If the user overrides the passed in domain, this function is called */
    // TODO: consider making function optional, which would also disable edit mode
    onLegendChange: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      /** when true, show edit form to override color legend */
      editMode: false,
    };
  }

  updateValues = (values) => {
    this.props.onLegendChange(values);
  };

  switchMode = () => {
    this.setState(state => ({ editMode: !state.editMode }));
  };

  render = () => {
    // eslint-disable-next-line react/prop-types
    const { handleSubmit } = this.props;
    const { domain } = this.props;
    const { editMode } = this.state;
    return (
      <div className="container-fluid">
        <div className="col-xs-10">
          <table>
            <tbody>
              <tr>
                <td>
                  <div style={{ backgroundColor: 'red', width: '10px', height: '10px' }} />
                </td>
                <td style={{ paddingLeft: '5px', paddingRight: '5px' }}>&lt;=</td>
                <td>{domain[0].toFixed(DECIMALS_FOR_LEGEND)}</td>
                <td>{editMode && <StandardInput inputName="low" passThrough={{ className: 'input-sm' }} />}</td>
              </tr>
              <tr>
                <td>
                  <div style={{
                    backgroundColor: 'white', width: '10px', height: '10px', border: 'solid 1px #010101',
                  }}
                  />
                </td>
                <td style={{ paddingLeft: '5px', paddingRight: '5px' }}>=</td>
                <td>{domain[1]}</td>
                <td>{editMode && <StandardInput inputName="midpoint" passThrough={{ className: 'input-sm' }} />}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ backgroundColor: 'blue', width: '10px', height: '10px' }} />
                </td>
                <td style={{ paddingLeft: '5px', paddingRight: '5px' }}>&gt;=</td>
                <td>{domain[2].toFixed(DECIMALS_FOR_LEGEND)}</td>
                <td>{editMode && <StandardInput inputName="high" passThrough={{ className: 'input-sm' }} />}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-xs-2">
          { editMode && (
            <button
              className="btn btn-primary"
              onClick={handleSubmit(this.updateValues)}
            >
              <i className="glyphicon glyphicon-ok" />
            </button>
          )}
          <button
            className="btn"
            onClick={this.switchMode}
          >
            {editMode ? <i className="glyphicon glyphicon-remove" /> : <i className="glyphicon glyphicon-pencil" />}
          </button>
        </div>
      </div>
    );
  };
}

const formName = 'colorLegendForm';
const ReduxForm = reduxForm({
  form: formName,
  enableReinitialize: true,
})(ColorLegend);

const mapStateToProps = (state, ownProps) => {
  const { domain } = ownProps;
  const initialValues = {
    low: domain[0].toFixed(DECIMALS_FOR_LEGEND),
    midpoint: domain[1].toFixed(DECIMALS_FOR_LEGEND),
    high: domain[2].toFixed(DECIMALS_FOR_LEGEND),
  };
  return {
    initialValues,
  };
};

export default connect(mapStateToProps)(ReduxForm);
