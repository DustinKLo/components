import React from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import {THEMECONFIG } from 'constants/Config';

const progressBarStyle = {
  width : "75%",
  margin : '30px auto',
  height : '20px'
};

const BoxTitleStyle = {
  margin: '0 auto',
  textAlign: 'left',
  fontSize: '24px',
  fontWeight: 500,
  color: '#37495f',
  letterSpacing : '-0.7px',
  padding : '10px 14px 0',
};

export const BoxTitle = (props) => (
  <div style={ Object.assign(BoxTitleStyle, props.style )}>
    {props.title}
  </div>
);

BoxTitle.defaultProps = {
  style : {}
};

export const ProgressBar = (props) => (
  <div>
    <BoxTitle title={props.title} />
    <LinearProgress
      mode="indeterminate"
      style={progressBarStyle}
    />
  </div>
);

export const NoContentWarning = (props) => (
  <div className="alert alert-warning text-center" role="alert">
    <strong>{props.message}</strong>
  </div>
);

export const commaNumberFormatter = (num) => {
  return new Intl.NumberFormat().format(num);
};

export const largeNumberFormatter = (num, digits)  => {
  let units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
    decimal;

  for(let i=units.length-1; i>=0; i--) {
    decimal = Math.pow(1000, i+1);

    if(num <= -decimal || num >= decimal) {
      return +(num / decimal).toFixed(digits) + units[i];
    }
  }
  return num;
};

export const numericSort = (fieldname) => {
  return (a, b, order) => {
    if (order === 'desc') {
      return Number(b[fieldname]) - Number(a[fieldname]);
    } else {
      return Number(a[fieldname]) - Number(b[fieldname]);
    }
  }
};

