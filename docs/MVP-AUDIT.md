# Аудит и минимальная архитектура — 12.09.2026

Источник: текущий Git-репозиторий «Шаурма у Айхана» из сохранённого проекта, а не старый ZIP. При аудите были изменены README.md, app/globals.css, docs/PREVIEW.md. Стили дополнены, PREVIEW не менялся, прежний README сохранён в FRONTEND-BEFORE-MVP.md как историческая справка.

До изменений: React 19 + Vite 8, prerender HTML, меню из Glovo, локальная корзина, оформление через копирование списка/контактные ссылки. Backend, Telegram, форма клиента и антиспам отсутствовали. Контакты, часы, прямые цены заведения не подтверждены. SEO уже имел ownerVerified/indexable=false. Существовали Vercel config и локальный статический target .openai; размещение описано в PREVIEW как Vercel.

Выбрано: POST /api/orders как Vercel Node.js Function. UI отправляет ID/количество и данные формы. Цена, доступность, тариф и чат определяются сервером. Один Telegram sendMessage, без webhook, polling, кнопок, CRM и онлайн-оплаты. Redis REST — общий атомарный rate limit и ключи идемпотентности между инстансами. Без Redis запросы отклоняются.

Доставка собственная. config/ordering.ts содержит выключенный placeholder без выдуманных районов и цен. Меню и дизайн сохранены. До подтверждения данных выключены заказы и индексация.

Ограничение: Redis и Telegram не поддерживают общую транзакцию, exactly-once невозможно. До отправки ставится pending, после подтверждения Telegram — sent. При неопределённом результате повторная отправка блокируется; клиент обращается в заведение с номером. Ключи UUID живут 24 часа, одинаковое содержимое с новым ID блокируется 10 минут.

Официальные источники, проверенные 12.09.2026:
- [Vercel Node.js Function, Web fetch export](https://vercel.com/docs/functions/runtimes/node-js)
- [Telegram Bot API: sendMessage](https://core.telegram.org/bots/api#sendmessage)
- [Upstash Redis REST](https://upstash.com/docs/redis/features/restapi)
