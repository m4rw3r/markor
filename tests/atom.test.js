/* @flow */

require("babel-register");

require("tap").mochaGlobals();

let should = require("should");

let { Atom } = require("../src");

describe("Atom(null)", () => {
  var c = new Atom(null);

  describe("deref()", () => {
    it("should return the contained value", () => {
      should.strictEqual(c.deref(), null);
    });
  });

  describe("swap('str')", () => {
    it("should return null", () => {
      should.strictEqual(c.swap('str'), null);
    });
    it("should replace the contained value", () => {
      c.swap("str");

      should.strictEqual(c.deref(), "str");
    });

    it("should notify observers with new value", () => {
      let observed = null;

      c.subscribe(v => {
        observed = v;
      });

      c.swap("str");

      should.strictEqual(observed, "str");
    });
  });
});

