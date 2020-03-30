import { App, ComponentPublicInstance, FunctionDirective } from 'vue'
import { Path } from './path'
import { Locale } from './runtime/context'
import { GlobalI18nSymbol, I18nComposer } from './composition'
import { VueI18n, createI18n, VueI18nOptions, TranslateResult, DateTimeFormatResult, NumberFormatResult } from './i18n'
import { Interpolate, Number } from './components'
import { hook as vT } from './directive'

export type LegacyVueI18n = {
  $i18n: VueI18n
  $t: (key: Path, ...values: unknown[]) => TranslateResult
  $tc: (key: Path, ...values: unknown[]) => TranslateResult
  $te: (key: Path, locale?: Locale) => boolean
  $d: (value: number | Date, ...args: unknown[]) => DateTimeFormatResult
  $n: (value: number, ...args: unknown[]) => NumberFormatResult
}

export function applyPlugin (app: App, legacyI18n: VueI18n, composer: I18nComposer): void {
  // install components
  app.component(Interpolate.name, Interpolate)
  app.component(Number.name, Number)

  // install directive
  app.directive('t', vT as FunctionDirective) // TODO:

  // setup global provider
  app.provide(GlobalI18nSymbol, composer)

  // supports compatibility for vue-i18n legacy APIs
  app.mixin({
    beforeCreate (this: ComponentPublicInstance<LegacyVueI18n>) {
      // TODO: should resolve type inference
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = this.$options

      if (options.i18n) { // component local i18n
        const optionsI18n = options.i18n as VueI18nOptions
        this.$i18n = createI18n(optionsI18n, composer)
      } else if (this.$root && this.$root.proxy) { // root i18n
        // TODO: should resolve type inference
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance: any = this.$root.proxy
        this.$i18n = instance.$i18n || legacyI18n
      } else if (this.$parent && this.$parent.proxy) { // parent i18n
        // TODO: should resolve type inference
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance: any = this.$parent.proxy
        this.$i18n = instance.$i18n || legacyI18n
      } else {
        this.$i18n = legacyI18n
      }

      // define vue-i18n legacy APIs
      this.$t = (key: Path, ...values: unknown[]): TranslateResult => this.$i18n.t(key, ...values)
      this.$tc = (key: Path, ...values: unknown[]): TranslateResult => this.$i18n.tc(key, ...values)
      this.$te = (key: Path, locale?: Locale): boolean => this.$i18n.te(key, locale)
      this.$d = (value: number | Date, ...args: unknown[]): DateTimeFormatResult => this.$i18n.d(value, ...args)
      this.$n = (value: number, ...args: unknown[]): NumberFormatResult => this.$i18n.n(value, ...args)
    }
  })
}