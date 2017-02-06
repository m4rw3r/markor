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

    context("deref()", () => {
      it("should return the nested exact value", () => {
        should.deepEqual(d.deref(), { b: 42, c: "lol" });
        should.strictEqual(d.deref(), o.a);
      });
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

      it("original value should still be the same", () => {
        should.deepEqual(o, { a: { b: 42, c: "lol" }, d: ["e", "f", "g"] });
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

  context("get('b', null)", () => {
    var a = new Atom(o);
    var c = a.cursor();
    var d = c.get("b", null);

    it("should return a Cursor", () => {
      should(d).be.instanceof(Cursor);
    });

    context("deref()", () => {
      it("should return the nested default exact value", () => {
        should.equal(d.deref(), null);
      });
    });
  });

  context("get('b', { test: 'foo' })", () => {
    var o2 = { test: 'foo' };
    var a  = new Atom(o);
    var c  = a.cursor();
    var d  = c.get("b", o2);

    it("should return a Cursor", () => {
      should(d).be.instanceof(Cursor);
    });

    context("deref()", () => {
      it("should return the nested default exact value", () => {
        should.deepEqual(d.deref(), { test: "foo" });
        should.strictEqual(d.deref(), o2);
      });
    });

    context("swap({})", () => {
      var o3 = {};

      var obj = d.swap(o3);

      it("should return the old value", () => {
        should.deepEqual(obj, { test: "foo" });
        should.strictEqual(obj, o2);
      });

      it("should .deref() to the new exact value", () => {
        should.deepEqual(d.deref(), {});
        should.strictEqual(d.deref(), o3);
      });

      it("Should have added b: {} to atom", () => {
        should.deepEqual(a.deref(), { a: { b: 42, c: "lol" }, d: ["e", "f", "g"], b: {} });
      });

      it("should notify observers on Atom", () => {
        let observed = null;

        a.subscribe(v => {
          observed = v;
        });

        d.swap("str");

        should.deepEqual(observed, { a: { b: 42, c: "lol" }, d: ["e", "f", "g"], b: "str" });
      });
    });
  });

  // TODO: What about other properties on the default object?
  context("get('b', { test: 'foo' }).get('test')", () => {
    var o2 = { test: 'foo' };
    var a  = new Atom(o);
    var c  = a.cursor();
    var d  = c.get("b", o2);
    var e  = d.get("test");

    it("should return a Cursor", () => {
      should(e).be.instanceof(Cursor);
    });

    context("deref()", () => {
      it("should return the nested default exact value", () => {
        should.deepEqual(e.deref(), "foo");
      });
    });

    context("swap('baz')", () => {
      let obj = e.swap("baz");

      it("should return the old value", () => {
        should.equal(obj, "foo");
      });

      it("should .deref() to the new exact value", () => {
        should.equal(e.deref(), "baz");
      });

      it("Should have added b: { test: 'baz' } to atom", () => {
        should.deepEqual(a.deref(), { a: { b: 42, c: "lol" }, d: ["e", "f", "g"], b: { test: 'baz' } });
      });

      it("should notify observers on Atom", () => {
        let observed = null;

        a.subscribe(v => {
          observed = v;
        });

        e.swap("str");

        should.deepEqual(observed, { a: { b: 42, c: "lol" }, d: ["e", "f", "g"], b: { test: "str" } });
      });
    });
  });
});
