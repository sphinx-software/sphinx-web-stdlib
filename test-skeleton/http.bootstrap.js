import fusion from './../Fusion/Fusion';
import config from './config';
import Container from '@sphinx-software/container';
import EventEmitter from 'events';

(async () => {

    const modules = await Promise.all(config.modules.map( module => import(module)));

    modules.forEach(module => fusion.use(module));

    let container = await fusion.activate(config, new Container(new EventEmitter()));
    let kernel    = await container.make('http.kernel');

    kernel.listen(config.http.port);
})().catch(console.error);

