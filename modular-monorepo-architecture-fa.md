# معماری ماژولار و استاندارد Monorepo پروژه

> نسخه: 1.0\
> تاریخ: 2026-11-05\
> وضعیت: پیشنهاد معماری مبنا\
> فناوری‌های هدف: TypeScript، NestJS، pnpm Workspaces

## 1. هدف سند

این سند قواعد ساختاردهی، مالکیت، وابستگی و دسترسی بین Packageها را در یک
Monorepo ماژولار تعریف می‌کند. هدف، ایجاد مرزهای روشن بین قابلیت‌های
کسب‌وکار، جلوگیری از وابستگی به جزئیات پیاده‌سازی سایر بخش‌ها، و فراهم کردن
امکان بررسی خودکار معماری در زمان توسعه و CI است.

اصول این سند برای پروژه‌ای با یک Composition Root و چند Feature مستقل
طراحی شده است؛ هر Feature می‌تواند شامل یک یا چند Submodule باشد.

## 2. واژگان و مفاهیم

### 2.1. Monorepo

یک مخزن کد که چند Package مستقل را نگهداری می‌کند. قرار گرفتن Packageها
در یک مخزن به معنی مجاز بودن وابستگی مستقیم میان همه آن‌ها نیست.

### 2.2. Package

واحد مستقل مدیریت وابستگی و انتشار داخلی در pnpm workspace. هر Package
باید `package.json`، نام مشخص و وابستگی‌های صریح خود را داشته باشد.

### 2.3. Feature

یک قابلیت یا حوزه کسب‌وکار در سطح بالای معماری. در این پروژه، Featureها
معمولاً با Bounded Contextهای دامنه هم‌راستا هستند؛ با این حال، هر پوشه یا
Package الزاماً یک Bounded Context مستقل نیست.

### 2.4. Submodule

یک بخش مسئولیت‌پذیر درون یک Feature که از نظر مفهومی تحت مالکیت Feature
والد قرار دارد. Submodule می‌تواند API و Impl مستقل داشته باشد، اما
استقلال فنی آن به معنی استقلال مالکیت دامنه‌ای نیست.

### 2.5. API Package

قرارداد عمومی یک Feature یا Submodule. شامل مواردی است که مصرف‌کنندگان
مجاز برای استفاده از قابلیت آن بخش نیاز دارند؛ مانند interfaceها،
typeها، DTOهای قراردادی، tokenهای تزریق وابستگی و قراردادهای
پیام/رویداد.

API نباید شامل جزئیات اجرایی، دسترسی مستقیم به دیتابیس، Repositoryهای
داخلی یا وابستگی به Impl باشد.

### 2.6. Impl Package

پیاده‌سازی داخلی قراردادهای یک Feature یا Submodule. این Package می‌تواند
شامل Application Serviceها، Domain Modelها، Repositoryها، Adapterها و
NestJS Moduleهای پیاده‌سازی باشد.

### 2.7. HTTP Package

لایه ورودی HTTP یک Feature، شامل Controllerها، Schemaهای ورودی/خروجی
HTTP، Guardها و تبدیل درخواست به قراردادهای Application. این لایه نباید
به Impl داخلی Featureهای دیگر وابسته شود.

### 2.8. Composition Root

نقطه‌ای که اجزای برنامه در آن به یکدیگر متصل و پیکربندی می‌شوند. در این
معماری، `app` نقش Composition Root را دارد و تنها استثنای اصلی در دسترسی
به Packageهای Impl محسوب می‌شود.

## 3. اصول معماری

قواعد زیر مبنای تصمیم‌گیری هستند:

1.  **Explicit Dependencies:** هر Package باید وابستگی‌های مستقیم خود را
    در `package.json` تعریف کند.
2.  **Public Contracts:** ارتباط بین Packageهای مستقل فقط از طریق API
    Package انجام می‌شود.
3.  **Implementation Hiding:** Impl و HTTP یک Feature برای Featureهای
    دیگر قابل دسترسی نیستند.
4.  **Ownership:** مالکیت مفاهیم و قوانین دامنه با Feature والد باقی
    می‌ماند؛ ایجاد API مستقل، مالکیت دامنه‌ای جدید ایجاد نمی‌کند.
5.  **Dependency Direction:** وابستگی باید به سمت قراردادها و
    abstractionها باشد، نه به سمت جزئیات پیاده‌سازی.
6.  **Composition at the Edge:** اتصال Implها و ساخت گراف اجرایی برنامه
    در `app` انجام می‌شود.
