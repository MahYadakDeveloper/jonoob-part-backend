### عدم وابستگی به سرویس‌های Push مانند FCM

با توجه به محدودیت دسترسی برخی کاربران به سرویس‌هایی مانند Firebase Cloud Messaging (FCM)، می‌توان بدون استفاده از سرویس‌های Push شخص ثالث، notificationها را مستقیماً از طریق زیرساخت خودمان ارسال کرد.

در این معماری، اپلیکیشن Android یک **WebSocket connection** پایدار با سرور برقرار می‌کند و یک **background worker/service** مسئول مدیریت اتصال و دریافت پیام‌ها خواهد بود. سرور نیز notification را از طریق WebSocket به connection مربوط به کاربر یا device ارسال می‌کند.

```text
Backend
   │
   │ WebSocket
   ▼
Android Worker
   │
   ▼
Local Notification
```

برای reliability، worker باید مسئول reconnect، مدیریت قطع و وصل شبکه و دریافت مجدد پیام‌های از دست‌رفته باشد. همچنین notificationهای مهم بهتر است در سمت سرور persist شوند تا در صورت قطع بودن connection، پس از برقراری مجدد ارتباط قابل دریافت باشند.

مزیت اصلی این رویکرد، **کنترل کامل زیرساخت و عدم وابستگی به سرویس‌هایی مانند FCM** است؛ با این حال، مدیریت lifecycle سرویس‌های background، مصرف باتری و محدودیت‌های Android در اجرای background از چالش‌های اصلی این معماری هستند.
