import * as Koa from "koa";

// TODO: Arrays

const ok = 200;
const badRequest = 400;
const notFound = 404;
const internalServerError = 500;
const trace = (process?.env?.VALIDIZE_TRACE === "1");

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class NotFoundError extends Error {
    constructor (message:string) {
        super(message);
    }
}

export function createOptionalValidator<T>(validateExistingValue?: (x: unknown) => T) {
    return function (x: unknown) {
        if (x === undefined || x === null) {
            return undefined;
        } else if (validateExistingValue !== undefined) {
            return validateExistingValue(x);
        }
    };
}

export function createStringValidator(pattern: RegExp): (x: unknown) => string {
    return function (x) {
        if (typeof(x) === "string" && pattern.test(x)) {
            return x;
        } else {
            throw new ValidationError("Invalid string");
        }
    };
}

export function createFloatValidator(min: number, max: number, coerce?: boolean): (x: unknown) => number {
    return function (x) {
        let number = undefined;
        if (typeof(x) === "number") {
            number = x;
        } else if ((coerce === true) && typeof(x) === "string") {
            number = parseFloat(x);
        }
    
        if (number !== undefined && !isNaN(number) && number >= min && number <= max) {
            return number;
        } else {
            throw new ValidationError("Invalid number");
        }
    }
}

export function createIntegerValidator(min: number, max: number, coerce?: boolean): (x: unknown) => number {
    const validateFloat = createFloatValidator(min, max, coerce);
    return function (x) {
        const float = validateFloat(x);
        if (float === Math.floor(float)) {
            return float;
        } else {
            throw new ValidationError("Invalid integer");
        }
    };
}

export function createBooleanValidator(coerce?: boolean): (x: unknown) => boolean {
    return function (x) {
        if (typeof(x) === "boolean") {
            return x;
        } else if (coerce === true && typeof(x) === "string") {
            if (x === "true") {
                return true;
            } else if (x === "false") {
                return false;
            }
        }

        throw new ValidationError("Invalid Boolean");
    };
}

export type ValidatorMap<T> = {
    [P in keyof T]: (input: unknown) => T[P];
};

export function createValidator<T>(validator: ValidatorMap<T>): (input: unknown) => T {
    return function (input: unknown): T {
        if (typeof(input) === "object") {
            let result = {};
            for (let key in validator) {
                const fieldName = key as string;
                const validatedValue = validator[fieldName](input[fieldName]);
                if (validatedValue !== undefined) {
                    result[fieldName] = validatedValue;
                }
            }
    
            for (let key in input) {
                if (typeof(key) !== "string") {
                    throw new ValidationError("Invalid field");
                }
        
                const fieldName = key as string;
                if (validator[fieldName] === undefined) {
                    throw new ValidationError("Extraneous field");
                }
            }
    
            return result as T;
        }
        else {
            throw new ValidationError("Not an object");
        }
    };
}

type Request<TRouteParameters, TRequestQuery, TRequestBody> = {
    parameters: TRouteParameters;
    query: TRequestQuery;
    body: TRequestBody;
};

type HandlerOptions<TRouteParameters, TRequestQuery, TRequestBody, TResponseBody> = {
    validateParameters?: (parameters: any) => TRouteParameters,
    validateQuery?: (query: any) => TRequestQuery,
    validateBody?: (body: any) => TRequestBody,
    process: (request: Request<TRouteParameters, TRequestQuery, TRequestBody>, context: Koa.Context) => Promise<TResponseBody | undefined>
};

const validateEmpty = createValidator<{}>({});

export function handle<TRouteParameters, TRequestQuery, TRequestBody, TResponseBody>(
    options: HandlerOptions<TRouteParameters, TRequestQuery, TRequestBody, TResponseBody>
): Koa.Middleware {
    // Note: Assuming no next middleware
    const validateRouteParameters = options.validateParameters || validateEmpty;
    const validateRequestQuery = options.validateQuery || validateEmpty;
    const validateRequestBody = options.validateBody || validateEmpty;

    return async function (context: Koa.Context) {
        // Validate input
        try {
            const validatedInput: Request<TRouteParameters, TRequestQuery, TRequestBody> = {
                parameters: validateRouteParameters(context.params) as TRouteParameters,
                query: validateRequestQuery(context.query) as TRequestQuery,
                body: validateRequestBody(((context?.request as any)?.body) || {}) as TRequestBody
            };

            // Process the validated input
            try {
                const response = await options.process(validatedInput, context);
                if (response === undefined) {
                    context.body = "";
                } else {
                    context.body = JSON.stringify(response);
                }

                context.status = ok;
            } catch (e) {
                // Report errors
                context.body = "";
                if (e instanceof NotFoundError) {
                    context.status = notFound;
                } else if (e instanceof ValidationError) {
                    context.status = badRequest;
                } else {
                    context.status = internalServerError;
                }

                if (trace) {
                    console.error(`Failed (${context.stats}): ${e.message}`);
                }
            }
        } catch (e) {
            if (trace) {
                console.error(`Validation failed: ${e.message}`);
            }

            context.status = badRequest;
            context.body = "";
        }
    };
}
