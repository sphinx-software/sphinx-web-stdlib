import View from './View';
import {middleware} from "../Http";
import {singleton} from "../MetaInjector";
import {ViewFactoryInterface} from "../Fusion/ServiceContracts";

@singleton(ViewFactoryInterface)
@middleware()
export default class ViewRenderMiddleware {

    constructor(viewEngine) {
        this.viewEngine = viewEngine;
    }

    async handle(context, next) {
        context.view = this.viewEngine;

        await next();

        if (context.body instanceof View) {
            context.body  = await context.view.render(context.body);
            context.type  = 'html';
        }
    }
}

