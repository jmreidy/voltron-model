## 0.1.3

* Significant refactoring of internal code for improved comprehension

* Virtual support: `getVirtual` and `setVirtual` added to `Model.prototype`, which
write to `_virtuals` hash instead of `_attributes`. Added `virtual: <fieldName>` to
schemas to automatically map Model fields to virtual writes.

* Began adding `type` support to schemas; types are objects with a `cast` function that
automatically cast values in setters before writing to `_attributes` hash.
