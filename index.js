var VoltronHooks = require('voltron-hooks');
var Q = require('q');

module.exports = Model;
Model.Types = require('./lib/types');

var isArray = Array.isArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};

var updateAttributes = function (self, newAttrs) {
  if (newAttrs) {
    Object.keys(self).map(function (key) {
      if (newAttrs.hasOwnProperty(key)) {
        self[key] = newAttrs[key];
      }
    });
  }
};
var updateId = function (model, Model, item) {
  if (Model.prototype._primaryKey) {
    var pk = Model.prototype._primaryKey;
    if (item.id) {
      model.set(pk, item.id);
    }
  }
};

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
  Fn.cast = Model.cast;
  Fn.fields = Model.fields(schema);

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
  Object.defineProperty(model, 'fieldNameFor', {
    value: function (key) {
      var prop = schema[key];
      if (prop) {
        if (prop.virtual) {
          key = undefined;
        }
        else if (prop.fieldName) {
          key = prop.fieldName;
        }
      }
      else {
        key = undefined;
      }
      return key;
    }
  });

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

      if (schemaProp.value) {
        model.set(modelKey, schemaProp.value);
      }
    }

    if (schemaProp.type) {
      var _set = property.set;
      property.set = function (value) {
        value = schemaProp.type.cast(value);
        _set.call(this, value);
      };
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

/*
 * Allow voltron-models to serve as type-casters
 * in other model schemas
 */
Model.cast = function (models) {
  var Self = this;
  var castModel = function (item) {
    var model = new Self();
    updateAttributes(model, item);
    updateId(model, Self, item);
    return model;
  };

  if (isArray(models)) {
    models = models.map(castModel);
  }
  else {
    models = castModel(models);
  }

  return models;
};

/**
 * Returns a function that iterates
 * over the properties of a schema, listing
 * property names on the _attributes object
 */
Model.fields = function (schema) {
  return function () {
    var pk = this.prototype._primaryKey;
    var fields = [];
    Object.keys(schema)
      .forEach(function (key) {
        var schemaProp = schema[key];
        if (schemaProp.fieldName) {
          key = schemaProp.fieldName;
        }
        else if (schemaProp.virtual) {
          key = undefined;
        }
        if (key) {
          fields.push(key);
        }
      });
    if (pk) {
      fields.push(pk);
    }
    return fields;
  };
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
      updateAttributes(this, newAttrs);
      return Q.when(this);
    }, writable: true
  },
  inspect: {
    value: function () {
      var output = '';
      var constructorName = this.constructor
        .toString()
        .match(/function\s?(\w+)/)[1];
      output += constructorName + ' { \n';
      if (this.id) {
        output += '  id: ' + this.id + '\n';
      }
      Object.keys(this).map(function (key) {
        output += '  ' + key + ': ' + this[key] + '\n';
      }.bind(this));
      output = output.replace(/\n$/,' }');
      return output;
    }
  },
  toJSON: {
    value: function () {
      var output = { id: this.id };
      Object.keys(this).map(function (key) {
        output[key] = this[key];
      }.bind(this));
      return output;
    }
  }
});

