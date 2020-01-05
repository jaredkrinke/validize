export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
    }
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

export function createNumberValidator(min: number, max: number): (x: unknown) => number {
    return function (x) {
        let number = undefined;
        if (typeof(x) === "number") {
            number = x;
        } else if (typeof(x) === "string") {
            number = parseInt(x);
        }
    
        if (number !== undefined && !isNaN(number) && number >= min && number <= max) {
            return number;
        } else {
            throw new ValidationError("Invalid number");
        }
    }
}

export type ValidatorMap<T> = {
    [P in keyof T]: (input: unknown) => T[P];
};

export function createValidator<T>(validator: ValidatorMap<T>): (input: unknown) => T {
    return function (input: unknown): T {
        if (typeof(input) === "object") {
            let result = {};
            for (let key in input) {
                if (typeof(key) !== "string") {
                    throw new ValidationError("Invalid field");
                }
        
                const fieldName = key as string;
                const fieldValidator = validator[fieldName];
                if (!fieldValidator) {
                    throw new ValidationError("Extraneous field");
                }
        
                result[fieldName] = fieldValidator(input[fieldName]);
            }
    
            for (let key in validator) {
                if (typeof(key) === "string") {
                    const fieldName = key as string;
                    if (input[fieldName] === undefined || input[fieldName] === null) {
                        throw new ValidationError("Missing field");
                    }
                }
            }
    
            return result as T;
        }
        else {
            throw new ValidationError("Not an object");
        }
    };
}
