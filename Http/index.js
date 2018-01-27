import Koa from 'koa';
import Router from 'koa-router';
import {provider} from "../Fusion/Fusion";
import lodash from 'lodash';
import {HttpKernel, HttpRouter} from "../Fusion/ServiceContracts";

@provider()
export class HttpServiceProvider {

    constructor(container, fusion) {
        this.container = container;
        this.fusion    = fusion;
    }

    register() {
        this.container.singleton(HttpKernel, async () => {
            let kernel = new Koa();

            return kernel.use(async (ctx, next) => {
                ctx.container = this.container;
                await next();
            });
        });
    }

    async boot() {
        let kernel = await this.container.make(HttpKernel);
        let config = await this.container.make('config');

        config.http.middlewares.forEach(middleware => {
            if (middleware.prototype && lodash.isFunction(middleware.prototype.handle)) {
                this.container.make(middleware).then(realMiddleware => {
                    kernel.use( (context, next) => realMiddleware.handle(context, next));
                })
            } else {
                kernel.use(middleware);
            }
        });

        let middlewares = this.fusion.getByManifest('http.kernelMiddleware');

        for (let index = 0; index < middlewares.length; index++) {
            const Symbol   = middlewares[index];

            let middleware = await this.container.make(Symbol);

            kernel.use( (context, next) => middleware.handle(context, next));
        }
    }
}

@provider()
export class HttpRouterServiceProvider {
    constructor(container, fusion) {
        this.container = container;
        this.fusion    = fusion;
    }

    register() {
        this.container.singleton(HttpRouter, async () => {
            let config = await this.container.make('config');

            return new Router(config.http.router);
        });
    }

    async boot() {
        let controllers = this.fusion.getByManifest('http.controller');
        let router      = await this.container.make(HttpRouter);

        await controllers.map(Controller => this.bindController(router, Controller));
    }

    async bindController(router, Controller) {
        let controller = await this.container.make(Controller);

        let controllerActionNames = Object.getOwnPropertyNames(Controller.prototype)
            .filter(methodName => Reflect.hasMetadata('http.action', controller, methodName));

        for (let index = 0; index < controllerActionNames.length; index++) {
            let actionName  = controllerActionNames[index];
            let metadata    = Reflect.getMetadata('http.action', controller, actionName);
            let middlewares = await Promise.all(metadata.middlewares.map(middleware => this.container.make(middleware)));

            router[metadata.method](
                // The route name
                `${Controller.name}@${actionName}`,

                // The route url
                metadata.url,

                // Middleware handlers
                ...middlewares.map(middleware => (context, next) => middleware.handle(context, next)),

                // Controller's action
                (context, next) => controller[actionName](context, next));
        }
    }
}

export function middleware(value) {
    return Reflect.metadata('http.kernelMiddleware', value);
}

export function controller(prefix = '') {
    return Reflect.metadata('http.controller', prefix);
}

export function action(method, url, middlewares = []) {
    return Reflect.metadata('http.action', {
        method      : method,
        url         : url,
        middlewares : middlewares
    });
}

export function get(url, middlewares = []) {
    return Reflect.metadata('http.action', {
        method      : 'get',
        url         : url,
        middlewares : middlewares
    });
}

export function post(url, middlewares = []) {
    return Reflect.metadata('http.action', {
        method      : 'post',
        url         : url,
        middlewares : middlewares
    });
}

export function put(url, middlewares = []) {
    return Reflect.metadata('http.action', {
        method      : 'put',
        url         : url,
        middlewares : middlewares
    });
}

export function del(url, middlewares = []) {
    return Reflect.metadata('http.action', {
        method      : 'del',
        url         : url,
        middlewares : middlewares
    });
}