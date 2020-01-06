import "mocha";
import assert from "assert";
import * as Validize from "../src/validize";
import * as Koa from "koa";

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

    describe("Boolean validation", () => {
        it("Exact", () => {
            const validate = Validize.createBooleanValidator();
            assert.equal(validate(true), true);
            assert.equal(validate(false), false);

            assert.throws(() => { validate("true") });
            assert.throws(() => { validate("false") });

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate({}) });
            assert.throws(() => { validate(1) });
        });

        it("Coerced", () => {
            const validate = Validize.createBooleanValidator(true);
            assert.equal(validate(true), true);
            assert.equal(validate(false), false);

            assert.equal(validate("true"), true);
            assert.equal(validate("false"), false);

            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate({}) });
            assert.throws(() => { validate(1) });
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

        it("Interface", () => {
            interface SomeInterface {
                i: number;
                f: number;
                s: string;
            }

            const validate = Validize.createValidator<SomeInterface>({
                i: Validize.createIntegerValidator(1, 3),
                f: Validize.createFloatValidator(0, 1),
                s: Validize.createStringValidator(/^[0-9]*$/),
            });
            const valid: SomeInterface = {
                i: 2,
                f: 0.7,
                s: "1234",
            };

            assert.deepEqual(validate(valid), valid);

            assert.throws(() => { validate({}) });
            assert.throws(() => { validate({i: 5, s: "123"}) });
            assert.throws(() => { validate({i: 5, f: 2, s: "123"}) });
            assert.throws(() => { validate({i: 3, f: 0.5, s: "123", extra: true}) });
            assert.throws(() => { validate("") });
            assert.throws(() => { validate(1) });
            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate(true) });
        });

        it("Optional", () => {
            interface SomeInterface {
                i: number;
                f?: number;
            }

            const validate = Validize.createValidator<SomeInterface>({
                i: Validize.createIntegerValidator(1, 3),
                f: Validize.createOptionalValidator(Validize.createFloatValidator(0, 1)),
            });

            const valid1: SomeInterface = {
                i: 2,
            };

            const valid2: SomeInterface = {
                i: 2,
                f: 0.7,
            };

            const valid3: SomeInterface = {
                i: 2,
                f: null,
            };

            assert.deepEqual(validate(valid1), valid1);
            assert.deepEqual(validate(valid2), valid2);
            assert.deepEqual(validate({ i: 2, f: null }), { i: 2 }); // Note: null changes to undefined

            assert.throws(() => { validate({}) });
            assert.throws(() => { validate({i: 2, f: 0.7, extra: "123"}) });
            assert.throws(() => { validate("") });
            assert.throws(() => { validate(1) });
            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate(true) });
        });

        it("Nested", () => {
            interface Inner {
                i: number;
                s: string;
            }

            interface Outer {
                i: number;
                inner: Inner;
            }

            const validate = Validize.createValidator<Outer>({
                i: Validize.createIntegerValidator(1, 3),
                inner: Validize.createValidator<Inner>({
                    i: Validize.createIntegerValidator(1, 10),
                    s: Validize.createStringValidator(/^[0-9]*$/),
                })
            });

            const valid: Outer = {
                i: 3,
                inner: {
                    i: 10,
                    s: "567",
                },
            };

            assert.deepEqual(validate(valid), valid);

            assert.throws(() => { validate({}) });
            assert.throws(() => { validate({i: 3, inner: {}}) });
            assert.throws(() => { validate({i: 3, inner: {i: 5}}) });
            assert.throws(() => { validate({i: 3, inner: {i: 5, s: "a"}}) });
            assert.throws(() => { validate("") });
            assert.throws(() => { validate(1) });
            assert.throws(() => { validate(undefined) });
            assert.throws(() => { validate(true) });
        });
    });

    describe("Handler", () => {
        describe("POST (route and body)", () => {
            interface PostParameters {
                name: string;
            }
    
            interface PostBody {
                i: number;
                s?: string;
            }
    
            interface PostResponse {
                name: string;
                i: number;
                s?: string;
            }
    
            const validatePostParameters = Validize.createValidator<PostParameters>({
                name: Validize.createStringValidator(/^[a-z]+$/),
            })
    
            const validatePostBody = Validize.createValidator<PostBody>({
                i: Validize.createIntegerValidator(1, 3),
                s: Validize.createOptionalValidator(Validize.createStringValidator(/^[a-f]+$/)),
            })
    
            let ranProcess = false;
            let processedParameters: any;
            let processedBody: any;            
            const middleware = Validize.handle({
                validateParameters: validatePostParameters,
                validateBody: validatePostBody,
                process: async (request) => {
                    ranProcess = true;
                    processedParameters = request.parameters;
                    processedBody = request.body;
                    const response: PostResponse = {
                        name: request.parameters.name,
                        i: request.body.i,
                        s: request.body.s,
                    };
                    return response;
                }
            });

            it("Valid", async () => {
                let context = {
                    params: { name: "abc" },
                    query: {},
                    request: {
                        body: {
                            i: 2,
                        },
                    },
                };

                ranProcess = false;
                processedParameters = undefined;
                processedBody = undefined;
                await middleware(context as unknown as Koa.Context, async () => {});
        
                assert.equal(ranProcess, true);
                assert.deepEqual(processedParameters, context.params);
                assert.deepEqual(processedBody, context.request.body);
            });

            it("Invalid (empty)", async () => {
                let context = {
                    params: { name: "abc" },
                    query: {},
                    request: {
                        body: {
                        },
                    },
                };

                ranProcess = false;
                await middleware(context as unknown as Koa.Context, async () => {});       
                assert.equal(ranProcess, false);
            });

            it("Invalid integer", async () => {
                let context = {
                    params: { name: "abc" },
                    query: {},
                    request: {
                        body: {
                            i: 5,
                        },
                    },
                };

                ranProcess = false;
                await middleware(context as unknown as Koa.Context, async () => {});       
                assert.equal(ranProcess, false);
            });
        });
    });
});

