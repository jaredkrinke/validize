# Validize

**Validize** is a tiny TypeScript middleware for validating JSON in Koa.

## Install
```
yarn add https://github.com/jaredkrinke/modules.git#validize-1.0.0
```

## Example

### Import

```typescript
import * as Validize from "validize";
```

### Input validation
Declare interfaces for your request and response formats, e.g.:

```typescript
interface TopScoresRequest {
    mode: number;
}
```

Then write functions (that throw on error) to validate that the request's JSON is valid and matches your interface (TypeScript will let you know if you miss any fields):

```typescript
const validateTopScoresRequest = Validize.createValidator<TopScoresRequest>({
    mode: Validize.createIntegerValidator(1, 3),
});
```

This can all be leveraged in Koa middleware as follows (note: this example uses `@koa/router` and `koa-bodyparser`):

```typescript
const validateSeed =  Validize.createStringValidator(/^[0-9a-f]{32}$/);

router.post(
    "/scores/:seed",
    Validize.validate((context) => {
        context.validated = validateTopScoresRequest(JSON.parse(context.request.rawBody));
        context.validated.seed = validateSeed(context.params.seed);
    }),
    (context) => {
        // Use context.validated to access the valid request object
    })
```

### API
#### Creating validators
* `Validize.createStringValidator(pattern: RegExp)`
* `Validize.createFloatValidator(min: number, max: number, coerce?: boolean)`
* `Validize.createIntegerValidator(min: number, max: number, coerce?: boolean)`
* `Validize.createBooleanValidator(coerce?: boolean): (x: unknown) => boolean`
* `Validize.createOptionalValidator<T>(validateExistingValue: (x: unknown) => T)`
* `Validize.createValidator<T>(validator: ValidatorMap<T>)`

Note: `createValidator<T>` takes an interface as a type argument and expects an object with all of the properties of that interface filled in using validators. Object validators can be nested.

#### Middleware
* `Validize.validate(validateInput: (context: Koa.Context) => void): Koa.Middleware`

#### Need more?
See the tests for more specific details/syntax.
