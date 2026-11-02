# گزارش نهایی مهندسی کیفیت، امنیت و پایداری سیستم
> **2026-11-02 update:** This audit, plan or report records an earlier snapshot; its claims and test results are historical, not current production-readiness evidence. The material below is a historical snapshot and may contain outdated claims. For the current status see [ENGINEERING_PROGRESS.md](ENGINEERING_PROGRESS.md), [API.md](API.md) and [PAYMENT_FLOW.md](PAYMENT_FLOW.md).
## Master Engineering Mission Delivery Report

**پروژه:** سامانه فروش و پذیرش بلیت سالن موسیقی زنده رستوران  
**مخزن:** https://github.com/oldrcesupport/my_website  
**محیط اجرا:** Development (Django 6.1 + Next.js 15 + PostgreSQL 18)  
**درگاه پرداخت:** ZarinPal Sandbox (REST API v4)  
**زبان و منطقه زمانی:** فارسی (fa-IR)، واحد پولی تومان، منطقه زمانی `Asia/Tehran`  
**تاریخ گزارش:** شنبه ۱۰ آبان ۱۴۰۵ (31 اکتبر 2026)

---

## ۱. جدول وضعیت اعتبارسنجی قطعی سیستم (Factual Verification Matrix)

| سنجه آزمون / ممیزی | وضعیت قطعی | شواهد و لاگ اجرایی |
|---|:---:|---|
| **Django System Checks** | **PASS** | `python manage.py check` بدون هیچ خطا یا هشدار (0 silenced) |
| **Migration Consistency** | **PASS** | تمام مایگریشن‌ها در PostgreSQL 18 اعمال شدند (`showmigrations` [X]) |
| **Backend Unit & API Tests** | **PASS** | ۳۷ آزمون از ۳۷ آزمون در `pytest backend/tests/ -v` (10.30s) پاس شد |
| **Role & Permission Tests** | **PASS** | ۴ آزمون تفکیک نقش ادمین و اسکنر پاس شد |
| **PostgreSQL Concurrency Race Test** | **PASS** | `test_simultaneous_qr_redemption_race_condition` با قفل سطحی پاس شد |
| **Frontend TypeScript Strict** | **PASS** | `npx tsc --noEmit` با کد صفر (Exit 0) و بدون خطای نوع اجرا شد |
| **Next.js Production Build** | **PASS** | `npm run build` با خروجی بهینه برای ۱۲ مسیر کلاینت/سرور بیلد شد |
| **Live Integration E2E Scenario** | **PASS** | `scripts/e2e_live_test.py` با استعلام واقعی زرین‌پال و اسکن موفقیت‌آمیز پاس شد |
| **Idempotency Setup Command** | **PASS** | عدم ریست رمز عبور و عدم چاپ لاگ در اجرای چندباره `setup_restaurant` |
| **ZarinPal Sandbox Live Auth** | **PASS** | تولید Authority زنده و بررسی رد سروری تراکنش پرداخت‌نشده با کد منفی ۵۱ |

---

## ۲. خلاصه اشکالات P0 و اقدامات اصلاحی (Critical P0 Remediations)

1. **اصلاح دستور `setup_restaurant`:**
   - دستور پیشین در هر بار اجرا، رمزهای عبور را به مقادیر پیش‌فرض ناامن بازنشانی و در ترمینال چاپ می‌کرد.
   - اکنون در صورت وجود حساب، رمز دست‌نخورده باقی می‌ماند و کلمات عبور هرگز در خروجی لاگ نمی‌شوند.
2. **محدودسازی دسترسی پرسنل اسکنر (`STAFF_SCANNER`):**
   - به دلیل شرط پیشین `is_staff or is_superuser`، پرسنل اسکنر قادر به مشاهده اطلاعات خصوصی سفارش‌ها و بلیت‌های مشتریان بودند.
   - دسترسی این ویوها (`OrderStatusView`, `OrderTicketsView`, `TicketQrImageView`) صریحاً به مدیران (`is_admin` یا `is_superuser`) محدود شد.
3. **حذف توکن مهمان از آدرس بازگشت پرداخت و LocalStorage:**
   - توکن محرمانه دسترسی مهمان از پارامترهای کوئری ریدایرکت زرین‌پال (`&token=`) و ذخیره‌سازی در `localStorage` به کلی حذف شد.
   - دسترسی امن به بلیت‌ها منحصراً از طریق کوکی امن `HttpOnly` برقرار است.
4. **تأیید اصالت پرداخت در صفحه بازگشت بر اساس پایگاه‌داده (نه پارامتر URL):**
   - صفحه `/payment/return` دیگر صرفاً با دیدن پارامتر ساختگی `status=success` نتیجه موفقیت‌آمیز نشان نمی‌دهد؛ بلکه وضعیت قطعی سفارش را از طریق فراخوانی امن سرور استعلام نموده و در صورت تأیید `orderData.status === "PAID"` دکمه دریافت بلیت را فعال می‌کند.
5. **حذف فیلد `raw_token` از سریالایزر عمومی بلیت:**
   - رشته توکن خام بلیت از خروجی API حذف شد و مشتری صرفاً تصویر بارکد QR را به صورت Data URI دریافت می‌نماید.

