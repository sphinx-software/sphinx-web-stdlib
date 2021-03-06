import {provider} from "../Fusion";
import {Config, TranslatorInterface, ViewEngineInterface} from "../ServiceContracts";
import Translator from "./Translator";
import i18next from 'i18next';
import {NunjucksEngine} from "../View/NunjucksEngine";
import {TranslateViewFilter} from "./TranslateViewFilter";


@provider()
export default class I18nProvider {

    constructor(container, fusion) {
        this.container = container;
        this.fusion    = fusion;
    }

    register() {
        this.container.singleton(TranslatorInterface, async () => {
            let config = await this.container.make(Config);
            i18next.use(config.i18n.backend.type).init(config.i18n);
            return new Translator(i18next);
        });

        this.container.singleton(
            TranslateViewFilter,
            async () => new TranslateViewFilter(await this.container.make(TranslatorInterface))
        );
    }

    async boot() {

        let engine = await this.container.make(ViewEngineInterface);

        if (engine instanceof NunjucksEngine) {
            engine.addFilter('translate', await this.container.make(TranslateViewFilter));
        }
    }
}
