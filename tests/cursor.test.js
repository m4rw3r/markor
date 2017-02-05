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

describe("Cursor({})", () => {
  var o = {};
  var a = new Atom(o);
  var c = a.cursor();

  it("Atom({}).cursor() should be a Cursor", () => {
    should(c).be.instanceof(Cursor);
  });

  context("deref()", () => {
    it("should be identical with original", () => {
      should.strictEqual(c.deref(), o);
    });
  });

  context("swap('foo')", () => {
    it("should return the old value", () => {
      should.strictEqual(c.swap("foo"), o);
    });
    it("should replace the contained value in Cursor and Atom", () => {
      c.swap("foo");

      should.strictEqual(c.deref(), "foo");
      should.strictEqual(a.deref(), "foo");
    });
    it("should notify observers on Atom", () => {
      let observed = null;

      a.subscribe(v => {
        observed = v;
      });

      c.swap("str");

      should.strictEqual(observed, "str");
    });
  });
});

describe("Cursor({ a: { b: 42, c: 'lol' }})", () => {
  var o = { a: { b: 42, c: "lol" }, d: ["e", "f", "g"] };

  context("get('a')", () => {
    var a = new Atom(o);
    var c = a.cursor();
    var d = c.get("a");

    it("should return a Cursor", () => {
      should(d).be.instanceof(Cursor);
    });

    it("should .deref() to the nested exact value", () => {
      should.deepEqual(d.deref(), { b: 42, c: "lol" });
      should.strictEqual(d.deref(), o.a);
    });

    context("swap()", () => {
      var v = d.swap("test");

      it("should return the nested exact value", () => {
        should.deepEqual(v, { b: 42, c: "lol" });
        should.strictEqual(v, o.a);
      });

      it("should .deref() to the new value", () => {
        should.strictEqual(d.deref(), "test");
      });

      it("original atom should now contain the new nested value", () => {
        should.deepEqual(a.deref(), { a: "test", d: ["e", "f", "g"] });
      });
    });
  });

  context("get('a').get('b')", () => {
    var a = new Atom(o);
    var c = a.cursor();
    var d = c.get("a").get("b");

    it("should return a Cursor", () => {
      should(d).be.instanceof(Cursor);
    });

    it("should .deref() to the nested exact value", () => {
      should.strictEqual(d.deref(), 42);
    });
  });

  context("get('b')", () => {
    var a = new Atom(o);
    var c = a.cursor();
    it("should throw an exception", () => {
      should.throws(() => {
        c.get("b");
      });
    });
  });
});
