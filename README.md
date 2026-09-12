# Шаурма у Айхана

React + Vite витрина и checkout → серверный `/api/orders` → один рабочий Telegram-чат. Без онлайн-оплаты, CRM и кнопок статусов. Сохранены меню, фотографии, украинский интерфейс, тёмная палитра и лаймовый акцент.

**Код MVP подготовлен, приём реальных заказов и индексация выключены.** Меню из Glovo ещё не подтверждено для прямых заказов. Telegram и Redis требуют реальных настроек. Автотесты используют подставные сервисы и ничего не отправляют заведению.

## Локальная работа

Node 24.x, pnpm 11.19.0 (закреплён в packageManager).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Сайт: http://127.0.0.1:3000. В dev Vite обслуживает тот же handler `/api/orders`; без env и подтверждённых конфигов он возвращает 503. `pnpm start` — только просмотр статического dist, не production backend. Production разворачивать целым репозиторием на Vercel. Изменения серверного env требуют перезапуска dev.

## Данные и настройки

- `data/menu.json`: стабильный ID, название, цена в гривнах, доступность (`false` исключает заказ). Текущие цены Glovo нельзя считать подтверждёнными прямыми ценами. После сверки выставить ordering.menuVerified=true.
- `config/business.json`: телефон, адрес, часы, домен; ownerVerified=true после проверки владельцем.
- `config/ordering.ts`: enabled, pickupEnabled, deliveryEnabled; районы с enabled, feeMinor, minimumMinor, freeFromMinor, estimate. Деньги районов — целые копейки. null — неизвестно, 0 — подтверждённое отсутствие платы/минимума. freeFromMinor=null отключает бесплатный порог. Placeholder выключен.
- `api/orders.ts`, `server/`: endpoint, валидация, Redis, Telegram.
- `components/checkout.tsx`: форма в корзине: имя, международный телефон, район и адрес для доставки, комментарий, наличные/перевод на карту при получении.
- `app/globals.css`: прежние стили и оформление формы.

Поле orderChannel и lib/order.ts сохранены для совместимости, но больше не управляют checkout. Успешный ответ означает доставку сообщения в Telegram, а не подтверждение заказа заведением. Сотрудник звонит клиенту и уточняет время.

## Backend и защита

POST JSON: id (UUID v4), items:[{id,quantity}], name, phone, fulfillment:pickup|delivery, zoneId, address, comment, payment:cash|transfer, website:"" (honeypot), expectedTotalMinor. Цены и chat_id от клиента не используются. expectedTotalMinor сравнивается с серверным расчётом: при расхождении 409, требуется обновить страницу. До 20 разных позиций, до 20 порций каждой, тело до 16 KiB, ограниченная длина строк, отказ от управляющих символов. Телефон нормализуется; существование номера не проверяется.

Exact-origin allowlist, только POST application/json, без CORS. Origin не заменяет антиспам: Redis атомарно ограничивает IP пятью запросами за 10 минут. На Vercel используется доверенный x-vercel-forwarded-for, локально один loopback IP. При переносе на другой хостинг заменить определение доверенного IP; произвольный reverse proxy не поддерживается. При распределённой атаке включить Vercel Firewall/rate limits; CAPTCHA не интегрирована.

Redis хранит HMAC IP и состава заказа, UUID, pending/sent с TTL, без имени/телефона/адреса/комментария в открытом виде. HMAC-секрет случайный, от 32 символов. Rate TTL — 10 минут, защита одинакового заказа с новым UUID — 10 минут, ключ UUID — 24 часа. Изменённый payload со старым UUID отклоняется. Не удалять pending до проверки рабочего чата.

Токен бота и Redis — только серверные env. Никогда не помещать их в VITE_*, frontend, public или JSON-конфиг. Handler не логирует тело, секреты или ответы Telegram. Telegram получает простой текст без parse_mode и reply_markup, link preview отключён. Ответы API — no-store/noindex.

Коды: 400 неверные данные/доставка, 403 origin, 405 метод, 409 цена/конфликт/неопределённый результат, 413 размер, 415 формат, 429 лимит (Retry-After: 600), 503 отключённый сервис/сбой до отправки. Корзина не очищается при ошибке; после успеха показывается UUID и очищается корзина.

