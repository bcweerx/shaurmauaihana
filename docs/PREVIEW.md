# Подготовка preview — 09.09.2026

Статус: временный публичный preview создан и проверен после входа в Vercel. Production deployment, custom domain и индексация не включались.

## Обязательные правки бренда

Единственное название: **Шаурма у Айхана**.

- `config/business.json` — основное название и описание.
- `components/brand.tsx` — видимая надпись логотипа в header/footer; aria-label берётся из config.
- `sections/header.tsx` — название в мобильной панели теперь берётся из config.
- `sections/hero.tsx` — название в eyebrow и строке под hero, термин «шаурма» в описании и alt.
- `sections/contacts.tsx` — title карты берётся из config.
- `sections/menu-section.tsx`, `sections/about.tsx` — единообразное название блюда в пользовательских текстах.
- `index.html` — title и description локальной страницы.
- `scripts/prepare-site.mjs` — production title, OG и Restaurant JSON-LD уже используют `business.name`; после пересборки содержат новое название. Уточнён alt OG-изображения.
- `components/cart-drawer.tsx`, `sections/footer.tsx` — название и текст копируемого заказа обновлены через конфиг, отдельного изменения этих файлов не требовалось.
- `README.md`, `docs/SOURCES.md` — название и описание состояния hero.

Подпись AI в hero была HTML-overlay `<span className="photo-note">`. Элемент удалён из `sections/hero.tsx`, все четыре набора правил `.photo-note` удалены из `app/globals.css`; alt hero описывает блюдо. Файлы `public/shawarma-hero.webp` и `public/shawarma-hero-small.webp` не изменены. В изображении нет вшитой AI-подписи. Сведения о происхождении изображения сохранены в документации и существующем footer.

## Vercel

В `vercel.json` подтверждены `framework: "vite"`, `buildCommand: "pnpm run build"`, `outputDirectory: "dist"`. Конфигурация не менялась.

Минимальная настройка окружения: `package.json` закрепляет Node **24.x**, соответствующий реально проверенному локальному Node 24.19.0; `pnpm@11.19.0` уже закреплён через `packageManager`. README и launcher обновлены под эту версию. CLI установлен только во временный кеш; зависимости приложения и lockfile не менялись.

Для build планируется `ENABLE_EXPERIMENTAL_COREPACK=1`, чтобы использовать указанную версию pnpm ([Corepack на Vercel](https://vercel.com/docs/builds/configure-a-build#corepack)). Само значение ещё не установлено в аккаунте. Node 24.x поддерживается [Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

После авторизации выполнен только временный preview deployment:

- URL: https://preview-source-auparodre-artemkovko-3474.vercel.app/
- inspect: https://vercel.com/artemkovko-3474/preview-source/3yxudDKtJSCtguRVqxPbXuUuoDsd
- deployment id: `dpl_3yxudDKtJSCtguRVqxPbXuUuoDsd`
- состояние: `READY`, `target: null`
- custom domain и `--prod` не использовались
- build: Vite / `pnpm run build` / `dist`

Удалённая проверка подтвердила главную страницу, меню, изображения, мобильную навигацию, поиск, фильтры, корзину с восстановлением после reload, отсутствие console errors и горизонтального overflow. После коммерческой полировки CTA без подключённого канала говорят «Зібрати замовлення», мобильные категории используют один компактный select, неподтверждённые контактные поля скрыты, а AI-пометка удалена из footer. HTML публичной страницы содержит `noindex,nofollow`. В локально собранном `dist/robots.txt` сохранено `User-agent: *` и `Disallow: /`; прямое открытие robots endpoint встроенный браузер блокирует как служебный URL.

## Последний прогон

| Команда | Результат |
| --- | --- |
| `pnpm typecheck` | PASS, exit 0 |
| `pnpm lint` | PASS, Oxlint, exit 0 |
| `pnpm test` | PASS, 8/8, exit 0 |
| `pnpm build` | PASS, exit 0; prerender и check-build пройдены |

Финальный прогон выполнен после правок бренда, удаления подписи и закрепления Node 24.x. Предупреждений о версии Node в нём нет. Состояние сохранено: `ownerVerified: false`, `indexable: false`, `orderChannel: "none"`; HTML `noindex,nofollow`, robots `Disallow: /`. Backend, БД, авторизация посетителей, платежи и Telegram-бот не добавлены.

Git: checkpoint `de56ac7`; изменения cleanup и текущего этапа находятся в рабочем дереве, нового коммита или push не было. Служебный результат CLI dry-run хранится только в игнорируемом `work/`; токены в исходники не записаны.
