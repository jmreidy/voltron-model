var VoltronModel = require('../');
var Q = require('q');

describe('VoltronModel', function () {

  describe('generates a Model function that', function () {
    var constructor, Model;

    beforeEach(function () {
      constructor = function () {};
      VoltronModel.applySchemaToModel = sinon.spy(VoltronModel, 'applySchemaToModel');
    });

    afterEach(function () {
      constructor = undefined;
      Model = undefined;
      VoltronModel.applySchemaToModel.restore();
    });

    it('should store a passed-in document object', function () {
      Model = VoltronModel.define(constructor);
      var document = {foo: 'bar'};
      var model = new Model(document);

      assert.deepEqual(model._attributes, document);
    });

    it('should create a blank document object if none is passed in', function () {
      Model = VoltronModel.define(constructor);
      var model = new Model();

      assert.deepEqual(model._attributes, {});
    });

    it('should apply a provided schema', function () {
      var schema = {'field': {}};
      Model = VoltronModel.define(constructor, schema);
      var model = new Model({});

      assert.ok(VoltronModel.applySchemaToModel.calledWith(schema, model));
    });

    it('should not apply a blank schema', function () {
      Model = VoltronModel.define(constructor, undefined);
      var model = new Model({});

      assert.ok(VoltronModel.applySchemaToModel.called === false);
    });

    it('should call the supplied constructor', function () {
      constructor = sinon.spy(constructor);
      Model = VoltronModel.define(constructor);
      var document = {};
      var model = new Model(document);

      assert.ok(constructor.calledOnce);
      assert.ok(constructor.calledWith(document));
      assert.ok(constructor.calledOn(model));
    });
  });

  describe('#define', function () {
    var constructor, Model;

    beforeEach(function () {
      constructor = function () {};
      Model = VoltronModel.define(constructor);
    });

    it('should add a static \'build\' function to generated Model', function () {
      assert.ok(Model.build);
    });

    it('should set generated models to be instances of Contructor', function () {
      assert.equal((new Model()).constructor,  constructor);
    });

    it('should optionally define a primaryKey on the generated prototype', function () {
      Model = VoltronModel.define(constructor, {}, { primaryKey: '_id' });

      assert.equal(Model.prototype._primaryKey, '_id');
      assert.ok(Object.keys(Model.prototype).indexOf('_primaryKey') === -1);
    });


  });


  describe('#applySchemaToModel', function () {
    var Model, model;

    beforeEach(function () {
      Model = VoltronModel.define(function () {});
      model = new Model();
    });

    it('defines enumerable fields on generated Models', function () {
      var schema = {
        name: {},
        age: {}
      };
      VoltronModel.applySchemaToModel(schema, model);

      assert.ok(model.hasOwnProperty('name'));
      assert.ok(model.hasOwnProperty('age'));
      assert.ok(model.hasOwnProperty('place') === false);
    });

    it('provides pass-through accessors for named fields', function () {
      model = new Model({name: 'Old Joe', occupation: 'looper'});
      var schema = {
        name: {}
      };
      VoltronModel.applySchemaToModel(schema, model);

      //getter
      assert.equal(model.name, 'Old Joe');

      //setter
      model.name = 'Young Joe';
      assert.equal(model._attributes.name, 'Young Joe');

      //properties not defined in schema don't exist
      assert.ok(model.hasOwnProperty('occupation') === false);

      //schema is unmodified
      assert.deepEqual(schema.name, {});
    });

    it('defines default values for fields with \'value\' attribute', function () {
      var schema = {
        name: {
          value: 'Default'
        },
        city: {}
      };
      VoltronModel.applySchemaToModel(schema, model);

      assert.equal(model.city, undefined);
      assert.equal(model.name, 'Default');
    });

    it('defines setters for fields with \'set\' attribute', function () {
      var setterFunction = sinon.spy();
      var schema = {
        name: {
          set: setterFunction
        }
      };

      VoltronModel.applySchemaToModel(schema, model);

      model.name = 'foo';

      assert.ok(setterFunction.calledOnce);
      assert.ok(setterFunction.calledWith('foo'));
    });

    it('defines getters for fields with \'get\' attribute', function () {
      var getter = sinon.spy();
      var schema = {
        name: {
          get: getter
        }
      };
      VoltronModel.applySchemaToModel(schema, model);
      model.name;

      assert.ok(getter.calledOnce);
    });
  });

  describe('VoltronModel.prototype', function () {
    var model, Model;

    beforeEach(function () {
      var constructor = function ModelFn () {};
      Model = VoltronModel.define(constructor, {
        name: {},
        age: {}
      });
      model = new Model({name: 'Abe', age: 82});
    });

    it('should have a \'set\' function that writes to _attributes', function () {
      model.set('name', 'Boy Blue');

      assert.equal(model._attributes.name, 'Boy Blue');
    });

    it('should have a \'get\' function that gets from _attributes', function () {
      assert.equal(model.get('name'), model._attributes.name);
    });

    it('should have an inspect function that writes the instance to string', function () {
      var inspection = model.inspect();

      assert.ok(inspection.match(/Instance of function ModelFn/));
      assert.ok(inspection.match(/name\: Abe/));
    });

    describe('the update function', function () {

      it('should return a promise', function (done) {
        model.update()
          .then(function () {
            assert.ok('Promise is returned');
          }).nend(done);
      });

      it('should write to enumerable accesors from a provided hash', function (done) {
        model.update({name: 'Seth', age: 25, gender: 'male'})
          .then(function () {
            assert.equal(model.name, 'Seth');
            assert.equal(model.age, 25);

            //hash keys not included in schema aren't written
            assert.ok(model._attributes.hasOwnProperty('gender') === false);
            assert.ok(model.hasOwnProperty('gender') === false);
          }).nend(done);
      });

      describe('if a beforeUpdate hook exists', function () {
        var hook;

        beforeEach(function () {
          hook = sinon.spy(function (attrs) {
            attrs.name = 'Bob';
            return Q.when();
          });
          sinon.spy(model, 'update');
          Model.prototype.beforeUpdate = hook;
        });

        afterEach(function () {
          model.update.restore();
          Model.prototype.beforeUpdate = undefined;
        });

        it('should call the hook before calling update', function (done) {
          model.update({name: 'Seth', age: 25, gender: 'male'})
            .then(function () {
              assert.ok(hook.calledOnce);
              assert.ok(model.update.calledWith({name: 'Bob', age: 25, gender: 'male'}));
            }).nend(done);
        });

        it('should update as expected', function (done) {
          model.update({name: 'Seth', age: 25, gender: 'male'})
            .then(function () {
              assert.equal(model.name, 'Bob');
            }).nend(done);
        });

      });

    });

    describe('\'id\' getter', function () {

      it('should return a defined primaryKey value from _attributes', function () {
        var constructor = function ModelFn () {};
        Model = VoltronModel.define(constructor, {
          name: {},
          age: {}
        }, {
          primaryKey: '_id'
        });
        model = new Model({_id: 5, name: 'Abe', age: 82});

        assert.equal(model.id, 5);
      });

      it('should default to reading \'id\' if primaryKey is not specified', function () {
        var constructor = function ModelFn () {};
        Model = VoltronModel.define(constructor, {
          name: {},
          age: {}
        }, {});
        model = new Model({id: 10, name: 'Abe', age: 82});

        assert.equal(model.id, 10);
      });

      it('should return undefined if the primaryKey is false', function () {
        var constructor = function ModelFn () {};
        Model = VoltronModel.define(constructor, {
          name: {},
          age: {}
        }, {
          primaryKey: false
        });

        model = new Model({id: 10, name: 'Abe', age: 82});

        assert.equal(model.id, undefined);
      });

    });
  });




});
