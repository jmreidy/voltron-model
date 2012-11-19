var Types = require('../index').Types;
var moment = require('moment');

describe('Type Casters', function () {
  describe('int type', function () {
    var Int = Types.Int;
    it('should convert strings to ints', function () {
      assert.strictEqual(Int.cast('1234'), 1234);
    });

    it('should leave ints as they are', function () {
      assert.strictEqual(Int.cast(1234), 1234);
    });

    it('should drop the decimal from Numbers', function () {
      assert.strictEqual(Int.cast(120.7), 120);
    });
  });

  describe('number type', function () {
    var NumberType = Types.Number;
    it('should convert strings to numbers', function () {
      var result = NumberType.cast('1234');
      assert.strictEqual(1234, Number(1234));
    });

    it('should maintain decimals in converted strings', function () {
      assert.strictEqual(NumberType.cast('1234.1'), 1234.1);
    });

    it('should convert ints to numbers', function () {
      var result = NumberType.cast(1234);
      assert.strictEqual(1234, Number(1234));
    });
  });

  describe('string type', function () {
    var StringType = Types.String;
    it('should convert numbers to strings', function () {
      assert.strictEqual(StringType.cast('1234.1'), '1234.1');
    });

    it('should convert ints to strings', function () {
      assert.strictEqual(StringType.cast(1234), '1234');
    });

    it('should leave strings alone', function () {
      assert.strictEqual(StringType.cast('1234'), '1234');
    });
  });

  describe('boolean type', function () {
    var BooleanType = Types.Boolean;
    describe('if the value is a boolean', function () {
      it('should leave the boolean alone', function () {
        assert.strictEqual(BooleanType.cast(true), true);
        assert.strictEqual(BooleanType.cast(false), false);
      });
    });

    describe('if the value is an int', function () {
      it('should convert 1 to true', function () {
        assert.strictEqual(BooleanType.cast(1), true);
      });
      it('should convert 0 to false', function () {
        assert.strictEqual(BooleanType.cast(0), false);
      });
      it('should return undefined for other values', function () {
        assert.strictEqual(BooleanType.cast(1234), undefined);
      });
    });

    describe('if the value is a string', function () {
      it('should convert \'true\' to true', function () {
        assert.strictEqual(BooleanType.cast('true'), true);
      });
      it('should convert \'false\' to false', function () {
        assert.strictEqual(BooleanType.cast('false'), false);
      });
      it('should return undefined for other values', function () {
        assert.strictEqual(BooleanType.cast('foo'), undefined);
      });
    });

  });

  /**
   * don't bother testing all possible formats, since moment
   * handles parsing
   */
  describe('date type', function () {

    var assertDateOk = function (result) {
      assert.strictEqual(result.getFullYear(), 2012);
      assert.strictEqual(result.getMonth(), 4);
      assert.strictEqual(result.getDate(), 1);
    };

    describe('for string values', function () {
      describe('if a custom format is not passed', function () {
        var DateType = Types.Date();
        it('should convert valid string dates into a date', function () {
          var date = 'May 1, 2012';
          var result = DateType.cast(date);
          assertDateOk(result);
        });
      });
      describe('if a single custom format is passed', function () {
        var DateType = Types.Date('YYYY DD MM');
        it('should convert the value according to the format', function () {
          var date = "2012 01 05";
          var result = DateType.cast(date);
          assertDateOk(result);
        });
      });
      describe('if the provided date is not valid', function () {
        var DateType = Types.Date();
        it('should return undefined', function () {
          var date = 'Foo 1, 2012';
          assert.strictEqual(DateType.cast(date), undefined);
        });
      });
    });
    describe('for date values', function () {
      var DateType = Types.Date();
      it('should return the date', function () {
        var date = new Date(2012, 4, 1);
        var result = DateType.cast(date);
        assertDateOk(result);
      });
    });
    describe('for number (unix timestamp) values', function () {
      var DateType = Types.Date();
      it('should return the date', function () {
        var date = (new Date(2012, 4, 1)).value;
        var result = DateType.cast(date);
        assert.strictEqual(date, result.value);
      });
    });
  });

  describe('array type', function () {
    var assertArrayEquality = function (arr1, arr2 ) {
      assert.strictEqual(arr1.join(','), arr2.join(','));
    };

    describe('for string values', function () {
      describe('if a delim is provided', function () {
        var ArrayType = Types.Array(';');
        it('should split the string by the provided delim', function () {
          var value = 'a;b';
          var result = ArrayType.cast(value);
          assertArrayEquality(result, ['a','b']);
        });
      });
      describe('if a delim is not provided', function () {
        var ArrayType = Types.Array();
        it('should split the string with a comma', function () {
          var value = 'a,b';
          var result = ArrayType.cast(value);
          assertArrayEquality(result, ['a','b']);
        });
      });
    });
    describe('for array values', function () {
      var ArrayType = Types.Array();
      it('should return the array', function () {
        var value = [1,2];
        var result = ArrayType.cast(value);
        assertArrayEquality(result, [1,2]);
      });
    });
    describe('for other types', function () {
      var ArrayType = Types.Array();
      it('should return undefined', function () {
        var value = 1234;
        var result = ArrayType.cast(value);
        assert.strictEqual(result, undefined);
      });
    });
  });



});

