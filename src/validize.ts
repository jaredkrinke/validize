import * as Koa from "koa";

// TODO: Arrays
// TODO: Booleans

const badRequest = 400;
const trace = (process?.env?.VALIDIZE_TRACE === "1");

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export function createOptionalValidator<T>(validateExistingValue: (x: unknown) => T) {
    return function (x: unknown) {
        if (x === undefined) {
            return undefined;
        } else {
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

export function validate(validateInput: (context: Koa.Context) => void): Koa.Middleware {
    return async function (context: Koa.Context, next: Koa.Next) {
        try {
            validateInput(context);
        } catch (err) {
            if (trace) {
                console.error(err);
            }

            context.status = badRequest;
            context.body = "";
            return;
        }
    
        return await next();
    }
}
