import React from 'react';
import { Field } from 'redux-form';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import LabelFormEditor from './LabelFormEditor';

const renderFieldWithInlineErrors = (field) => {
  const {
    input,
    label,
    type,
    placeholder,
    className,
    onKeyDown,
    tabIndex,
    meta: { touched, error },
    disabled,
    microcopy,
  } = field;

  if (type === 'checkbox') {
    return (
      <div className="form-group form-inline form-check">
        <label htmlFor={input.name} className="form-check-label">
          <input
            {...input}
            type={type}
            placeholder={placeholder}
            className="form-check-input"
            tabIndex={tabIndex}
            disabled={disabled}
          />
          {label}
          {microcopy && (<span className="microcopy">{microcopy}</span>)}
        </label>
        {touched && error && <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}
      </div>
    );
  }
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={input.name}>
          {label}
          {microcopy && (<span className="microcopy">{microcopy}</span>)}
        </label>
      )}
      <div>
        <input
          {...input}
          onKeyDown={onKeyDown}
          type={type}
          placeholder={placeholder}
          className={`${className} form-control`}
          tabIndex={tabIndex}
          disabled={disabled}
        />
        {touched && error && <span style={{ color: 'red', fontWeight: 'bold' }}>{error}</span>}
      </div>
    </div>
  );
};

export const StandardInput = ({
  inputName = '',
  friendlyName = '',
  inputType = 'text',
  passThrough = {},
}) => (
  <Field
    component={renderFieldWithInlineErrors}
    name={inputName}
    label={friendlyName}
    type={inputType}
    className="form-control"
    {...passThrough}
  />
);

export const InlineInput = ({
  inputName = '',
  placeholder = '',
  inputType = 'text',
  customControls = null,
  passThrough = {},
}) => {
  _.extend(passThrough, { placeholder });
  return (
    <div className="form-group">
      <Field
        {...passThrough}
        component={renderFieldWithInlineErrors}
        name={inputName}
        type={inputType}
        className={`form-control input-sm ${_.get(passThrough, 'className')}`}
      />
      {customControls}
    </div>
  );
};


const textAreaWithErrors = (field) => {
  const {
    meta: { touched, error },
    input,
    ...passThrough
  } = field;
  return (
    <div>
      <textarea {...input} {...passThrough} />
      {touched && error && <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}
    </div>
  );
};


export const StandardTextArea = ({
  inputName = '',
  friendlyName = '',
  customControls = null,
  // TODO: consolidate the microcopy API. when the Field component is renderFieldWithInlineErrors
  // it's in passThrough, for others, 'microcopy' is in the root options map.
  microcopy = '',
  passThrough = {},
}) => {
  return (
    <div className="form-group">
      <label htmlFor={inputName}>
        {friendlyName}
        {microcopy && (<span className="microcopy">{microcopy}</span>)}
      </label>
      <Field component={textAreaWithErrors} name={inputName} className="form-control" {...passThrough} />
      { customControls }
    </div>
  );
};

export const StandardSelect = ({
  selectName = '',
  friendlyName = '',
  optionValues = [],
  optionFriendlyNames = [],
  onChange = null,
  microcopy = '',
  allowBlank = true,
  passThrough = {},
}) => (
  <div className="form-group">
    <label htmlFor={selectName}>
      {friendlyName}
      {microcopy && (<span className="microcopy">{microcopy}</span>)}
    </label>
    <div>
      <Field name={selectName} component="select" className="form-control" onChange={onChange} {...passThrough}>
        { allowBlank ? (<option />) : '' }
        {
          optionFriendlyNames.map((optionFriendlyName, index) => <option key={index} value={optionValues[index]}>{optionFriendlyName}</option>)
        }
      </Field>
    </div>
  </div>
);