При таймауте Telegram или ошибке сохранения результата после отправки автоматического повтора нет: сообщение могло дойти. Клиент видит предупреждение и номер для уточнения. sessionStorage хранит только незавершённый UUID; после перезагрузки в той же вкладке повтор блокируется до явного подтверждения клиентом, что он уточнил результат. При закрытии вкладки/недоступном хранилище остаётся серверная защита. Exactly-once не обещается: Redis и Telegram не имеют общей транзакции. Нет очереди и автоматической повторной доставки.

## Telegram и production deployment

Пошаговая настройка BotFather, chat ID и безопасная проверка credentials: `docs/TELEGRAM-SETUP.md`. Проверка `node scripts/check-telegram.mjs` вызывает только `getMe`, не отправляет сообщение и не читает чат.

1. Владелец создаёт бота через BotFather на своём аккаунте. На рабочем устройстве открывает его и нажимает Start. Используется один личный рабочий чат; бот сам не начинает переписку.
2. Получить numeric chat ID из getUpdates после сообщения рабочего аккаунта (локально, token в env). Проверить выбранный ID; не публиковать token/ответы с персональными данными. Webhook не нужен. Другие интеграции не должны одновременно потреблять getUpdates при настройке.
3. Подключить долговременный Upstash Redis и сохранить HTTPS REST URL/token в серверные env Vercel. Не использовать временную тестовую базу.
4. Импортировать репозиторий в Vercel. Node 24.x, framework Vite, install/build/output из vercel.json; ENABLE_EXPERIMENTAL_COREPACK=1 для закреплённого pnpm. Function /api/orders: maxDuration 30 секунд. Root — каталог с package.json и api. Аккаунт, проект и домен этим изменением не создавались.
5. Заполнить env по .env.example: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ORDER_HASH_SECRET, ORDER_ALLOWED_ORIGINS. Origins — точные HTTPS origins домена и выбранного preview, без wildcard и пути. Preview — отдельный тестовый чат/Redis либо ORDERS_ENABLED=false. Production token не выдавать всем preview.
6. Подтвердить меню и бизнес-конфиг; включить ordering.enabled/menuVerified и business.ownerVerified. Первую проверку сделать с тестовым чатом, затем production. Включить ORDERS_ENABLED=true. Доставку разрешить после заполнения каждого активного района; самовывоз можно запустить отдельно.
7. На размещённом preview проверить pickup, delivery, обе оплаты, сумму, 429, ошибки, один Telegram message и отсутствие дубля. Привязать домен, установить SITE_URL и добавить origin в allowlist. Сделать redeploy. Проверить HTTPS, /api/orders, /robots.txt, canonical и заказ на рабочем устройстве.
8. Для остановки новых заказов установить ORDERS_ENABLED=false и redeploy; для отключения кнопки также ordering.enabled=false. При утечке перевыпустить токен через BotFather и обновить env.

Данные клиента поступают в Telegram заведения. Доступ к устройству и сроки удаления переписок определяет владелец. Сайт сообщает о передаче данных для обработки заказа. Согласовать текст о данных и порядок проверки неопределённых отправок.

## Домен и индексация

SITE_URL — HTTPS origin без пути/параметров. Без домена нет canonical и sitemap. Для индексации нужны все: домен, business.ownerVerified=true, business.indexable=true, SEO_INDEXING_ENABLED=true, VERCEL_ENV=production. Preview всегда noindex. По умолчанию indexable=false и SEO_INDEXING_ENABLED=false. Не включать до подтверждения контактов, часов, меню и доставки. Noindex не закрывает доступ к сайту.

## Что требуется от владельца

Телефон, адрес самовывоза, часы; меню с прямыми ценами и доступностью; районы своей доставки, стоимость, минимум, бесплатный порог (если есть), время; согласование фото; рабочий Telegram-аккаунт и бот; домен и доступ к DNS/хостингу; кто отвечает на заказы и звонит клиентам. Токены вводить только в секреты хостинга, не в чат/репозиторий.

## Проверки и источники

pnpm test: корзина, меню, SSR, endpoint с mock Redis/Telegram — валидация, цены/тарифы, конкурентные повторы, лимиты, таймауты, сбои. pnpm build: prerender, метаданные, изоляция сборки. Это не заменяет smoke test с реальными credentials после размещения. Исторические docs/FRONTEND-BEFORE-MVP.md и docs/PREVIEW.md описывают прежнюю frontend-версию.

Контракты: [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js), [Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage), [Upstash Redis REST](https://upstash.com/docs/redis/features/restapi). Аудит: docs/MVP-AUDIT.md.