7.  **No Deep Imports:** مصرف‌کننده فقط از Entry Pointهای رسمی Package
    استفاده می‌کند.
8.  **No Cross-Package Source Imports:** وارد کردن فایل‌های `src` یک
    Package دیگر از طریق مسیر نسبی یا alias ممنوع است.
9.  **Acyclic Dependencies:** چرخه وابستگی بین Packageها مجاز نیست.
10. **Architecture as Code:** قواعد معماری باید با ابزارهای خودکار در
    lint و CI کنترل شوند.

## 4. ساختار پیشنهادی مخزن

ساختار سطح بالا:

``` text
repo/
├── apps/
│   └── api/
│       ├── package.json
│       └── src/
│           ├── main.ts
│           └── app.module.ts
│
├── features/
│   ├── warehouse/
│   │   ├── api/
│   │   │   ├── package.json
│   │   │   └── src/
│   │   │       └── index.ts
│   │   ├── impl/
│   │   │   ├── package.json
│   │   │   └── src/
│   │   │       └── index.ts
│   │   ├── stock/
│   │   │   ├── api/
│   │   │   │   ├── package.json
│   │   │   │   └── src/
│   │   │   │       └── index.ts
│   │   │   └── impl/
│   │   │       ├── package.json
│   │   │       └── src/
│   │   │           └── index.ts
│   │   └── procurement/
│   │       ├── api/
│   │       │   ├── package.json
│   │       │   └── src/
│   │       │       └── index.ts
│   │       └── impl/
│   │           ├── package.json
│   │           └── src/
│   │               └── index.ts
│   │
│   ├── order/
│   │   ├── api/
│   │   ├── impl/
│   │   └── http/
│   │
│   └── sales/
│       ├── api/
│       ├── impl/
│       └── http/
│
├── infrastructure/
│   ├── db-drizzle/
│   ├── messaging/
│   └── ...
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── ...
```

### 4.1. نکات ساختاری

-   `features/` محل Featureهای کسب‌وکار است.
-   `infrastructure/` شامل پیاده‌سازی فناوری‌های زیرساختی مشترک است؛ مانند
    اتصال دیتابیس، پیام‌رسانی و ابزارهای فنی.
-   `apps/` شامل برنامه‌های اجرایی و Composition Root است.
-   `api/`، `impl/` و `http/` در صورت نیاز Packageهای مستقل هستند.
-   یک Submodule می‌تواند فقط API داشته باشد، یا API و Impl، یا در صورت
    نیاز ساختار دیگری داشته باشد.
-   هر Package باید هویت و `package.json` مستقل داشته باشد.
-   ساختار پوشه‌ای به‌تنهایی مرز امنیتی یا معماری ایجاد نمی‌کند؛ قواعد
    وابستگی باید جداگانه enforce شوند.

## 5. Feature و Submodule: مالکیت و مرزبندی

### 5.1. رابطه مالکیت

Feature والد مالک مفاهیم، سیاست‌ها و قواعد کسب‌وکار مربوط به Submoduleهای
خود است. Submodule مسئولیت مشخصی را در محدوده آن Feature پیاده‌سازی
می‌کند.

برای مثال:

-   `Warehouse` مالک مفهوم انبار و موجودی فیزیکی در انبار است.
-   `Stock` مسئول مدیریت موجودی فیزیکی و عملیات مرتبط با آن است.
-   `Procurement` مسئول فرآیند تأمین و دریافت کالا است.

در این مدل، `Stock` لزوماً یک Bounded Context مستقل نیست؛ بلکه Submodule
متعلق به `Warehouse` است. وجود `stock-api` به‌عنوان Package مستقل صرفاً یک
تصمیم برای تعریف قرارداد و کنترل وابستگی فنی است.

### 5.2. چه زمانی چیزی Submodule است؟

یک قابلیت بهتر است Submodule باقی بماند اگر:

-   مفهوم آن از نظر دامنه‌ای تحت مالکیت Feature والد باشد.
-   چرخه عمر و قواعد اصلی آن به Feature والد وابسته باشد.
-   جداسازی آن به‌عنوان Bounded Context مستقل، مرز مالکیت واقعی ایجاد
    نکند.
-   والد همچنان مسئول هماهنگی یا تضمین قواعد کلان آن باشد.

یک قابلیت زمانی می‌تواند Feature یا Bounded Context مستقل شود که مالکیت
مدل، زبان مشترک، قواعد و چرخه تغییر آن واقعاً مستقل شده باشد؛ نه صرفاً به
دلیل اینکه چند Feature از API آن استفاده می‌کنند.

