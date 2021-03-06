import React from 'react';
import ValidationError from '../ValidationError';
const moment = require('moment');

class Date extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      value: props.value || undefined
    }
  }

  getValue() {
    return Promise.resolve(this.state.value);
  }

  validate(value) {
    const { name,
      required, requiredMsg,
      minDate, minDateMsg,
      maxDate, maxDateMsg } = this.props;

    // Normalize value
    if (value === "" || value === undefined || value === null) {
      value = null;
      if (required) {
        return Promise.reject(new ValidationError(this, name, requiredMsg || "Value is required"));
      } else {
        return Promise.resolve(null);
      }
    }

    const date = moment(value).toDate();

    return Promise.resolve(date);
  }

  _onChange(e) {
    this.setState({
      value: e.target.value
    });
  }

  render() {
    const { className, ...other } = this.props;

    return (
      <input {...other} type="date" onChange={this._onChange.bind(this)}/>
    );
  }
}

export default Date;
