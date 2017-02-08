/* @flow */

require("babel-register");

require("tap").mochaGlobals();

let should = require("should");

let { Atom } = require("../src");

describe("Atom(null)", () => {
  var a = new Atom(null);

  describe("deref()", () => {
    it("should return the contained value", () => {
      should.strictEqual(a.deref(), null);
    });
  });

  describe("subscribe()", () => {
    it("should return a Subscription", () => {
      var sub = a.subscribe(v => {});

      should(sub).have.property("unsubscribe").and.be.Function();
      should(sub).have.property("closed").and.be.Boolean();
    });
  });

  describe("swap", () => {
    it("should return null", () => {
      should.strictEqual(a.swap("foo"), null);
    });
    it("should replace the contained value", () => {
      should.strictEqual(a.swap("str"), "foo");

      should.strictEqual(a.deref(), "str");
    });

    it("should notify observers with new and old value", () => {
      let observed = null;

      a.subscribe(function() {
        observed = Array.prototype.slice.call(arguments, 0);
      });

      should.equal(a.swap("baz"), "str");

      should.deepEqual(observed, ["baz", "str"]);
    });
  });
});

describe("Atom({}", () => {
  var o = {};
  var a = new Atom(o);

  describe("deref()", () => {
    it("should return the exact object", () => {
      should.strictEqual(a.deref(), o);
    });
  });

  describe("swap({}", () => {
    it("should return the old object", () => {
      should.strictEqual(a.swap({}), o);
    });

    it("should replace the contained value", () => {
      var p = {};

      a.swap(p);

      should.strictEqual(a.deref(), p);
    });
  });
});
