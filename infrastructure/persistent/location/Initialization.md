# Reference Data Initialization via HTTP Endpoint

## Overview

برخی داده‌ها در سیستم ماهیت **Reference Data** دارند؛ یعنی داده‌هایی که توسط سیستم استفاده می‌شوند اما معمولاً توسط کاربران تغییر نمی‌کنند.

نمونه‌ها:

- استان‌ها و شهرها
- کشورها
- واحدهای اندازه‌گیری
- ارزها
- انواع ثابت سیستم

این داده‌ها معمولاً از یک منبع خارجی مانند فایل JSON وارد سیستم می‌شوند و قبل از استفاده باید مقداردهی اولیه شوند.

در این معماری، مقداردهی اولیه از طریق یک **HTTP Endpoint داخلی** انجام می‌شود.

---

## Initialization Flow

```
HTTP Request

      |
      v

Location Controller

      |
      v

Location Initializer

      |
      v

Read JSON File

      |
      v

Validate Data

      |
      v

Normalize Names

      |
      v

Persist Database

      |
      v

Location Ready
```

---

## Why HTTP Initialization?

در این روش، initialization یک عملیات مدیریتی است که فقط هنگام راه‌اندازی اولیه سیستم اجرا می‌شود.

مزایا:

- نیاز به اجرای command جداگانه ندارد.
- از طریق deployment script یا ابزار مدیریت قابل فراخوانی است.
- دسترسی آن قابل کنترل است.
- عملیات initialization از lifecycle برنامه جدا باقی می‌ماند.

---

## Important Rules

این endpoint نباید در startup برنامه اجرا شود.

دلیل:

- هر instance برنامه دوباره آن را اجرا می‌کند.
- startup زمان بیشتری می‌برد.
- در محیط چند replica ممکن است همزمان اجرا شود.

---

## Endpoint

یک endpoint داخلی برای مقداردهی اولیه تعریف می‌شود.

Method:

```
POST /internal/location/initialize
```

این endpoint فقط باید برای موارد زیر قابل دسترسی باشد:

- Deployment
- Administrator
- Internal Tools

---

## Controller Responsibility

Controller فقط مسئول دریافت درخواست و اجرای use case است.

Controller نباید شامل منطق import یا ذخیره‌سازی باشد.

Flow:

```
Controller

    |
    v

LocationInitializer

    |
    v

Repository
```

---

## LocationInitializer Responsibility

Initializer مسئول اجرای فرآیند مقداردهی اولیه است.

وظایف:

- خواندن فایل داده
- اعتبارسنجی داده
- normalize کردن نام‌ها
- ذخیره در database

---

## Source Data

منبع اصلی داده یک فایل JSON است.

مثال ساختار:

```
[
  {
    "id": 1,
    "name": "آذربایجان شرقی",
    "cities": [
      {
        "id": 1,
        "name": "آذرشهر"
      },
      {
        "id": 2,
        "name": "تبریز"
      }
    ]
  }
]
```

این فایل به عنوان Source of Truth در نظر گرفته می‌شود.

---

## Data Validation

داده خارجی قبل از ذخیره باید validate شود.

برای این کار از Zod استفاده می‌شود.

مراحل:

```
Read File

   |

JSON.parse

   |

Zod Validation

   |

Database Insert
```

اگر ساختار فایل معتبر نباشد، عملیات متوقف می‌شود.

---

## Name Normalization

نام مکان‌ها باید قبل از ذخیره normalize شوند.

هدف:

جلوگیری از تفاوت‌های نوشتاری.

مثال:

```
كاشان
کاشان

ياسوج
یاسوج
```

هر دو باید یک مقدار جستجو داشته باشند.

ساختار ذخیره:

```
City

id
name
normalizedName
```

مثال:

```
name:

كاشان


normalizedName:

کاشان
```

---

## Database Initialization

در اولین اجرای سیستم، دیتابیس خالی است.

مراحل:

```
Read JSON

    |

Create Provinces

    |

Create Cities
```

تمام عملیات باید داخل transaction انجام شود.

هدف:

اگر بخشی از import شکست خورد، دیتابیس در وضعیت ناقص باقی نماند.

---

## Access Control

Endpoint initialization نباید عمومی باشد.

روش‌های محافظت:

- Internal API Guard
- Admin Role
- API Key
- Network Restriction

---

## Execution Example

بعد از deploy اولیه:

```
POST /internal/location/initialize
```

نتیجه:

```
Location initialization completed
```

---

## Final Architecture

```
HTTP Request

        |

        v

Location Internal Controller

        |

        v

Location Initializer

        |

        v

Location File Reader

        |

        v

Location Repository

        |

        v

Database
```

---

## Summary

این الگو برای داده‌های مرجع مناسب است:

- اجرای کنترل‌شده
- بدون تاثیر روی startup
- قابل استفاده در deployment
- قابل محافظت
- جدا از lifecycle برنامه

Initialization یک عملیات مدیریتی است، نه بخشی از اجرای عادی Application.
