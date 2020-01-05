import "mocha";
import * as assert from "assert";
import * as Validize from "../src/validize";

describe("Validize", () => {
    describe("String validation", () => {
        it("Pattern", () => {
            const validate = Validize.createStringValidator(/^[a-z]*$/i);
            assert.equal(validate("abc"), "abc");
            assert.equal(validate("aBc"), "aBc");
            assert.throws(() => { validate("aB1c") });

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate(3) });
            assert.throws(() => { validate({}) });
            assert.throws(() => { validate(true) });
        });
    });

    describe("Integer validation", () => {
        it("Exact", () => {
            const validate = Validize.createIntegerValidator(1, 3);
            assert.equal(validate(1), 1);
            assert.equal(validate(3), 3);

            assert.throws(() => { validate(1.5) });
            assert.throws(() => { validate(4) });
            assert.throws(() => { validate("2") });
            assert.throws(() => { validate("2.9") });

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate({}) });
            assert.throws(() => { validate(true) });
        });

        it("Coerced", () => {
            const validate = Validize.createIntegerValidator(1, 3, true);
            assert.equal(validate(1), 1);
            assert.equal(validate(3), 3);

            assert.throws(() => { validate(1.5) });
            assert.throws(() => { validate("2.9") });
            assert.throws(() => { validate(4) });

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate({}) });
            assert.throws(() => { validate(true) });
        });
    });

    describe("Float validation", () => {
        it("Exact", () => {
            const validate = Validize.createFloatValidator(1, 3);
            assert.equal(validate(1), 1);
            assert.equal(validate(1.5), 1.5);

            assert.throws(() => { validate(4) });
            assert.throws(() => { validate("2") });

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate({}) });
            assert.throws(() => { validate(true) });
        });

        it("Coerced", () => {
            const validate = Validize.createFloatValidator(1, 3, true);
            assert.equal(validate(1), 1);
            assert.equal(validate(1.5), 1.5);
            assert.equal(validate("2.9"), 2.9);
            assert.equal(validate("3"), 3);
            assert.throws(() => { validate(4) });

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate({}) });
            assert.throws(() => { validate(true) });
        });
    });

    describe("Object validation", () => {
        it("Empty", () => {
            const validate = Validize.createValidator<{}>({});
            assert.deepEqual(validate({}), {});

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate(1) });
            assert.throws(() => { validate("") });
            assert.throws(() => { validate(true) });
        });
    });

});

