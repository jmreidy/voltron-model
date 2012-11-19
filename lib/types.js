var moment = require('moment');
var isArray = Array.isArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};

module.exports = {

  Int: {
    cast: function (value) {
      return parseInt(value, 10);
    }
  },

  Number: {
    cast: function (value) {
      return Number(value);
    }
  },

  String: {
    cast: function (value) {
      return String(value);
    }
  },

  Boolean: {
    cast: function (value) {
      var val;
      switch (typeof value) {
        case 'string':
          if (value === 'true') {
            val = true;
          }
          else if (value === 'false') {
            val = false;
          }
          break;
        case 'number':
          if (value === 1) {
            val = true;
          }
          else if (value === 0) {
            val = false;
          }
          break;
        case 'boolean':
          val = value;
          break;
      }
      return val;
    }
  },

  /**
   * @param string customFormat - values passed to moment.js for
   * date parsing.
   */
  Date: function (customFormat) {
    return {
      cast: function (value) {
        var date;
        if (typeof value === 'number') {
          date = moment.unix(value);
        }
        else {
          if (!customFormat) {
            date = moment(value);
          }
          else {
            date = moment(value, customFormat);
          }
        }

        if (date.isValid()) {
          return date.toDate();
        }
        else {
          return undefined;
        }
      }
    };
  },

  /*
   * @param string delim - User provided array delimeter
   * if the provided value is a string. Defaults to ','
   */
  Array: function (delim) {
    delim || (delim = ',');
    return {
      cast: function (value) {
        if (isArray(value)) {
          return value;
        }
        else if (typeof value === 'string') {
          return value.split(delim);
        }
        else {
          return undefined;
        }
      }
    };
  }
};

