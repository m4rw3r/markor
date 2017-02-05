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

  describe("swap('str')", () => {
    it("should return null", () => {
      should.strictEqual(a.swap('str'), null);
    });
    it("should replace the contained value", () => {
      a.swap("str");

      should.strictEqual(a.deref(), "str");
    });

    it("should notify observers with new value", () => {
      let observed = null;

      a.subscribe(v => {
        observed = v;
      });

      a.swap("str");

      should.strictEqual(observed, "str");
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
