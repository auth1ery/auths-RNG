/**
 * Advanced Polyfills Library
 * Comprehensive ES5/ES6+ polyfills for legacy browser support
 * @version 2.0.0
 * @license MIT
 */

(function(global, document) {
  'use strict';

  var supportsDefineProperty = (function() {
    try {
      Object.defineProperty({}, 'x', {});
      return true;
    } catch (e) {
      return false;
    }
  })();

  var defineProperty = supportsDefineProperty ? Object.defineProperty : function(obj, prop, descriptor) {
    if (descriptor.get || descriptor.set) {
      throw new TypeError('Getters & setters not supported on this browser');
    }
    if (descriptor.hasOwnProperty('value')) {
      obj[prop] = descriptor.value;
    }
    return obj;
  };

  // ==================== Array Polyfills ====================

  if (!Array.prototype.forEach) {
    defineProperty(Array.prototype, 'forEach', {
      value: function(callback, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.forEach called on null or undefined');
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var k = 0;
        
        while (k < len) {
          if (k in O) {
            callback.call(thisArg, O[k], k, O);
          }
          k++;
        }
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.map) {
    defineProperty(Array.prototype, 'map', {
      value: function(callback, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.map called on null or undefined');
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var A = new Array(len);
        var k = 0;
        
        while (k < len) {
          if (k in O) {
            A[k] = callback.call(thisArg, O[k], k, O);
          }
          k++;
        }
        return A;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.filter) {
    defineProperty(Array.prototype, 'filter', {
      value: function(callback, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.filter called on null or undefined');
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var res = [];
        var k = 0;
        
        while (k < len) {
          if (k in O) {
            var kValue = O[k];
            if (callback.call(thisArg, kValue, k, O)) {
              res.push(kValue);
            }
          }
          k++;
        }
        return res;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.reduce) {
    defineProperty(Array.prototype, 'reduce', {
      value: function(callback, initialValue) {
        if (this == null) {
          throw new TypeError('Array.prototype.reduce called on null or undefined');
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var k = 0;
        var accumulator;
        
        if (arguments.length >= 2) {
          accumulator = initialValue;
        } else {
          var kPresent = false;
          while (!kPresent && k < len) {
            kPresent = k in O;
            if (kPresent) {
              accumulator = O[k];
            }
            k++;
          }
          if (!kPresent) {
            throw new TypeError('Reduce of empty array with no initial value');
          }
        }
        
        while (k < len) {
          if (k in O) {
            accumulator = callback(accumulator, O[k], k, O);
          }
          k++;
        }
        return accumulator;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.reduceRight) {
    defineProperty(Array.prototype, 'reduceRight', {
      value: function(callback, initialValue) {
        if (this == null) {
          throw new TypeError('Array.prototype.reduceRight called on null or undefined');
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var k = len - 1;
        var accumulator;
        
        if (arguments.length >= 2) {
          accumulator = initialValue;
        } else {
          var kPresent = false;
          while (!kPresent && k >= 0) {
            kPresent = k in O;
            if (kPresent) {
              accumulator = O[k];
            }
            k--;
          }
          if (!kPresent) {
            throw new TypeError('Reduce of empty array with no initial value');
          }
        }
        
        while (k >= 0) {
          if (k in O) {
            accumulator = callback(accumulator, O[k], k, O);
          }
          k--;
        }
        return accumulator;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.indexOf) {
    defineProperty(Array.prototype, 'indexOf', {
      value: function(searchElement, fromIndex) {
        if (this == null) {
          throw new TypeError('Array.prototype.indexOf called on null or undefined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) return -1;
        
        var n = fromIndex | 0;
        if (n >= len) return -1;
        
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
          if (k in O && O[k] === searchElement) {
            return k;
          }
          k++;
        }
        return -1;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.lastIndexOf) {
    defineProperty(Array.prototype, 'lastIndexOf', {
      value: function(searchElement, fromIndex) {
        if (this == null) {
          throw new TypeError('Array.prototype.lastIndexOf called on null or undefined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) return -1;
        
        var n = len - 1;
        if (arguments.length > 1) {
          n = fromIndex | 0;
          n = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
        }
        
        for (var k = n; k >= 0; k--) {
          if (k in O && O[k] === searchElement) {
            return k;
          }
        }
        return -1;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.every) {
    defineProperty(Array.prototype, 'every', {
      value: function(callback, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.every called on null or undefined');
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var k = 0;
        
        while (k < len) {
          if (k in O && !callback.call(thisArg, O[k], k, O)) {
            return false;
          }
          k++;
        }
        return true;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.some) {
    defineProperty(Array.prototype, 'some', {
      value: function(callback, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.some called on null or undefined');
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var k = 0;
        
        while (k < len) {
          if (k in O && callback.call(thisArg, O[k], k, O)) {
            return true;
          }
          k++;
        }
        return false;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.find) {
    defineProperty(Array.prototype, 'find', {
      value: function(predicate, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
          throw new TypeError(predicate + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        
        for (var i = 0; i < len; i++) {
          var value = O[i];
          if (predicate.call(thisArg, value, i, O)) {
            return value;
          }
        }
        return undefined;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.findIndex) {
    defineProperty(Array.prototype, 'findIndex', {
      value: function(predicate, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
          throw new TypeError(predicate + ' is not a function');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        
        for (var i = 0; i < len; i++) {
          if (predicate.call(thisArg, O[i], i, O)) {
            return i;
          }
        }
        return -1;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.fill) {
    defineProperty(Array.prototype, 'fill', {
      value: function(value, start, end) {
        if (this == null) {
          throw new TypeError('Array.prototype.fill called on null or undefined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var relativeStart = start >> 0;
        var k = relativeStart < 0 ? 
          Math.max(len + relativeStart, 0) : 
          Math.min(relativeStart, len);
        var relativeEnd = end === undefined ? len : end >> 0;
        var final = relativeEnd < 0 ? 
          Math.max(len + relativeEnd, 0) : 
          Math.min(relativeEnd, len);
        
        while (k < final) {
          O[k] = value;
          k++;
        }
        return O;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.includes) {
    defineProperty(Array.prototype, 'includes', {
      value: function(searchElement, fromIndex) {
        if (this == null) {
          throw new TypeError('Array.prototype.includes called on null or undefined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) return false;
        
        var n = fromIndex | 0;
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        
        function sameValueZero(x, y) {
          return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
        }
        
        while (k < len) {
          if (sameValueZero(O[k], searchElement)) {
            return true;
          }
          k++;
        }
        return false;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.flat) {
    defineProperty(Array.prototype, 'flat', {
      value: function(depth) {
        var d = depth === undefined ? 1 : Math.floor(depth);
        if (d < 1) return Array.prototype.slice.call(this);
        
        var flattenDeep = function(arr, d) {
          return d > 0 ? arr.reduce(function(acc, val) {
            return acc.concat(Array.isArray(val) ? flattenDeep(val, d - 1) : val);
          }, []) : arr.slice();
        };
        
        return flattenDeep(this, d);
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.flatMap) {
    defineProperty(Array.prototype, 'flatMap', {
      value: function(callback, thisArg) {
        return this.map(callback, thisArg).flat(1);
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.isArray) {
    Array.isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }

  if (!Array.from) {
    Array.from = function(arrayLike, mapFn, thisArg) {
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object');
      }
      
      var items = Object(arrayLike);
      var len = items.length >>> 0;
      var A = typeof this === 'function' ? new this(len) : new Array(len);
      var k = 0;
      
      while (k < len) {
        var kValue = items[k];
        if (mapFn) {
          A[k] = typeof thisArg !== 'undefined' ? mapFn.call(thisArg, kValue, k) : mapFn(kValue, k);
        } else {
          A[k] = kValue;
        }
        k++;
      }
      A.length = len;
      return A;
    };
  }

  if (!Array.of) {
    Array.of = function() {
      return Array.prototype.slice.call(arguments);
    };
  }

  // ==================== Object Polyfills ====================

  if (!Object.keys) {
    Object.keys = function(obj) {
      if (obj !== Object(obj)) {
        throw new TypeError('Object.keys called on non-object');
      }
      var keys = [];
      for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          keys.push(prop);
        }
      }
      return keys;
    };
  }

  if (!Object.values) {
    Object.values = function(obj) {
      if (obj !== Object(obj)) {
        throw new TypeError('Object.values called on non-object');
      }
      var values = [];
      for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          values.push(obj[prop]);
        }
      }
      return values;
    };
  }

  if (!Object.entries) {
    Object.entries = function(obj) {
      if (obj !== Object(obj)) {
        throw new TypeError('Object.entries called on non-object');
      }
      var entries = [];
      for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          entries.push([prop, obj[prop]]);
        }
      }
      return entries;
    };
  }

  if (!Object.create) {
    Object.create = function(proto, propertiesObject) {
      if (typeof proto !== 'object' && typeof proto !== 'function') {
        throw new TypeError('Object prototype may only be an Object or null: ' + proto);
      }
      if (proto === null) {
        throw new Error('null [[Prototype]] not supported');
      }
      
      function F() {}
      F.prototype = proto;
      var obj = new F();
      
      if (propertiesObject !== undefined) {
        Object.defineProperties(obj, propertiesObject);
      }
      
      return obj;
    };
  }

  if (!Object.assign) {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  if (!Object.freeze) {
    Object.freeze = function(obj) {
      return obj;
    };
  }

  if (!Object.seal) {
    Object.seal = function(obj) {
      return obj;
    };
  }

  if (!Object.preventExtensions) {
    Object.preventExtensions = function(obj) {
      return obj;
    };
  }

  if (!Object.isFrozen) {
    Object.isFrozen = function() {
      return false;
    };
  }

  if (!Object.isSealed) {
    Object.isSealed = function() {
      return false;
    };
  }

  if (!Object.isExtensible) {
    Object.isExtensible = function() {
      return true;
    };
  }

  if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function(obj) {
      return Object.keys(obj);
    };
  }

  if (!Object.setPrototypeOf) {
    Object.setPrototypeOf = function(obj, proto) {
      obj.__proto__ = proto;
      return obj;
    };
  }

  if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function(obj) {
      if (obj !== Object(obj)) {
        throw new TypeError('Object.getPrototypeOf called on non-object');
      }
      return obj.__proto__ || obj.constructor.prototype;
    };
  }

  // ==================== String Polyfills ====================

  if (!String.prototype.trim) {
    defineProperty(String.prototype, 'trim', {
      value: function() {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
      },
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.trimStart && !String.prototype.trimLeft) {
    var trimStart = function() {
      return this.replace(/^[\s\uFEFF\xA0]+/, '');
    };
    defineProperty(String.prototype, 'trimStart', {
      value: trimStart,
      writable: true,
      configurable: true
    });
    defineProperty(String.prototype, 'trimLeft', {
      value: trimStart,
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.trimEnd && !String.prototype.trimRight) {
    var trimEnd = function() {
      return this.replace(/[\s\uFEFF\xA0]+$/, '');
    };
    defineProperty(String.prototype, 'trimEnd', {
      value: trimEnd,
      writable: true,
      configurable: true
    });
    defineProperty(String.prototype, 'trimRight', {
      value: trimEnd,
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.repeat) {
    defineProperty(String.prototype, 'repeat', {
      value: function(count) {
        if (this == null) {
          throw new TypeError('String.prototype.repeat called on null or undefined');
        }
        var str = String(this);
        count = Number(count) || 0;
        
        if (count < 0 || count === Infinity) {
          throw new RangeError('Invalid count value');
        }
        
        count = Math.floor(count);
        if (str.length === 0 || count === 0) {
          return '';
        }
        
        var result = '';
        while (count > 0) {
          if (count & 1) {
            result += str;
          }
          count >>>= 1;
          if (count > 0) {
            str += str;
          }
        }
        return result;
      },
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.startsWith) {
    defineProperty(String.prototype, 'startsWith', {
      value: function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
      },
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.endsWith) {
    defineProperty(String.prototype, 'endsWith', {
      value: function(searchString, length) {
        if (length === undefined || length > this.length) {
          length = this.length;
        }
        return this.substring(length - searchString.length, length) === searchString;
      },
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.includes) {
    defineProperty(String.prototype, 'includes', {
      value: function(search, start) {
        if (typeof start !== 'number') {
          start = 0;
        }
        if (start + search.length > this.length) {
          return false;
        }
        return this.indexOf(search, start) !== -1;
      },
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.padStart) {
    defineProperty(String.prototype, 'padStart', {
      value: function(targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
          return String(this);
        }
        targetLength = targetLength - this.length;
        if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length);
        }
        return padString.slice(0, targetLength) + String(this);
      },
      writable: true,
      configurable: true
    });
  }

  if (!String.prototype.padEnd) {
    defineProperty(String.prototype, 'padEnd', {
      value: function(targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
          return String(this);
        }
        targetLength = targetLength - this.length;
        if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length);
        }
        return String(this) + padString.slice(0, targetLength);
      },
      writable: true,
      configurable: true
    });
  }

  // ==================== Function Polyfills ====================

  if (!Function.prototype.bind) {
    defineProperty(Function.prototype, 'bind', {
      value: function(oThis) {
        if (typeof this !== 'function') {
          throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
        
        var aArgs = Array.prototype.slice.call(arguments, 1);
        var fToBind = this;
        var fNOP = function() {};
        var fBound = function() {
          return fToBind.apply(
            this instanceof fNOP ? this : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments))
          );
        };
        
        if (this.prototype) {
          fNOP.prototype = this.prototype;
        }
        fBound.prototype = new fNOP();
        
        return fBound;
      },
      writable: true,
      configurable: true
    });
  }

  // ==================== Number Polyfills ====================

  if (!Number.isNaN) {
    Number.isNaN = function(value) {
      return typeof value === 'number' && isNaN(value);
    };
  }

  if (!Number.isFinite) {
    Number.isFinite = function(value) {
      return typeof value === 'number' && isFinite(value);
    };
  }

  if (!Number.isInteger) {
    Number.isInteger = function(value) {
      return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    };
  }

  if (!Number.isSafeInteger) {
    Number.isSafeInteger = function(value) {
      return Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
    };
  }

  if (!Number.parseFloat) {
    Number.parseFloat = parseFloat;
  }

  if (!Number.parseInt) {
    Number.parseInt = parseInt;
  }

  if (typeof Number.EPSILON === 'undefined') {
    Number.EPSILON = Math.pow(2, -52);
  }

  if (typeof Number.MAX_SAFE_INTEGER === 'undefined') {
    Number.MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  }

  if (typeof Number.MIN_SAFE_INTEGER === 'undefined') {
    Number.MIN_SAFE_INTEGER = -(Math.pow(2, 53) - 1);
  }

  // ==================== Math Polyfills ====================

  if (!Math.trunc) {
    Math.trunc = function(v) {
      v = +v;
      return (v - v % 1) || (!isFinite(v) || v === 0 ? v : v < 0 ? -0 : 0);
    };
  }

  if (!Math.sign) {
    Math.sign = function(x) {
      x = +x;
      if (x === 0 || isNaN(x)) {
        return x;
      }
      return x > 0 ? 1 : -1;
    };
  }

  if (!Math.cbrt) {
    Math.cbrt = function(x) {
      var y = Math.pow(Math.abs(x), 1/3);
      return x < 0 ? -y : y;
    };
  }

  if (!Math.log10) {
    Math.log10 = function(x) {
      return Math.log(x) * Math.LOG10E;
    };
  }

  if (!Math.log2) {
    Math.log2 = function(x) {
      return Math.log(x) * Math.LOG2E;
    };
  }

  if (!Math.log1p) {
    Math.log1p = function(x) {
      x = Number(x);
      if (x < -1 || x !== x) return NaN;
      if (x === 0 || x === Infinity) return x;
      var nearX = (x + 1) - 1;
      return nearX === 0 ? x : x * (Math.log(x + 1) / nearX);
    };
  }

  if (!Math.expm1) {
    Math.expm1 = function(x) {
      x = Number(x);
      if (x === 0 || x !== x || x === Infinity) return x;
      return Math.exp(x) - 1;
    };
  }

  if (!Math.sinh) {
    Math.sinh = function(x) {
      var y = Math.exp(x);
      return (y - 1/y) / 2;
    };
  }

  if (!Math.cosh) {
    Math.cosh = function(x) {
      var y = Math.exp(x);
      return (y + 1/y) / 2;
    };
  }

  if (!Math.tanh) {
    Math.tanh = function(x) {
      if (x === Infinity) return 1;
      if (x === -Infinity) return -1;
      var y = Math.exp(2 * x);
      return (y - 1) / (y + 1);
    };
  }

  if (!Math.asinh) {
    Math.asinh = function(x) {
      if (x === -Infinity) return x;
      return Math.log(x + Math.sqrt(x * x + 1));
    };
  }

  if (!Math.acosh) {
    Math.acosh = function(x) {
      return Math.log(x + Math.sqrt(x * x - 1));
    };
  }

  if (!Math.atanh) {
    Math.atanh = function(x) {
      return Math.log((1 + x) / (1 - x)) / 2;
    };
  }

  if (!Math.hypot) {
    Math.hypot = function() {
      var y = 0;
      var length = arguments.length;
      for (var i = 0; i < length; i++) {
        if (arguments[i] === Infinity || arguments[i] === -Infinity) {
          return Infinity;
        }
        y += arguments[i] * arguments[i];
      }
      return Math.sqrt(y);
    };
  }

  if (!Math.clz32) {
    Math.clz32 = function(x) {
      x = Number(x) >>> 0;
      return x ? 32 - x.toString(2).length : 32;
    };
  }

  if (!Math.imul) {
    Math.imul = function(a, b) {
      var ah = (a >>> 16) & 0xffff;
      var al = a & 0xffff;
      var bh = (b >>> 16) & 0xffff;
      var bl = b & 0xffff;
      return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
    };
  }

  if (!Math.fround) {
    Math.fround = function(x) {
      return new Float32Array([x])[0];
    };
  }

  // ==================== Date Polyfills ====================

  if (!Date.now) {
    Date.now = function() {
      return new Date().getTime();
    };
  }

  if (!Date.prototype.toISOString) {
    (function() {
      function pad(number) {
        if (number < 10) {
          return '0' + number;
        }
        return number;
      }
      
      Date.prototype.toISOString = function() {
        return this.getUTCFullYear() +
          '-' + pad(this.getUTCMonth() + 1) +
          '-' + pad(this.getUTCDate()) +
          'T' + pad(this.getUTCHours()) +
          ':' + pad(this.getUTCMinutes()) +
          ':' + pad(this.getUTCSeconds()) +
          '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
          'Z';
      };
    })();
  }

  // ==================== Promise Polyfill ====================

  if (typeof Promise === 'undefined') {
    (function() {
      var PENDING = 0;
      var FULFILLED = 1;
      var REJECTED = 2;

      function Promise(executor) {
        var self = this;
        self.state = PENDING;
        self.value = undefined;
        self.handlers = [];

        function fulfill(result) {
          if (self.state !== PENDING) return;
          self.state = FULFILLED;
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }

        function reject(error) {
          if (self.state !== PENDING) return;
          self.state = REJECTED;
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }

        function resolve(result) {
          try {
            var then = getThen(result);
            if (then) {
              doResolve(then.bind(result), resolve, reject);
              return;
            }
            fulfill(result);
          } catch (e) {
            reject(e);
          }
        }

        function handle(handler) {
          if (self.state === PENDING) {
            self.handlers.push(handler);
          } else {
            if (self.state === FULFILLED && typeof handler.onFulfilled === 'function') {
              handler.onFulfilled(self.value);
            }
            if (self.state === REJECTED && typeof handler.onRejected === 'function') {
              handler.onRejected(self.value);
            }
          }
        }

        self.done = function(onFulfilled, onRejected) {
          setTimeout(function() {
            handle({
              onFulfilled: onFulfilled,
              onRejected: onRejected
            });
          }, 0);
        };

        self.then = function(onFulfilled, onRejected) {
          return new Promise(function(resolve, reject) {
            self.done(function(result) {
              if (typeof onFulfilled === 'function') {
                try {
                  return resolve(onFulfilled(result));
                } catch (ex) {
                  return reject(ex);
                }
              } else {
                return resolve(result);
              }
            }, function(error) {
              if (typeof onRejected === 'function') {
                try {
                  return resolve(onRejected(error));
                } catch (ex) {
                  return reject(ex);
                }
              } else {
                return reject(error);
              }
            });
          });
        };

        self.catch = function(onRejected) {
          return self.then(null, onRejected);
        };

        doResolve(executor, resolve, reject);
      }

      Promise.resolve = function(value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
          return value;
        }
        return new Promise(function(resolve) {
          resolve(value);
        });
      };

      Promise.reject = function(reason) {
        return new Promise(function(resolve, reject) {
          reject(reason);
        });
      };

      Promise.all = function(promises) {
        return new Promise(function(resolve, reject) {
          if (!Array.isArray(promises)) {
            return reject(new TypeError('Promise.all accepts an array'));
          }
          
          var results = new Array(promises.length);
          var remaining = promises.length;
          
          if (remaining === 0) {
            return resolve(results);
          }
          
          function resolver(index) {
            return function(value) {
              results[index] = value;
              if (--remaining === 0) {
                resolve(results);
              }
            };
          }
          
          for (var i = 0; i < promises.length; i++) {
            Promise.resolve(promises[i]).then(resolver(i), reject);
          }
        });
      };

      Promise.race = function(promises) {
        return new Promise(function(resolve, reject) {
          if (!Array.isArray(promises)) {
            return reject(new TypeError('Promise.race accepts an array'));
          }
          
          for (var i = 0; i < promises.length; i++) {
            Promise.resolve(promises[i]).then(resolve, reject);
          }
        });
      };

      function getThen(value) {
        var t = typeof value;
        if (value && (t === 'object' || t === 'function')) {
          var then = value.then;
          if (typeof then === 'function') {
            return then;
          }
        }
        return null;
      }

      function doResolve(fn, onFulfilled, onRejected) {
        var done = false;
        try {
          fn(function(value) {
            if (done) return;
            done = true;
            onFulfilled(value);
          }, function(reason) {
            if (done) return;
            done = true;
            onRejected(reason);
          });
        } catch (ex) {
          if (done) return;
          done = true;
          onRejected(ex);
        }
      }

      global.Promise = Promise;
    })();
  }

  if (Promise && !Promise.finally) {
    Promise.prototype.finally = function(callback) {
      var P = this.constructor;
      return this.then(
        function(value) {
          return P.resolve(callback()).then(function() {
            return value;
          });
        },
        function(reason) {
          return P.resolve(callback()).then(function() {
            throw reason;
          });
        }
      );
    };
  }

  if (Promise && !Promise.allSettled) {
    Promise.allSettled = function(promises) {
      return Promise.all(promises.map(function(p) {
        return Promise.resolve(p).then(
          function(value) {
            return { status: 'fulfilled', value: value };
          },
          function(reason) {
            return { status: 'rejected', reason: reason };
          }
        );
      }));
    };
  }

  // ==================== DOM Polyfills ====================

  if (!document) return;

  // Element.matches
  if (global.Element && !Element.prototype.matches) {
    Element.prototype.matches = 
      Element.prototype.matchesSelector || 
      Element.prototype.mozMatchesSelector || 
      Element.prototype.msMatchesSelector || 
      Element.prototype.oMatchesSelector || 
      Element.prototype.webkitMatchesSelector || 
      function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s);
        var i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
  }

  // Element.closest
  if (global.Element && !Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // Element.remove
  if (global.Element && !Element.prototype.remove) {
    Element.prototype.remove = function() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
  }

  // ChildNode.before
  if (global.Element && !Element.prototype.before) {
    Element.prototype.before = function() {
      var parent = this.parentNode;
      if (!parent) return;
      var args = Array.prototype.slice.call(arguments);
      var i = args.length;
      while (i--) {
        var node = args[i];
        if (typeof node === 'string') {
          node = document.createTextNode(node);
        }
        parent.insertBefore(node, this);
      }
    };
  }

  // ChildNode.after
  if (global.Element && !Element.prototype.after) {
    Element.prototype.after = function() {
      var parent = this.parentNode;
      if (!parent) return;
      var args = Array.prototype.slice.call(arguments);
      var ref = this.nextSibling;
      var i = 0;
      while (i < args.length) {
        var node = args[i];
        if (typeof node === 'string') {
          node = document.createTextNode(node);
        }
        if (ref) {
          parent.insertBefore(node, ref);
        } else {
          parent.appendChild(node);
        }
        i++;
      }
    };
  }

  // ChildNode.replaceWith
  if (global.Element && !Element.prototype.replaceWith) {
    Element.prototype.replaceWith = function() {
      var parent = this.parentNode;
      if (!parent) return;
      var args = Array.prototype.slice.call(arguments);
      var i = 0;
      while (i < args.length) {
        var node = args[i];
        if (typeof node === 'string') {
          node = document.createTextNode(node);
        }
        parent.insertBefore(node, this);
        i++;
      }
      parent.removeChild(this);
    };
  }

  // ParentNode.append
  if (global.Element && !Element.prototype.append) {
    Element.prototype.append = function() {
      var args = Array.prototype.slice.call(arguments);
      var i = 0;
      while (i < args.length) {
        var node = args[i];
        if (typeof node === 'string') {
          node = document.createTextNode(node);
        }
        this.appendChild(node);
        i++;
      }
    };
  }

  // ParentNode.prepend
  if (global.Element && !Element.prototype.prepend) {
    Element.prototype.prepend = function() {
      var args = Array.prototype.slice.call(arguments);
      var ref = this.firstChild;
      var i = 0;
      while (i < args.length) {
        var node = args[i];
        if (typeof node === 'string') {
          node = document.createTextNode(node);
        }
        if (ref) {
          this.insertBefore(node, ref);
        } else {
          this.appendChild(node);
        }
        i++;
      }
    };
  }

  // CustomEvent
  if (typeof global.CustomEvent !== 'function') {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    CustomEvent.prototype = global.Event.prototype;
    global.CustomEvent = CustomEvent;
  }

  // classList polyfill
  if (!('classList' in document.createElement('_')) && global.Element) {
    (function(view) {
      if (!('Element' in view)) return;
      
      var classListProp = 'classList';
      var protoProp = 'prototype';
      var elemCtrProto = view.Element[protoProp];
      var objCtr = Object;
      var strTrim = String[protoProp].trim || function() {
        return this.replace(/^\s+|\s+$/g, '');
      };
      var arrIndexOf = Array[protoProp].indexOf || function(item) {
        var i = 0, len = this.length;
        for (; i < len; i++) {
          if (i in this && this[i] === item) {
            return i;
          }
        }
        return -1;
      };
      
      var DOMTokenList = function(elem) {
        var classes = strTrim.call(elem.getAttribute('class') || '');
        var tokens = classes ? classes.split(/\s+/) : [];
        var i = 0;
        this.length = tokens.length;
        this._elem = elem;
        for (; i < this.length; i++) {
          this[i] = tokens[i];
        }
      };
      
      var listProto = DOMTokenList[protoProp] = [];
      
      listProto.item = function(i) {
        return this[i] || null;
      };
      
      listProto.contains = function(token) {
        token += '';
        return arrIndexOf.call(this, token) !== -1;
      };
      
      listProto.add = function() {
        var tokens = arguments;
        var i = 0;
        var l = tokens.length;
        var token;
        var updated = false;
        
        do {
          token = tokens[i] + '';
          if (arrIndexOf.call(this, token) === -1) {
            this[this.length] = token;
            this.length++;
            updated = true;
          }
        } while (++i < l);
        
        if (updated) {
          this._elem.className = this.toString();
        }
      };
      
      listProto.remove = function() {
        var tokens = arguments;
        var i = 0;
        var l = tokens.length;
        var token;
        var updated = false;
        var index;
        
        do {
          token = tokens[i] + '';
          index = arrIndexOf.call(this, token);
          while (index !== -1) {
            this.splice(index, 1);
            this.length--;
            updated = true;
            index = arrIndexOf.call(this, token);
          }
        } while (++i < l);
        
        if (updated) {
          this._elem.className = this.toString();
        }
      };
      
      listProto.toggle = function(token, force) {
        token += '';
        var result = this.contains(token);
        var method = result ? 
          force !== true && 'remove' : 
          force !== false && 'add';
        
        if (method) {
          this[method](token);
        }
        
        if (force === true || force === false) {
          return force;
        }
        return !result;
      };
      
      listProto.replace = function(token, replacement_token) {
        var index = arrIndexOf.call(this, token + '');
        if (index !== -1) {
          this.splice(index, 1);
          this.add(replacement_token);
          this._elem.className = this.toString();
          return true;
        }
        return false;
      };
      
      listProto.toString = function() {
        return Array.prototype.slice.call(this).join(' ');
      };
      
      listProto.splice = Array.prototype.splice;
      
      if (objCtr.defineProperty) {
        var classListPropDesc = {
          get: function() {
            return new DOMTokenList(this);
          },
          enumerable: true,
          configurable: true
        };
        try {
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) {
          if (ex.number === undefined || ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          }
        }
      }
    })(global);
  }

  // requestAnimationFrame / cancelAnimationFrame
  (function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz', 'ms', 'o'];
    
    for (var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x) {
      global.requestAnimationFrame = global[vendors[x] + 'RequestAnimationFrame'];
      global.cancelAnimationFrame = global[vendors[x] + 'CancelAnimationFrame'] || 
                                    global[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    
    if (!global.requestAnimationFrame) {
      global.requestAnimationFrame = function(callback) {
        var currTime = Date.now();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = global.setTimeout(function() {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    
    if (!global.cancelAnimationFrame) {
      global.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
  })();

  // performance.now
  if (!global.performance) {
    global.performance = {};
  }
  
  if (!global.performance.now) {
    var nowOffset = Date.now();
    
    if (global.performance.timing && global.performance.timing.navigationStart) {
      nowOffset = global.performance.timing.navigationStart;
    }
    
    global.performance.now = function() {
      return Date.now() - nowOffset;
    };
  }

  // Event listeners
  (function() {
    if (!global.addEventListener) {
      global.addEventListener = function(type, listener, useCapture) {
        global.attachEvent('on' + type, listener);
      };
    }
    
    if (!global.removeEventListener) {
      global.removeEventListener = function(type, listener, useCapture) {
        global.detachEvent('on' + type, listener);
      };
    }
    
    if (document && !document.addEventListener) {
      document.addEventListener = function(type, listener, useCapture) {
        document.attachEvent('on' + type, listener);
      };
    }
    
    if (document && !document.removeEventListener) {
      document.removeEventListener = function(type, listener, useCapture) {
        document.detachEvent('on' + type, listener);
      };
    }
  })();

  // console
  if (!global.console) {
    global.console = {
      log: function() {},
      warn: function() {},
      error: function() {},
      info: function() {},
      debug: function() {},
      trace: function() {},
      dir: function() {},
      group: function() {},
      groupCollapsed: function() {},
      groupEnd: function() {},
      time: function() {},
      timeEnd: function() {},
      assert: function() {},
      clear: function() {},
      count: function() {},
      table: function() {}
    };
  }

  // Node constants
  if (typeof Node === 'undefined') {
    global.Node = {
      ELEMENT_NODE: 1,
      ATTRIBUTE_NODE: 2,
      TEXT_NODE: 3,
      CDATA_SECTION_NODE: 4,
      ENTITY_REFERENCE_NODE: 5,
      ENTITY_NODE: 6,
      PROCESSING_INSTRUCTION_NODE: 7,
      COMMENT_NODE: 8,
      DOCUMENT_NODE: 9,
      DOCUMENT_TYPE_NODE: 10,
      DOCUMENT_FRAGMENT_NODE: 11,
      NOTATION_NODE: 12
    };
  }

  // querySelectorAll and querySelector
  if (document && !document.querySelectorAll) {
    document.querySelectorAll = function(selector) {
      var doc = document;
      var head = doc.documentElement.firstChild;
      var styleTag = doc.createElement('style');
      head.appendChild(styleTag);
      doc._qsa = [];
      
      styleTag.styleSheet.cssText = selector + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
      global.scrollBy(0, 0);
      head.removeChild(styleTag);
      
      var elements = [];
      while (doc._qsa.length) {
        var element = doc._qsa.shift();
        element.style.removeAttribute('x-qsa');
        elements.push(element);
      }
      doc._qsa = null;
      return elements;
    };
  }
  
  if (document && !document.querySelector) {
    document.querySelector = function(selector) {
      var elements = document.querySelectorAll(selector);
      return elements.length ? elements[0] : null;
    };
  }

  // ==================== Utility Functions ====================

  // DOMContentLoaded helper
  global.$ready = function(callback) {
    if (typeof callback !== 'function') return;
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(callback, 1);
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', callback);
    } else if (document.attachEvent) {
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState !== 'loading') {
          callback();
        }
      });
    }
  };

  // Event handler helpers
  global.$on = function(target, event, handler, capture) {
    if (!target || !event || !handler) return;
    
    if (target.addEventListener) {
      target.addEventListener(event, handler, capture || false);
    } else if (target.attachEvent) {
      target.attachEvent('on' + event, handler);
    }
  };

  global.$off = function(target, event, handler, capture) {
    if (!target || !event || !handler) return;
    
    if (target.removeEventListener) {
      target.removeEventListener(event, handler, capture || false);
    } else if (target.detachEvent) {
      target.detachEvent('on' + event, handler);
    }
  };

  // Query selector helpers
  global.$qs = function(selector, context) {
    return (context || document).querySelector(selector);
  };

  global.$qsa = function(selector, context) {
    var results = (context || document).querySelectorAll(selector);
    return Array.prototype.slice.call(results);
  };

  // Class manipulation helpers
  global.$hasClass = function(el, className) {
    if (!el || !className) return false;
    if (el.classList) return el.classList.contains(className);
    return new RegExp('(^|\\s)' + className + '(\\s|$)').test(el.className);
  };

  global.$addClass = function(el, className) {
    if (!el || !className) return;
    if (el.classList) {
      el.classList.add(className);
    } else if (!global.$hasClass(el, className)) {
      el.className = (el.className + ' ' + className).trim();
    }
  };

  global.$removeClass = function(el, className) {
    if (!el || !className) return;
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className
        .replace(new RegExp('(^|\\s)' + className + '(\\s|$)', 'g'), ' ')
        .trim();
    }
  };

  global.$toggleClass = function(el, className) {
    if (!el || !className) return;
    if (el.classList) {
      el.classList.toggle(className);
    } else if (global.$hasClass(el, className)) {
      global.$removeClass(el, className);
    } else {
      global.$addClass(el, className);
    }
  };

  // CSS helper
  global.$css = function(el, styles) {
    if (!el) return;
    
    if (typeof styles === 'string') {
      return el.style[styles];
    }
    
    for (var prop in styles) {
      if (styles.hasOwnProperty(prop)) {
        el.style[prop] = styles[prop];
      }
    }
  };

  // Attribute helper
  global.$attr = function(el, name, value) {
    if (!el || !name) return;
    
    if (value === undefined) {
      return el.getAttribute(name);
    }
    
    if (value === null) {
      el.removeAttribute(name);
    } else {
      el.setAttribute(name, value);
    }
  };

  // JSON helpers (enhanced)
  if (typeof JSON !== 'object' || !JSON.parse || !JSON.stringify) {
    global.JSON = {
      parse: function(text) {
        if (typeof text !== 'string') {
          throw new TypeError('JSON.parse expects a string');
        }
        try {
          return (new Function('return ' + text))();
        } catch (e) {
          throw new SyntaxError('Invalid JSON: ' + e.message);
        }
      },
      stringify: function(value, replacer, space) {
        var indent = '';
        var gap = '';
        
        if (typeof space === 'number') {
          for (var i = 0; i < space; i++) {
            gap += ' ';
          }
        } else if (typeof space === 'string') {
          gap = space;
        }
        
        function str(key, holder) {
          var value = holder[key];
          
          if (value && typeof value.toJSON === 'function') {
            value = value.toJSON(key);
          }
          
          if (typeof replacer === 'function') {
            value = replacer.call(holder, key, value);
          }
          
          switch (typeof value) {
            case 'string':
              return quote(value);
            case 'number':
              return isFinite(value) ? String(value) : 'null';
            case 'boolean':
            case 'null':
              return String(value);
            case 'object':
              if (!value) return 'null';
              indent += gap;
              var partial = [];
              
              if (Array.isArray(value)) {
                var len = value.length;
                for (var i = 0; i < len; i++) {
                  partial[i] = str(i, value) || 'null';
                }
                var v = partial.length === 0 ? '[]' :
                  gap ? '[\n' + indent + partial.join(',\n' + indent) + '\n' + 
                  indent.slice(0, -gap.length) + ']' :
                  '[' + partial.join(',') + ']';
                indent = indent.slice(0, -gap.length);
                return v;
              }
              
              for (var k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                  var v = str(k, value);
                  if (v) {
                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                  }
                }
              }
              
              v = partial.length === 0 ? '{}' :
                gap ? '{\n' + indent + partial.join(',\n' + indent) + '\n' +
                indent.slice(0, -gap.length) + '}' :
                '{' + partial.join(',') + '}';
              indent = indent.slice(0, -gap.length);
              return v;
          }
        }
        
        function quote(string) {
          var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
          var meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
          };
          
          escapable.lastIndex = 0;
          return escapable.test(string) ?
            '"' + string.replace(escapable, function(a) {
              var c = meta[a];
              return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
        }
        
        return str('', {'': value});
      }
    };
  }

  global.$parseJSON = function(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error('JSON parse error:', e);
      return null;
    }
  };

  global.$toJSON = function(obj) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      console.error('JSON stringify error:', e);
      return '{}';
    }
  };

  // Polyfill initialization complete
  if (global.console && global.console.log) {
    console.log('polyfills v2.0.0 loaded successfully');
  }

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});