### 5.3. API عمومی، مالکیت را تغییر نمی‌دهد

ممکن است `stock-api` توسط `order-impl` یا `sales-impl` مصرف شود. این
موضوع به معنی انتقال مالکیت Stock به Order یا Sales نیست. مالکیت همچنان
با Warehouse است و تغییرات قرارداد باید توسط مالک آن مدیریت شود.

## 6. قرارداد API

### 6.1. محتوای مجاز API

API Package می‌تواند شامل موارد زیر باشد:

-   Interfaceهای سرویس و Query/Command API
-   Typeها و مدل‌های قراردادی
-   Discriminated Unionها و Result Typeها
-   Injection Tokenها
-   Event و Message Contractها
-   قراردادهای لازم برای ثبت NestJS Module، در صورتی که مصرف‌کننده واقعاً
    به آن‌ها نیاز داشته باشد

نمونه مفهومی:

``` ts
export interface StockQueryApi {
  getAvailableQuantity(stockId: string): Promise<number>;
}

export interface StockMutationApi {
  increase(items: IncreaseStockItem[]): Promise<void>;
  decrease(items: DecreaseStockItem[]): Promise<void>;
}

export const STOCK_QUERY_API = Symbol('STOCK_QUERY_API');
export const STOCK_MUTATION_API = Symbol('STOCK_MUTATION_API');
```

این نمونه صرفاً شکل قرارداد را نشان می‌دهد؛ جزئیات نام‌گذاری و نوع داده
باید با مدل واقعی دامنه هماهنگ باشد.

### 6.2. موارد ممنوع در API

API نباید موارد زیر را صادر کند:

-   کلاس‌های Repository داخلی
-   Drizzle schema یا tableهای داخلی، مگر اینکه واقعاً بخشی از قرارداد
    پایدار و مشترک باشند
-   Entityهای قابل تغییر داخلی که جزئیات مدل دامنه را افشا می‌کنند
-   کلاس‌های Impl یا Serviceهای اجرایی
-   مسیر فایل‌های داخلی
-   توابعی که صرفاً برای استفاده داخلی طراحی شده‌اند
-   وابستگی به Packageهای Impl

### 6.3. API باید مصرف‌کننده‌محور باشد

قرارداد عمومی باید نیاز مصرف‌کنندگان را بیان کند، نه ساختار داخلی
پیاده‌سازی را. برای مثال، به‌جای ارائه Repository و اجازه اجرای Query
دلخواه، یک عملیات دامنه‌ای روشن مانند `getAvailableQuantity` ارائه شود.

### 6.4. Versioning و سازگاری

-   تغییرات API باید با توجه به همه مصرف‌کنندگان آن بررسی شوند.
-   تغییر ناسازگار باید آگاهانه و ترجیحاً با مهاجرت مرحله‌ای انجام شود.
-   API نباید صرفاً برای راحتی یک مصرف‌کننده به جزئیات داخلی آن وابسته
    شود.
-   مالک API مسئول مستندسازی رفتار، خطاها و معنای عملیات است.

## 7. قواعد وابستگی بین Packageها

### 7.1. قانون عمومی

هر Feature فقط مجاز است به API Packageهای Featureهای دیگر وابسته شود.
وابستگی مستقیم به `impl` یا `http` Feature دیگر ممنوع است.

### 7.2. ماتریس دسترسی پیشنهادی

  ------------------------------------------------------------------------------
  مبدأ                 مقصد                               وضعیت توضیح
  -------------------- ------------------ --------------------- ----------------
  `order-impl`         `stock-api`                         مجاز مصرف قرارداد
                                                                عمومی Stock

  `order-impl`         `warehouse-api`                     مجاز مصرف قرارداد
                                                                عمومی Warehouse

  `order-impl`         `stock-impl`                       ممنوع دسترسی به جزئیات
                                                                پیاده‌سازی

  `order-impl`         `warehouse-impl`                   ممنوع دسترسی به جزئیات
                                                                پیاده‌سازی

  `procurement-impl`   `stock-api`                         مجاز درخواست عملیات
                                                                موجودی از طریق
                                                                قرارداد

  `procurement-impl`   `stock-impl`                       ممنوع دور زدن قرارداد

  `warehouse-impl`     `stock-api`                         مجاز استفاده از
                                                                قرارداد
                                                                Submodule

  `warehouse-impl`     `stock-impl`             ممنوع طبق سیاست والد نیز از
                                                      سخت‌گیرانه قرارداد استفاده
                                                                می‌کند

  `stock-impl`         `stock-api`                         مجاز پیاده‌سازی
                                                                قرارداد خودش

  `app`                Feature API                         مجاز مصرف قراردادها و
                                                                ساخت برنامه

  `app`                Feature Impl                        مجاز Composition Root
                                                                و اتصال
                                                                پیاده‌سازی

  `app`                Feature HTTP                        مجاز ثبت Controllerها
                                                                و لایه ورودی

  `feature-api`        هر Feature Impl                    ممنوع قرارداد نباید به
                                                                پیاده‌سازی وابسته
                                                                باشد

  `feature-api`        Infrastructure                     ممنوع قرارداد نباید به
                       Impl                                     فناوری اجرایی
                                                                وابسته باشد
  ------------------------------------------------------------------------------

