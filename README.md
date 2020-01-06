# Validize

**Validize** is a tiny TypeScript middleware for validating JSON in Koa.

## Install
```
yarn add https://github.com/jaredkrinke/modules.git#validize-2.0.0
```

## Example

### Import

```typescript
import * as Validize from "validize";
```

### Input validation
Declare interfaces for your request and response formats.

Note that the request is made up of three parts:
* Route parameters (e.g. `:userId` from `/users/:userId`)
* Query string (e.g. `/users/jim?includeExtra=1`)
* Request body (in JSON format)

This example uses router parameters and the request body.

```typescript
interface PostRouteParameters {
    name: string;
}

interface PostBody {
    i: number;
    s?: string;
}
```

Then write functions (that throw on error) to validate that the request's JSON is valid and matches your interface (TypeScript will let you know if you miss any fields). Note that Validize has a number of helper functions for this purpose (see the API section for details).

Additionally, note that for route and query parameters, these are implicitly strings, so coercing them to integers and floats is necessary (see the `coerce` parameter in the API section).

```typescript
const validatePostParameters = Validize.createValidator<PostRouteParameters>({
    name: Validize.createStringValidator(/^[a-z]+$/),
})

const validatePostBody = Validize.createValidator<PostBody>({
    i: Validize.createIntegerValidator(1, 3),
    s: Validize.createOptionalValidator(Validize.createStringValidator(/^[a-f]+$/)),
})
```

This can all be leveraged in Koa middleware using `Validize.handle` as follows (note: this example uses `@koa/router` and `koa-bodyparser`):

```typescript
router.post("/post/:name", Validize.handle({
    validateParameters: validatePostParameters,
    validateBody: validatePostBody,
    process: async (request) => {
        const response: PostResponse = {
            name: request.parameters.name,
            i: request.body.i,
            s: request.body.s,
        };
        return response;
    }
}));
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
```typescript
type HandlerOptions<TRouteParameters, TRequestQuery, TRequestBody, TResponseBody> = {
    validateParameters?: (parameters: any) => TRouteParameters,
    validateQuery?: (query: any) => TRequestQuery,
    validateBody?: (body: any) => TRequestBody,
    process: (request: Request<TRouteParameters, TRequestQuery, TRequestBody>, context: Koa.Context) => Promise<TResponseBody | undefined>
};

Validize.handle<TRouteParameters, TRequestQuery, TRequestBody, TResponseBody>(
    options: HandlerOptions<TRouteParameters, TRequestQuery, TRequestBody, TResponseBody>
): Koa.Middleware {
```

1. Define an interface for route parameters, query parameters, the request body, and the response body
2. Implement validators for all of the request interfaces you created
3. Use `Validize.handle` to create middleware for validating the inputs and processing the validated input

See `example/example.ts` for an example.

#### Need more?
See the example and tests for more specific details/syntax.
