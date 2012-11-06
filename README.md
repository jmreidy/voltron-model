[![Build Status](https://travis-ci.org/jmreidy/VoltronModel.png)](https://travis-ci.org/jmreidy/VoltronModel)

# voltron-model: A voltron.io Component

voltron-model provides a framework-agnostic wrapper around Javascript objects,
simplifying their use as Model objects in web applications. While it works best
as part of [voltron.io](https://github.com/jmreidy/voltron.io), it can be used
as a standalone dependency.

voltron-model is heavily inspired by [dandean's tubbs](https://github.com/dandean/tubbs)
and [mde's model](https://github.com/mde/model) (a Geddy framework component).
voltron-model aims to simplify mapping between your application code and data without being
overly intrusive into your overall architecture.

It's important to note that voltron-model does NOT provide integration to your data store;
Models simply wrap a hash of data values. This approach provides you with the flexibility of
integrating with your backend in whatever way you choose. voltron.io does provide a data adapter
through [voltron-adapter](https://github.com/jmreidy/voltron-adapter/tree/0.1.x).

## Defining Models

voltron-models are assembled from three components: a constructor function,
a schema object, and an optional options object. Simply call `VoltronModel.define`
with those arguments, and the resulting object will be a new model function which
is decorated with voltron-model functionality. For example:

```javascript
var VoltronModel = require('voltron-model');

var UserModel = VoltronModel.define(User, { name: {} }, {});

function User () {};

var user = new UserModel();
assert.equal(user.constructor,  User); //ok
```

### Model Constructors

Model constructors can be any old function. voltron-model expects these constructors to be passed
a JavaScript object which contains your internal model data; the assignment of this data object
to the model's internal state is handled by voltron-model itself. The data is managed
on each instance's `_attributes` property, which is not enumerable by default, but is accessible via
`get` and `set` methods (see API below for details).

Beyond the `_attributes` hash, voltron-models also define a `_virtuals`
hash, for tracking state that should not be considered part of the canonical model data. For example,
a model could track `collectionIds` as an array that is stored in the backend, but a given model instance
may have the instantiated `Collection` objects assigned to it. In this case, `_attributes` would include
the `collectionIds`, which `_virtuals` would define `collections`. Accessing the `_virtuals` hash
is possible via `getVirtual` and `setVirtual` calls (see API for details), and virtual fields
can be defined on the schema (see below).

### Model schemas

Schemas define the surface area through which your application code will interact with the data
contained in your voltron-model instances. They provide a declarative way of defining an API
for each of your Model objects. By default, the only enumerable properties on your Model instances
will be the keys defined in the schema hash.

If you provide a blank object as a value for a schema key (as in `name: {}` in the example above),
the key will be added as a property to model instances that simply serves as a passthrough to the
key on the underlying `_attributes` hash. For example, with `name: {}`, calling `model.name` will
get/set from `_attributes.name`.

The following options are available for defining on schema values:

`get: function`: Provide a custom getter for the named property.

`set: function(value)`: Provide a custom setter for the named property.

`fieldName: <field>`: Allows for mapping a key on the schema to a different key on the underlying
`_attributes` hash. For example, `name` above could point to `full_name` on the `_attributes` hash
with the following configuration: `name: { fieldName: 'full_name' }`.

`virtual: <virtualField>`: Define a field as a virtual. Instead of mapping to the `_attributes` hash,
`model.<field>` calls will map to the `_virtuals` hash.

`type: <typeCaster>`: Wraps the field's setter function to cast the provided value into a certain type.
The `typeCaster` can be any object that defines a `cast` method; the `cast` method should return a modified
value to be passed to the setter. For example:
```javascript
var stringType = {
  cast: function (value) {
    return "" + value;
  }
};
```


Deprecated options:

`value: <value>`: Set a default value on model instances. **Warning:** this will overwrite
any value defined on the `_attributes` hash.


### Model options

The third argument is optional but provides configuration of the defined voltron-model. The
following keys are supported:

`primaryKey`: Define the key to be used on the `_attributes` hash to provide the value on
model instances' `id` method. (See API below.) The key should be a string; if the key is
defined as the boolean `false`, the model `id` will return `undefined`. The value set here
is defined on instances as a non-enumerable property `_primaryKey`, which can be changed on
the instance in application code.


## API

### Instance methods

The following instance methods are on the prototype of defined voltron-models:

`get(field)`: Returns the named field from the instance's `_attributes` hash

`set(field, value)`: Writes the value to the named field of the instance's `_attributes` hash

`getVirtual(field)`: Returns the value from the named field of the instance's `_virtuals` hash

`setVirtual(field, value)`: Writes the value to the named field of the instances `_virtuals` hash

`id`: Read-only getter of an id field from the `_attributes` hash

`update(valuesHash)`: For each key of the `valuesHash`, write the value to the model instance,
if that key has been defined via the schema. Before the values are written, the `beforeUpdate`
hook is triggered, and any logic there is performed before execution of the model update. Returns
a promise that resolves on completion of `beforeUpdate` and `update`

`beforeUpdate(fn)`: Define a function to be executed before `update` is called.  This function will be
provided with `update`'s `valuesHash` as an argument, allowing operations on the new `valuesHash`
before it is provided to the model's `update` function.
Useful for cleansing form data or performing validations. Should return a promise on completion.

### Static methods

The following static methods are added to defined voltron-model functions:

`build(array)`: Provided an array of data hashes, instantiate an array of model instances for
each data hash.

## Roadmap

* Add typeCasters for frequently used types: Strings, Arrays, Numbers, Booleans, Dates.
* Configure `beforeUpdate` hook to work with callbacks in addition to promises.
* Note that validation will be added as a separate component of voltron.io, voltron-validator,
or by other library.

## License
The MIT License (MIT)
Copyright &copy; 2012 Justin Reidy, http://rzrsharp.net

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.









