module.exports = Model;

function Model(document, schema) {
  if (!document) {
    document = {};
  }
  Object.defineProperty(this, '_attributes', {
    get: function() {
      return document;
    }
  });
  if (schema) {
    var keys = Object.keys(schema);
    for (var idx in keys) {
      (function(key) {
        var property = schema[key];
        if (!property.get) {
          property.get = function() {
            return this.get(key);
          };
        }
        if (!property.set) {
          property.set = function(val) {
            this.set(key, val);
          };
        }
        if (property.value) {
          this.set(key, property.value);
          delete property.value;
        }
        property.enumerable = true;
        Object.defineProperty(this, key, property);
      }.bind(this))(keys[idx]);
    }
  }
}

Model.define = function(constructor, schema) {
  Fn = function(document) {
    Model.call(this, document, schema);
    constructor.call(this, document);
  };

  Fn.build = Model.build;
  util.inherits(Fn, Model);

  return Fn;
};


Model.build = function(documents) {
  var models = [];
  var count = documents.length;
  for (var i = 0; i < count; i++) {
    models.push(new this(documents[i]));
  }
  return models;
};


Object.defineProperties(Model.prototype, {
  'id': {
    get: function() {
      if (this.attributes) {
        return this.attributes._id;
      } else {
        return undefined;
      }
    }
  },
  'get': {
    value: function(attr) {
      return this._attributes[attr];
    }
  },
  'set': {
    value: function(attr, value) {
      this._attributes[attr] = value;
    }
  },
  'update': {
    value: function(newAttrs) {
      for (var key in Object.keys(this)) {
        if (newAttrs.hasOwnProperty(key)) {
          this[key] = newAttrs[key];
        }
      }
    }
  }
});