**سیاست مهم:** در این معماری، حتی Feature والد نیز برای ارتباط با
Submodule از API آن استفاده می‌کند. این سیاست باعث می‌شود مرزهای Packageها
یکدست باشند و هیچ استثنای پنهانی برای دسترسی به Impl ایجاد نشود.

اگر در آینده نیاز واقعی به دسترسی داخلی مشترک وجود داشت، باید آن را
به‌عنوان یک قاعده محدود و مستند تعریف کرد؛ نه اینکه دسترسی آزاد به Impl
والد یا Submoduleها داده شود.

### 7.3. وابستگی Impl به API خودش

`stock-impl` می‌تواند و معمولاً باید `stock-api` را وابسته داشته باشد تا
قرارداد خودش را پیاده‌سازی کند.

``` text
stock-impl ───────> stock-api
```

### 7.4. وابستگی API به API دیگر

APIها بهتر است تا حد ممکن مستقل باشند. اگر یک قرارداد واقعاً به نوعی از
API دیگر نیاز دارد، وابستگی API-to-API فقط در صورت ضرورت دامنه‌ای و با
بررسی چرخه وابستگی مجاز است.

از ایجاد زنجیره‌ای از وابستگی‌های قراردادی که باعث coupling گسترده می‌شود
پرهیز شود. گاهی تعریف یک نوع قراردادی کوچک و مستقل در Package مشترک
مناسب‌تر است.

### 7.5. Infrastructure

Feature Implها می‌توانند به قراردادهای زیرساختی یا Adapterهای مشخص وابسته
شوند، اما نباید به جزئیات داخلی Featureهای دیگر دسترسی داشته باشند.

جهت وابستگی مطلوب:

``` text
feature-impl ───────> infrastructure-api / shared contract
infrastructure-impl ─> infrastructure-api
app ─────────────────> feature-impl + infrastructure-impl
```

در صورت استفاده از ماژول زیرساختی مستقیم مانند `db-drizzle`، وابستگی
باید صریح و محدود به لایه‌ای باشد که مسئولیت استفاده از آن فناوری را
دارد. APIهای دامنه نباید به Drizzle یا جزئیات دیتابیس وابسته شوند.

## 8. ارتباط و هماهنگی بین Submoduleها

### 8.1. ارتباط مستقیم از طریق API

اگر یک Submodule برای انجام مسئولیت خودش به قابلیت Submodule دیگری نیاز
دارد، باید از API آن استفاده کند.

مثال:

``` text
procurement-impl
       │
       ▼
    stock-api
       │
       ▲
    stock-impl
```

پس از ثبت دریافت کالا، Procurement می‌تواند عملیات افزایش موجودی را از
طریق قرارداد Stock درخواست کند.

### 8.2. هماهنگی سطح والد

اگر یک Use Case شامل چند Submodule است و قواعد هماهنگی در سطح Feature
والد قرار دارند، هماهنگی باید در Application Service یا Orchestrator
مناسب انجام شود.

برای مثال، اگر یک فرآیند Warehouse باید عملیات Stock و Procurement را
هماهنگ کند، می‌توان یک سرویس هماهنگ‌کننده در محدوده Warehouse تعریف کرد که
فقط APIهای لازم را مصرف می‌کند.

### 8.3. پرهیز از چرخه وابستگی

این ساختار ممنوع است:

``` text
stock-impl ─────> procurement-api
     ▲                  │
     └──────────────────┘
```

اگر دو Submodule به یکدیگر وابسته شده‌اند، باید بررسی شود که:

-   مسئولیت‌ها اشتباه تقسیم شده‌اند؛
-   یک قرارداد مشترک در سطح والد لازم است؛
-   یک Orchestrator باید هماهنگی را انجام دهد؛
-   یا ارتباط باید به‌صورت Event/Message و با مالکیت مشخص پیاده‌سازی شود.

