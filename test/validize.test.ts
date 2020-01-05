import "mocha";
import * as assert from "assert";
import * as Validize from "../src/validize";

describe("Validize", () => {
    it("String validation", () => {
        const validateAlpha = Validize.createStringValidator(/^[a-z]*$/i);
        assert.equal(validateAlpha("abc"), "abc");
        assert.equal(validateAlpha("aBc"), "aBc");
        assert.throws(() => { validateAlpha("aB1c") });

        assert.throws(() => { validateAlpha(undefined) });
        assert.throws(() => { validateAlpha(3) });
        assert.throws(() => { validateAlpha({}) });
        assert.throws(() => { validateAlpha(true) });
    });

    it("Number validation", () => {
        const validateNumber = Validize.createNumberValidator(1, 3);
        assert.equal(validateNumber(1), 1);
        assert.equal(validateNumber("3"), 3);
        assert.throws(() => { validateNumber(4) });

        assert.throws(() => { validateNumber(undefined) });
        assert.throws(() => { validateNumber({}) });
        assert.throws(() => { validateNumber(true) });
    });

    // TODO: Integer validation
});

