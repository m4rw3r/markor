/* @flow */

require("babel-register");

require("tap").mochaGlobals();

let should = require("should");

let { Atom, Cursor } = require("../src");

describe("Cursor(null)", () => {
  var a = new Atom(null);
  var c = a.cursor();

  it("Atom(null).cursor() should be a Cursor", () => {
    should(c).be.instanceof(Cursor);
  });

  it(".deref() should equal null", () => {
    should.strictEqual(c.deref(), null);
  });
});

describe("new Cursor({})", () => {
  var o = {};
  var a = new Atom(o);
  var c = a.cursor();

  it(".deref() should be identical with original", () => {
    should.strictEqual(c.deref(), o);
  });
});
