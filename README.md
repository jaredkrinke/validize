# Validize

**Validize** is a tiny TypeScript library for validating incoming JSON.

## Install
```
yarn add https://github.com/jaredkrinke/modules.git#validize-0.1.2
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

interface TopScore {
    initials: string;
    score: number;
}

type TopScoresResponse = TopScore[];
```

Then write functions (that throw on error) to validate that the request's JSON is valid and matches your request interface:

```typescript
const validateTopScoresRequest = Validize.createValidator<TopScoresRequest>({
    mode: Validize.createIntegerValidator(1, 3),
});
```

Usage could look like:

```typescript
const parsedRequest = validateTopScoresRequest(JSON.parse(request.body));
```

### API
* `Validize.createStringValidator(pattern: RegExp)`
* `Validize.createFloatValidator(min: number, max: number, coerce?: boolean)`
* `Validize.createIntegerValidator(min: number, max: number, coerce?: boolean)`
* `Validize.createValidator<T>(validator: ValidatorMap<T>)`

Note: `createValidator<T>` takes an interface as a type argument and expects an object with all of the properties of that interface filled in using validators. Object validators can be nested.

See the tests for more specific details/syntax.