### 8.4. ارتباط هم‌زمان و رویدادمحور

برای عملیات هم‌زمان و نیازمند پاسخ فوری، API سرویس مناسب است. برای
اطلاع‌رسانی از وقوع یک واقعیت دامنه‌ای یا کاهش coupling زمانی، Domain
Event یا Integration Event می‌تواند مناسب باشد.

قواعد:

-   Event باید مالک و معنای مشخص داشته باشد.
-   مصرف‌کننده نباید برای فهم Event به دیتابیس یا مدل داخلی تولیدکننده
    دسترسی پیدا کند.
-   قرارداد Event بخشی از API عمومی مناسب آن Feature است.
-   Event جایگزین همه فراخوانی‌های مستقیم API نیست؛ انتخاب باید با نیاز
    consistency و رفتار Use Case هماهنگ باشد.

## 9. نقش App به‌عنوان Composition Root

`app` تنها بخش مجاز برای شناخت و اتصال پیاده‌سازی‌های مختلف است.

وظایف App:

-   وارد کردن Impl Packageها
-   وارد کردن HTTP Packageها
-   ثبت NestJS Moduleها و Providerها
-   اتصال Tokenهای API به کلاس‌های پیاده‌ساز
-   پیکربندی ماژول‌های زیرساختی
-   ساخت گراف نهایی برنامه

App نباید محل پیاده‌سازی منطق کسب‌وکار باشد. منطق باید در Featureهای مالک
آن باقی بماند.

نمونه مفهومی:

``` ts
@Module({
  imports: [
    WarehouseImplModule,
    OrderImplModule,
    OrderHttpModule,
  ],
})
export class AppModule {}
```

نحوه export و import واقعی باید با طراحی Dynamic Moduleها و Providerهای
هر Package هماهنگ شود.

## 10. نقش HTTP Package

HTTP یک ورودی به قابلیت‌های Feature است، نه محل مالکیت منطق کسب‌وکار.

قواعد:

-   `order-http` می‌تواند به `order-api` و قراردادهای لازم برای اجرای Use
    Caseهای Order وابسته باشد.
-   `order-http` نباید به `warehouse-impl` یا `stock-impl` وابسته شود.
-   Controller باید ورودی را اعتبارسنجی و به Application API یا قرارداد
    داخلی مجاز همان Feature تبدیل کند.
-   منطق دامنه و قواعد تراکنش نباید در Controller قرار گیرد.
-   Schemaهای مختص HTTP را نباید بدون دلیل به API دامنه منتقل کرد.
-   اگر قرارداد HTTP برای کلاینت‌های بیرونی منتشر می‌شود، باید از مدل
    داخلی دامنه مستقل نگه داشته شود.

## 11. قوانین Package و pnpm Workspace

### 11.1. تعریف Workspace

فایل `pnpm-workspace.yaml` باید مسیر Packageها را به‌صورت صریح یا با
الگوی کنترل‌شده معرفی کند. نمونه:

``` yaml
packages:
  - "apps/*"
  - "features/*/*"
  - "features/*/*/*"
  - "infrastructure/*"
```

اگر عمق Submoduleها بیشتر یا ساختار متفاوت شد، الگوها باید با ساختار
واقعی مخزن هماهنگ شوند. از الگوهای بسیار گسترده که Packageهای ناخواسته
را وارد Workspace می‌کنند پرهیز شود.

### 11.2. نام‌گذاری Packageها

نام Packageها باید یکتا و قابل فهم باشد. نمونه:

``` json
{
  "name": "@jonoob-part/warehouse-api",
  "private": true
}
```

برای Submodule:

``` json
{
  "name": "@jonoob-part/stock-api",
  "private": true
}
```

### 11.3. وابستگی صریح

اگر `order-impl` از `stock-api` استفاده می‌کند، باید آن را در
`dependencies` یا `peerDependencies` متناسب با مدل انتشار و نصب تعریف
کند. در Workspace داخلی معمولاً از `workspace:*` استفاده می‌شود:

``` json
{
  "dependencies": {
    "@jonoob-part/stock-api": "workspace:*"
  }
}
```

نباید به این دلیل که Packageها در یک مخزن هستند، از import مستقیم
فایل‌های همدیگر استفاده کرد.

### 11.4. انتخاب dependencies، devDependencies و peerDependencies

-   `dependencies`: وابستگی لازم در زمان اجرا یا برای مصرف واقعی
    Package.
-   `devDependencies`: ابزارهای توسعه، تست، build و lint که برای
    مصرف‌کننده لازم نیستند.
