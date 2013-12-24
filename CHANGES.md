## 0.1.3

* Significant refactoring of internal code for improved comprehension

* Virtual support: `getVirtual` and `setVirtual` added to `Model.prototype`, which
write to `_virtuals` hash instead of `_attributes`. Added `virtual: <fieldName>` to
schemas to automatically map Model fields to virtual writes.

* Began adding `type` support to schemas; types are objects with a `cast` function that
automatically cast values in setters before writing to `_attributes` hash.

## 0.1.4

* Update Q dependency

* Add type cast support for ints, numbers, strings, booleans, arrays, and dates

## 0.1.5

* Add type-casting support for Voltron Model instances

## 0.1.6

* Fix bug in which virtual setters were not properly casting (see 0.1.5)

## 0.1.7

* Add ability to pull named scheme fields from voltron-models.

## 0.1.8

* Update package dependencies

* Making Voltron Models into EventEmitters

## 0.1.9

* Make `updateId` method callable for all model instances

## 0.1.10, 0.1.11

* Update dependencies

## 0.1.12

* Add `whitelist` option for updating attributes