export const InlineSelect = ({
  selectName = '',
  placeholder = '',
  label = '',
  optionValues = [],
  optionFriendlyNames = [],
  onChange = null,
  allowBlank = true,
  passThrough = {},
}) => {
  _.extend(passThrough, { placeholder });
  return (
    <div className="form-group">
      <div>
        {label && (
          <label htmlFor={selectName}>{label}: </label>
        )}
        <Field
          {...passThrough}
          name={selectName}
          component="select"
          onChange={onChange}
          className={`form-control input-sm ${_.get(passThrough, 'className')}`}
        >
          { allowBlank ? (<option />) : '' }
          {
            optionFriendlyNames.map((optionFriendlyName, index) => <option key={index} value={optionValues[index]}>{optionFriendlyName}</option>)
          }
        </Field>
      </div>
    </div>
  );
};

const renderStandardLabels = (field) => {
  const { input, suggestions } = field;
  return (
    <div className="form-group">
      <label htmlFor={input.name}>Labels:</label>

      <LabelFormEditor
        name={input.name}
        labels={input.value || []}
        onChange={input.onChange}
        suggestions={suggestions}
      />
      <br />
    </div>
  );
};

export const StandardLabels = ({ name, suggestions }) => {
  return (
    <Field
      name={name}
      component={renderStandardLabels}
      suggestions={suggestions}
    />
  );
};

/**
 *
 * @param props is a superset of the field object from Redux-form
 */
const renderDatePicker = (props) => {
  const { input, label } = props;
  let { dateFormat } = props;
  dateFormat = dateFormat || 'MM/DD/YYYY';
  // the 3rd-party DatePicker requires the value prop to be a date string, not a
  // moment or Date object.
  if (typeof (input.value) !== 'string') {
    input.value = moment(input.value).format(dateFormat);
  }
  return (
    <div className="form-group">
      <label htmlFor={input.name}>{label || 'Date'}:</label>
      <div>
        <DatePicker
          maxDate={moment()}
          peekNextMonth
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          {...input}
          {...props}
          dateFormat={dateFormat}
          selected={input.value ? moment(input.value) : null}
          className="form-control"
        />
      </div>
    </div>
  );
};

/**
 *
 * @param props is a superset of the field object from Redux-form
 */
const renderInlineDatePicker = (props) => {
  const { input, className, placeholder } = props;
  let { dateFormat } = props;
  dateFormat = dateFormat || 'MM/DD/YYYY';
  // the 3rd-party DatePicker requires the value prop to be a date string, not a
  // moment or Date object.
  if (typeof (input.value) !== 'string') {
    input.value = moment(input.value).format(dateFormat);
  }
  return (
    <div className="form-group">
      <DatePicker
        maxDate={moment()}
        peekNextMonth
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        {...input}
        {...props}
        placeholderText={placeholder}
        dateFormat={dateFormat}
        selected={input.value ? moment(input.value) : null}
        className={`form-control input-sm ${className}`}
      />
    </div>
  );
};

export const StandardDatePicker = ({ name, label, onChange }) => {
  return (
    <Field
      name={name}
      component={renderDatePicker}
      label={label}
      onChange={onChange}
    />
  );
};

export const InlineDatePicker = ({
  name, placeholder, onBlur, maxDate = null,
} = {}) => {
  return (
    <Field
      name={name}
      component={renderInlineDatePicker}
      placeholder={placeholder}
      className="input-narrow"
      onBlur={onBlur}
      maxDate={maxDate}
    />
  );
};


export const RangeSlider = (props) => {
  const {
    input, label, min, max, step,
  } = props;
  return (
    <div>
      <div className="form-group">
        {label && (<label htmlFor={input.name}>{label}:</label>)}
        <div>
          <input type="range" min={min} max={max} step={step} {...input} />
          <span>{input.value}%</span>
        </div>
      </div>
    </div>
  );
};

export const DropDownList = ({ name, friendlyName, values }) => {
  return (
    <StandardSelect
      selectName={name}
      friendlyName={friendlyName || name}
      optionValues={values}
      optionFriendlyNames={values}
      allowBlank
    />
  );
};
