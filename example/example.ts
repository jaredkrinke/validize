import Koa from "koa";
import Router from "@koa/router";
import BodyParser from "koa-bodyparser";
import * as Validize from "../src/validize";

const router = new Router();

// GET (paramters only)
interface ParametersOnly {
    name: string;
}

const validateParametersOnly = Validize.createValidator<ParametersOnly>({
    name: Validize.createStringValidator(/^[a-z]+$/),
})

router.get("/paramsonly/:name", Validize.handle({
    validateParameters: validateParametersOnly,
    process: async (request) => {
        return `Name was ${request.parameters.name}`;
    }
}));

// GET (query only)
interface QueryOnly {
    option: number;
}

interface QueryOnlyResponse {
    chosenOption: number;
}

const validateQueryOnly = Validize.createValidator<QueryOnly>({
    option: Validize.createIntegerValidator(1, 3, true), // Note: Need to coerce from string since query (and route) parameters are always strings
})

router.get("/queryonly", Validize.handle({
    validateQuery: validateQueryOnly,
    process: async (request) => {
        const response: QueryOnlyResponse = {
            chosenOption: request.query.option,
        };
        return response;
    }
}));

// POST (route and body)
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

// Set up app and handler
const app = new Koa();
app.use(BodyParser({ extendTypes: { json: ["text/plain"] } }));
app.use(router.routes());

const port = 8888;
app.listen(port);
console.log(`Listening on ${port}`);