-   `peerDependencies`: زمانی که Package باید از نسخه‌ای از یک وابستگی
    استفاده کند که توسط میزبان یا Composition Root فراهم می‌شود؛ مانند
    بعضی سناریوهای NestJS.

انتخاب دقیق باید با نحوه build و انتشار Packageها سازگار باشد.

## 12. محدود کردن Entry Pointها با package.json exports

هر Package باید فقط Entry Pointهای عمومی خود را صادر کند.

نمونه:

``` json
{
  "name": "@jonoob-part/stock-api",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

برای Impl:

``` json
{
  "name": "@jonoob-part/stock-impl",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

نکات:

-   `exports` مسیرهای قابل import از طریق نام Package را محدود می‌کند.
-   از export کردن wildcardهایی مانند `./*` بدون نیاز روشن خودداری شود.
-   فایل‌های داخلی نباید از `index.ts` عمومی re-export شوند.
-   `exports` جایگزین ESLint و بررسی گراف وابستگی نیست؛ نباید آن را مرز
    امنیتی کامل فرض کرد.
-   مسیرهای نسبی یا aliasهایی که مستقیماً به `src` Package دیگر اشاره
    می‌کنند، می‌توانند این مرزبندی را دور بزنند و باید ممنوع شوند.
-   تنظیمات `types`، `main`، `module` و `exports` باید با خروجی واقعی
    build و نسخه TypeScript/Node پروژه سازگار باشند.

## 13. قواعد TypeScript و مسیر Import

### 13.1. Import بین Packageها

برای مصرف Package دیگر فقط از نام Package استفاده شود:

``` ts
import {
  STOCK_QUERY_API,
  type StockQueryApi,
} from '@jonoob-part/stock-api';
```

### 13.2. Import داخل یک Package

درون همان Package می‌توان از مسیر نسبی یا alias محلی استفاده کرد؛ مشروط
به اینکه alias از مرز Package خارج نشود.

### 13.3. ممنوعیت alias سراسری به src سایر Packageها

از تنظیماتی مانند این پرهیز شود:

``` json
{
  "compilerOptions": {
    "paths": {
      "@stock/*": ["features/warehouse/stock/impl/src/*"]
    }
  }
}
```

این کار باعث می‌شود مصرف‌کننده بدون وابستگی Packageای و بدون رعایت
`exports` به فایل‌های داخلی دسترسی پیدا کند.

Aliasهای محلی باید به سورس همان Package محدود باشند. در صورت استفاده از
TypeScript project references یا ابزارهای build، پیکربندی باید همچنان
مرز Packageها را حفظ کند.

## 14. لایه‌بندی درون Impl

ساختار داخلی Impl می‌تواند متناسب با پیچیدگی Feature متفاوت باشد؛ اما
تفکیک مسئولیت‌ها توصیه می‌شود:

``` text
stock/impl/src/
├── domain/
│   ├── model/
│   ├── policy/
│   └── errors/
├── application/
│   ├── commands/
│   ├── queries/
│   └── services/
├── infrastructure/
│   ├── persistence/
│   └── adapters/
├── nest/
│   └── stock.module.ts
└── index.ts
```

این ساختار نمونه است و نباید به یک قالب اجباری برای همه Featureها تبدیل
شود.

جهت وابستگی درون Impl باید به‌گونه‌ای باشد که Domain به NestJS، Drizzle،
HTTP یا سایر جزئیات زیرساختی وابسته نشود.

## 15. سیاست اشتراک کد

قبل از ایجاد Package مشترک، مشخص شود کد واقعاً مفهوم مشترک و پایدار دارد
یا صرفاً دو پیاده‌سازی مشابه دیده شده‌اند.

قواعد:

-   کد دامنه‌ای متعلق به یک Feature نباید صرفاً برای استفاده مجدد به
    `shared` منتقل شود.
-   ابزارهای عمومی و فاقد مالکیت دامنه می‌توانند در Packageهای مشترک قرار
    گیرند.
-   Typeهای قراردادی مشترک باید کوچک و هدفمند باشند.
-   از ایجاد یک Package بزرگ `common` که همه Featureها به آن وابسته شوند
    پرهیز شود.
-   اشتراک کد نباید باعث وابستگی چرخه‌ای یا افشای جزئیات داخلی شود.

## 16. ابزارهای کنترل معماری

هیچ ابزار واحدی تمام مرزها را تضمین نمی‌کند. کنترل معماری باید در چند سطح
انجام شود.

### 16.1. pnpm

برای مدیریت Workspace و وابستگی‌های صریح Packageها استفاده می‌شود. pnpm
به‌تنهایی قواعد مالکیت دامنه یا ممنوعیت import از Impl سایر Featureها را
enforce نمی‌کند.

### 16.2. package.json exports

Entry Pointهای مجاز Package را محدود می‌کند و از deep importهای
Package-specifier جلوگیری می‌کند.

### 16.3. ESLint

برای کنترل importها در سطح فایل و Package استفاده شود. می‌توان از
`eslint-plugin-boundaries` یا قواعد مشابه استفاده کرد تا:

-   `api` به `impl` وابسته نشود.
-   Featureها فقط API Featureهای دیگر را import کنند.
-   `http` به Impl Feature دیگر وابسته نشود.
-   import از مسیرهای داخلی Package دیگر ممنوع باشد.
-   قوانین داخل هر Package و بین Packageها جداگانه تعریف شوند.

### 16.4. dependency-cruiser

برای بررسی گراف وابستگی مناسب است. قواعد پیشنهادی:

-   ممنوعیت چرخه وابستگی
-   ممنوعیت وابستگی API به Impl
-   ممنوعیت وابستگی Feature به Impl یا HTTP Feature دیگر
-   ممنوعیت import از مسیرهای خارج از Package
-   محدود کردن وابستگی‌های Infrastructure و App
-   گزارش وابستگی‌های غیرمجاز و لایه‌های نقض‌شده

### 16.5. CI

حداقل این بررسی‌ها در CI اجرا شوند:

1.  نصب وابستگی‌ها با lockfile ثابت
2.  lint
3.  typecheck
4.  تست‌ها
5.  build همه Packageهای لازم
6.  بررسی قواعد معماری و گراف وابستگی

شکست هر قانون معماری باید build یا CI را ناموفق کند؛ هشدارهای
غیرمسدودکننده برای قواعد اصلی کافی نیستند.

## 17. آزمون و تست

-   API Packageها باید تا حد امکان سبک و بدون نیاز به تست اجرایی پیچیده
    باشند.
-   Implها تست واحد برای قواعد دامنه و Application Serviceها داشته
    باشند.
-   Adapterهای زیرساختی تست یکپارچه داشته باشند.
-   HTTP Packageها تست Controller و اعتبارسنجی ورودی داشته باشند.
-   تست‌های معماری باید مستقل از تست‌های دامنه اجرا شوند.
-   برای قراردادهای مهم بین Featureها، تست سازگاری مصرف‌کننده/تولیدکننده
    در نظر گرفته شود.

## 18. مثال گردش یک Use Case

فرض کنیم فرآیند ثبت دریافت کالا در Procurement باعث افزایش موجودی Stock
می‌شود.

جریان مفهومی:

``` text
HTTP Request
    │
    ▼
procurement-http
    │
    ▼
procurement application / impl
    │
    ├── اجرای قواعد ثبت دریافت
    │
    └── فراخوانی stock-api
              │
              ▼
          stock-impl
              │
              ▼
       stock persistence
```

قواعد این جریان:

1.  درخواست HTTP وارد لایه ورودی Procurement می‌شود.
2.  اعتبارسنجی و تبدیل ورودی در لایه HTTP انجام می‌شود.
3.  Use Case ثبت دریافت در Procurement اجرا می‌شود.
4.  Procurement برای تغییر موجودی فقط قرارداد Stock را می‌شناسد.
5.  پیاده‌سازی Stock مسئول اجرای عملیات موجودی و قواعد مربوط به آن است.
6.  هیچ کدی از Procurement نباید به Repository یا جدول‌های داخلی Stock
    دسترسی پیدا کند.
7.  مرز تراکنش باید آگاهانه طراحی شود. اگر عملیات ثبت دریافت و افزایش
    موجودی باید اتمیک باشند، قرارداد و نحوه اجرای آن باید امکان تضمین
    consistency را فراهم کند؛ صرف جدا بودن Packageها تضمین تراکنش مشترک
    ایجاد نمی‌کند.

## 19. قواعد تصمیم‌گیری برای تغییرات آینده

پیش از ایجاد Feature یا Submodule جدید، این پرسش‌ها بررسی شوند:

1.  مالک مفهوم و قوانین کسب‌وکار کدام Feature است؟
2.  آیا این قابلیت واقعاً Bounded Context مستقل است یا فقط Submodule یک
    Feature موجود؟
3.  آیا مصرف‌کننده خارجی دارد؟
4.  آیا به API مستقل نیاز دارد یا استفاده داخلی کافی است؟
5.  چه Packageهایی باید به آن وابسته شوند؟
6.  آیا وابستگی پیشنهادی باعث چرخه می‌شود؟
7.  آیا قرارداد API بیش از حد جزئیات داخلی را افشا می‌کند؟
8.  آیا تغییرات آن باید مستقل از Feature والد منتشر یا نسخه‌بندی شوند؟
9.  چه تست معماری‌ای باید مجاز یا غیرمجاز بودن وابستگی را اثبات کند؟

### معیار استقلال یک Bounded Context

صرف داشتن API، Impl، جدول دیتابیس یا مصرف‌کننده متعدد، به‌تنهایی دلیل
استقلال یک Bounded Context نیست. استقلال باید با مالکیت مدل، زبان دامنه،
قواعد کسب‌وکار، چرخه تغییر و مسئولیت تصمیم‌گیری سنجیده شود.

## 20. تصمیم‌های معماری تثبیت‌شده

موارد زیر سیاست پایه این پروژه محسوب می‌شوند:

-   مخزن از Packageهای مستقل در pnpm workspace تشکیل می‌شود.
-   هر Package وابستگی‌های مستقیم خود را صریح تعریف می‌کند.
-   Featureهای سطح بالا مرزهای اصلی دامنه هستند.
-   Submoduleها می‌توانند API و Impl مستقل داشته باشند، بدون اینکه الزاماً
    Bounded Context مستقل باشند.
-   Stock از نظر مالکیت دامنه‌ای زیرمجموعه Warehouse است.
-   Featureهای مستقل فقط از API عمومی یکدیگر استفاده می‌کنند.
-   دسترسی مستقیم به Impl و HTTP سایر Featureها ممنوع است.
-   برای یکدست ماندن مرزها، حتی Feature والد نیز از API Submodule
    استفاده می‌کند و به Impl آن وابسته نمی‌شود.
-   `app` به‌عنوان Composition Root اجازه اتصال API، Impl و HTTP را دارد.
-   `package.json exports`، ESLint و dependency-cruiser به‌صورت مکمل برای
    enforce کردن قواعد استفاده می‌شوند.
-   import مستقیم از سورس Package دیگر و aliasهایی که مرز Package را دور
    می‌زنند ممنوع است.
-   چرخه وابستگی بین Packageها مجاز نیست.

## 21. چک‌لیست بازبینی Pull Request

-   [ ] آیا Package جدید `package.json` مستقل دارد؟
-   [ ] آیا وابستگی‌های مستقیم در manifest تعریف شده‌اند؟
-   [ ] آیا import بین Packageها از نام رسمی Package استفاده می‌کند؟
-   [ ] آیا Entry Pointهای عمومی با `exports` محدود شده‌اند؟
-   [ ] آیا API فقط قراردادهای لازم را صادر می‌کند؟
-   [ ] آیا هیچ Featureای Impl یا HTTP Feature دیگری را import نکرده
    است؟
-   [ ] آیا API به Impl یا Infrastructure اجرایی وابسته نشده است؟
-   [ ] آیا چرخه وابستگی جدیدی ایجاد نشده است؟
-   [ ] آیا مالکیت دامنه‌ای Feature/Submodule روشن است؟
-   [ ] آیا هماهنگی بین Submoduleها در محل مناسب انجام می‌شود؟
-   [ ] آیا تست‌های دامنه، یکپارچه و معماری لازم اضافه شده‌اند؟
-   [ ] آیا CI تمام قواعد معماری را بررسی می‌کند؟

------------------------------------------------------------------------

## پیوست A: خلاصه گراف وابستگی مجاز

``` text
                         app
                 ┌───────┼────────┐
                 ▼       ▼        ▼
            feature-impl feature-http infrastructure-impl
                 │
                 ▼
             feature-api

order-impl ───────────────> stock-api
procurement-impl ─────────> stock-api
warehouse-impl ───────────> stock-api
stock-impl ───────────────> stock-api
```

فلش به معنی «وابسته است به» است. نمودار خلاصه است و همه Packageهای واقعی
را نمایش نمی‌دهد.

## پیوست B: اصل کلیدی

**مالکیت دامنه، ساختار فیزیکی پوشه‌ها و دسترسی فنی سه مفهوم متفاوت‌اند.**

-   Warehouse می‌تواند مالک دامنه‌ای Stock باشد.
-   Stock می‌تواند Packageهای API و Impl مستقل داشته باشد.
-   سایر Featureها می‌توانند API آن را مصرف کنند.
-   هیچ‌کدام از این موارد به مصرف‌کنندگان اجازه دسترسی به Impl داخلی Stock
    را نمی‌دهد.
