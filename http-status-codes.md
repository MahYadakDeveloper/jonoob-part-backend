# کدهای وضعیت HTTP کاربردی برای API

فقط کدهایی که در یک API مبتنی بر NestJS با خطاهای دامنه‌ای عملاً استفاده می‌شن.

## ۲xx: موفق

| کد | نام | کاربرد | نکته |
|---|---|---|---|
| 200 | OK | `GET`، و `PATCH`/`PUT`/`POST` که نتیجه‌ای در بدنه برمی‌گردونن | پاسخ پیش‌فرض موفق |
| 201 | Created | `POST` که منبع جدید ساخته (مثلاً ثبت movement) | هدر `Location` به آدرس منبع جدید بذار |
| 202 | Accepted | درخواست پذیرفته شد ولی پردازش async است (job، صف) | بدنه معمولاً شناسه‌ی job برای پیگیری وضعیته |
| 204 | No Content | موفق و بدون بدنه، مثل `DELETE` | هیچ بدنه‌ای نفرست |

## ۴xx: خطای کلاینت

| کد | نام | کاربرد | مثال در پروژه |
|---|---|---|---|
| 400 | Bad Request | درخواست خراب: JSON نامعتبر، نوع اشتباه، فرمت نادرست | `MALFORMED_INPUT`، خطای `ValidationPipe` |
| 401 | Unauthorized | احراز هویت نشده یا توکن نامعتبر/منقضی | توکن نداره یا باطله (با هدر `WWW-Authenticate`) |
| 403 | Forbidden | هویت مشخصه ولی دسترسی نداره | نقش کاربر اجازه‌ی این عملیات رو نداره |
| 404 | Not Found | منبع وجود نداره | `STOCK_NOT_FOUND` |
| 408 | Request Timeout | کلاینت درخواست رو به‌موقع کامل نفرستاد | آپلود یا ارسال بدنه‌ی کند |
| 409 | Conflict | تعارض با وضعیت فعلی منبع | `INSUFFICIENT_STOCK`، بارکد تکراری، serialization failure قابل retry |
| 412 | Precondition Failed | پیش‌شرط (`If-Match`) برقرار نیست | optimistic locking با `ETag`/`version` |
| 413 | Content Too Large | بدنه از حد مجاز بزرگ‌تره | آپلود فایل یا payload بزرگ |
| 415 | Unsupported Media Type | `Content-Type` پشتیبانی نمی‌شه | ارسال `text/plain` به endpoint ی که JSON می‌خواد |
| 422 | Unprocessable Content | ساختار درسته ولی قواعد کسب‌وکار/معنایی نقض شده | ورودی خوش‌ساخت با مقدار غیرمجاز |
| 429 | Too Many Requests | rate limit | با هدر `Retry-After` |

## ۵xx: خطای سرور

| کد | نام | کاربرد | نکته |
|---|---|---|---|
| 500 | Internal Server Error | خطای ناشناخته | جزئیات داخلی (stack، SQL) رو لو نده؛ فقط با `traceId` لاگ کن |
| 501 | Not Implemented | قابلیت/متد پیاده نشده | برای endpointهای هنوز ننوشته |
| 502 | Bad Gateway | پاسخ نامعتبر از سرویس بالادستی | معمولاً از سمت gateway/proxy |
| 503 | Service Unavailable | موقتاً در دسترس نیست (نگهداری، اضافه‌بار، قطع DB) | با هدر `Retry-After` |
| 504 | Gateway Timeout | سرویس بالادستی به‌موقع جواب نداد | معمولاً از سمت gateway/proxy |

## قواعد تصمیم‌گیری سریع

- **۴۰۰ در برابر ۴۲۲:** ۴۰۰ برای درخواست خراب (سینتکس، نوع)، ۴۲۲ برای ورودی سالم که قواعد رو نقض می‌کنه. یکی رو انتخاب کن و در کل API ثابت نگه دار.
- **۴۰۱ در برابر ۴۰۳:** ۴۰۱ یعنی «معلوم نیست کی هستی»، ۴۰۳ یعنی «معلومه کی هستی ولی اجازه نداری».
- **۴۰۹ برای خطاهای انبار:** موجودی کم، تکراری بودن، و تعارض همزمانی (مثل `40001` پستگرس که با retry حل می‌شه).
- **۴xx یعنی کلاینت می‌تونه درستش کنه، ۵xx یعنی نمی‌تونه.** خطای غیرمنتظره‌ی دیتابیس باید ۵۰۰ باشه، نه ۴xx.

## نگاشت خطای دامنه‌ای به status (نمونه)

```ts
const ERROR_MAP = {
  MALFORMED_INPUT:    { status: 400, title: 'Malformed input' },
  STOCK_NOT_FOUND:    { status: 404, title: 'Stock not found' },
  INSUFFICIENT_STOCK: { status: 409, title: 'Insufficient stock' },
  DUPLICATE_BARCODE:  { status: 409, title: 'Duplicate barcode' },
  BUSINESS_RULE:      { status: 422, title: 'Business rule violated' },
} as const;
```

## هدرهای کمکی

| هدر | همراه با | کاربرد |
|---|---|---|
| `Location` | 201 | آدرس منبع ساخته‌شده |
| `Retry-After` | 429، 503 | چند ثانیه بعد دوباره تلاش کن |
| `WWW-Authenticate` | 401 | نوع احراز هویت موردنیاز |
| `ETag` / `If-Match` | 200، 412 | optimistic locking |
