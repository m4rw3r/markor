/* @flow */

require("babel-register");

require("tap").mochaGlobals();

let should = require("should");

let { Cursor } = require("../src");

describe

describe("Cursor", () => {
  context("new Cursor(null)", () => {
    let c = new Cursor(null);

    it(".deref() should equal null", () => {
      should.equal(c.deref(), null);
    });
  });

  context("new Cursor(Object)", () => {
    let o = {};
    let c = new Cursor(o);
    it(".deref() should be identical with original", () => {
      should.strictEqual(c.deref(), o);
    });
  });
});