---

## ۳. خلاصه اشکالات P1 و بهینه‌سازی‌ها (Important P1 Remediations)

1. **تفکیک خطاهای اسکنر از بلیت نامعتبر:** در صورت بروز خطای قطعی شبکه یا خطای ۵۰۰ سرور، اسکنر پیام شفاف خطای زیرساخت نشان می‌دهد تا پرسنل متوجه شوند بارکد نامعتبر نبوده است.
2. **حذف قیمت فرضی در قطعی بک‌اند:** در صفحه اصلی و فرم خرید، سامانه در زمان قطعی اتصال هرگز قیمت پیش‌فرض فرضی ۱۰۰,۰۰۰ تومان نمایش نمی‌دهد و فرم فروش را مسدود می‌کند (Fail-Closed).
3. **تراکنش‌های غیرمسدودکننده چندمرحله‌ای:** تماس با درگاه زرین‌پال بدون نگه داشتن قفل ردیفی PostgreSQL انجام می‌شود.
4. **بهینه‌سازی استعلام بلیت‌ها (Bounded Polling):** در صورت غیرفعال بودن تب مرورگر یا رسیدن تمام بلیت‌ها به وضعیت استفاده‌شده یا بروز خطای ۴۰۳/۴۰۴، حلقه استعلام مداوم متوقف می‌شود.

---

## ۴. فایل‌های اصلاح‌شده (Modified Files Inventory)

```text
backend/
├── apps/
│   ├── accounts/
│   │   ├── serializers.py          # اجباری کردن رمز عبور در ساخت کاربر جدید
│   │   └── views.py                # حذف رمز عبور پیش‌فرض TempPass123!
│   ├── checkin/
│   │   ├── services.py             # هش کردن توکن‌های ناشناخته پیش از ثبت در یادداشت
│   │   └── views.py                # دسته‌بندی کدهای خطای اسکنر
│   ├── core/
│   │   └── management/commands/
│   │       └── setup_restaurant.py # تکرارپذیری، عدم ریست پسورد و عدم چاپ پسورد
│   ├── orders/
│   │   ├── models.py               # مقایسه زمان‌ثابت توکن مهمان (compare_digest)
│   │   └── views.py                # تفکیک دسترسی پرسنل اسکنر از مدیران
│   ├── payments/
│   │   ├── services.py             # تأیید چندمرحله‌ای غیرمسدودکننده
│   │   └── views.py                # حذف توکن مهمان از آدرس ریدایرکت
│   └── tickets/
│       ├── serializers.py          # حذف raw_token از خروجی سریالایزر
│       └── views.py                # رفع رخنه IDOR و محدودسازی اسکنرها
├── config/
│   ├── settings.py                 # تنظیم IsAuthenticated به عنوان پیش‌فرض DRF
│   └── urls.py                     # پشتیبانی از مسیرهای استاندارد qr
├── tests/
│   ├── test_guest_ownership.py     # آزمون‌های جامع امنیت دسترسی مهمان
│   ├── test_multiphase_payment.py  # آزمون‌های تأیید غیرمسدودکننده پرداخت
│   ├── test_security_remediation.py# آزمون‌های امنیت رمز، تزریق هدر و هش توکن
│   └── test_setup_command.py       # آزمون تکرارپذیری دستور ستاپ
frontend/
├── src/
│   ├── app/
│   │   ├── payment/return/page.tsx # اعتبارسنجی سروری پرداخت بدون اعتماد به URL
│   │   ├── staff/scanner/page.tsx  # تفکیک خطاهای شبکه و سرور از بارکد نامعتبر
│   │   └── tickets/[orderId]/page.tsx # حذف localStorage و مدیریت Polling
│   ├── components/home/
│   │   └── TicketPurchaseForm.tsx  # حذف ذخیره توکن در localStorage و رجکس تلفن
│   ├── lib/
│   │   └── api.ts                  # افزودن credentials: include و حذف توکن از کوئری
│   └── types/
│       └── index.ts                # به‌روزرسانی تعاریف تایپ و نتایج اسکنر
scripts/
└── e2e_live_test.py                # بازنویسی سناریوی آزمون جامع بدون تغییر مستقیم دیتابیس
```

---

## ۵. اقدامات باقیمانده و توصیه‌های امنیتی برای مالک سیستم (Owner Action Items)

1. **کلیدهای رمزنگاری در محیط عملیاتی:**
   - پیش از انتقال به محیط سرور لایو، مقدار `QR_ENCRYPTION_KEY` و `SECRET_KEY` را در فایل `.env` سرور با مقادیر امن تصادفی جایگزین فرمایید.
2. **مرچنت واقعی زرین‌پال:**
   - پس از تأیید درگاه بانکی، مقدار `ZARINPAL_MERCHANT_ID` و متغیر `LIVE_PAYMENTS_ENABLED=true` را در محیط پروداکشن تنظیم نمایید.
3. **گواهی SSL (HTTPS):**
   - برای عملکرد صحیح اسکنر دوربین گوشی در بستر شبکه، دامنه سرور باید مجهز به HTTPS باشد تا مرورگر مجوز دسترسی به دوربین را صادر کند.

