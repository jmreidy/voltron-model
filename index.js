var VoltronHooks = require('voltron-hooks');
var Q = require('q');

module.exports = Model;

function Model(document, schema) {
  if (!document) {
    document = {};
  }
  var virtuals = {};
  Object.defineProperty(this, '_attributes', {
    get: function () {
      return document;
    }
  });
  Object.defineProperty(this, '_virtuals', {
    get: function () {
      return virtuals;
    }
  });
  if (schema) {
    Model.applySchemaToModel(schema, this);
  }
}

Model.define = function (constructor, schema, options) {
  var Fn = function (document) {
    Model.call(this, document, schema);
    constructor.call(this, document);
  };

  Fn.build = Model.build;
  Fn.prototype = Object.create(Model.prototype, {
    constructor: {
      value: constructor,
      enumerable: false
    }
  });

  VoltronHooks.defineBeforeHook(Fn.prototype, 'update');

  if (options && options.hasOwnProperty('primaryKey')) {
    Object.defineProperty(Fn.prototype, '_primaryKey', {
        value: options.primaryKey,
        enumerable: false
    });
  }


  return Fn;
};


Model.applySchemaToModel = function (schema, model) {
  Object.keys(schema).forEach(function (key) {
    var schemaProp = schema[key];
    var property = {};
    var modelKey;

    if (schemaProp.fieldName) {
      modelKey = schemaProp.fieldName;
    }
    else {
      modelKey = key;
    }

    if (schemaProp.virtual) {
      var virtualField = schemaProp.virtual;
      property.get = function () {
        return model.getVirtual(virtualField);
      };
      property.set = function (value) {
        model.setVirtual(virtualField, value);
      };
    }
    else {
      if (!schemaProp.get) {
        property.get = function () {
          return model.get(modelKey);
        };
      }
      else {
        property.get = schemaProp.get;
      }

      if (!schemaProp.set) {
        property.set = function (val) {
          model.set(modelKey, val);
        };
      }
      else {
        property.set = schemaProp.set;
      }

      if (schemaProp.type) {
        var _set = property.set;
        property.set = function (value) {
          value = schemaProp.type.cast(value);
          _set.call(this, value);
        };
      }

      if (schemaProp.value) {
        model.set(modelKey, schemaProp.value);
      }

    }
    property.enumerable = true;
    Object.defineProperty(model, key, property);
  });
};

Model.build = function (documents) {
  var models = [];
  var count = documents.length;
  for (var i = 0; i < count; i++) {
    models.push(new this(documents[i]));
  }
  return models;
};


Object.defineProperties(Model.prototype, {
  id: {
    get: function () {
      var key;
      if (this._primaryKey) {
        key = this._primaryKey;
      }
      else if (this._primaryKey === false) {
        key = undefined;
      }
      else {
        key = 'id';
      }

      if (this._attributes) {
        return this._attributes[key];
      } else {
        return undefined;
      }
    }
  },
  get: {
    value: function (attr) {
      return this._attributes[attr];
    }
  },
  set: {
    value: function (attr, value) {
      this._attributes[attr] = value;
    }
  },
  getVirtual: {
    value: function (attr) {
      return this._virtuals[attr];
    }
  },
  setVirtual: {
    value: function (attr, value) {
      this._virtuals[attr] = value;
    }
  },
  update: {
    value: function (newAttrs) {
      var self = this;
      if (newAttrs) {
        Object.keys(this).map(function (key) {
          if (newAttrs.hasOwnProperty(key)) {
            self[key] = newAttrs[key];
          }
        });
      }
      return Q.when(this);
    }, writable: true
  },
  inspect: {
    value: function () {
      var self = this;
      var output = 'Instance of ' + this.constructor + '\n';
      Object.keys(this).map(function (key) {
        output += '' + key + ': ' + self[key] + '\n';
      });
      return output;
    }
  }
});

