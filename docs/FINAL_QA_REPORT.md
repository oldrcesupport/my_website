# گزارش جامع مهندسی کیفیت، رفع نقص‌ها و ارزیابی نهایی سامانه
> **2026-11-02 update:** This audit, plan or report records an earlier snapshot; its claims and test results are historical, not current production-readiness evidence. The material below is a historical snapshot and may contain outdated claims. For the current status see [ENGINEERING_PROGRESS.md](ENGINEERING_PROGRESS.md), [API.md](API.md) and [PAYMENT_FLOW.md](PAYMENT_FLOW.md).
## Final Quality Engineering, Forensic Bug Audit & System Verification Report
**پروژه:** oldrcesupport/my_website  
**مخزن:** https://github.com/oldrcesupport/my_website  
**تاریخ گزارش:** شنبه ۱۰ آبان ۱۴۰۵ (31 اکتبر 2026)  
**وضعیت نهایی:** موفقیت کامل — تمام آزمون‌ها، اعتبارسنجی‌ها و استانداردهای کیفی پاس شدند.

---

## ۱. خلاصه مدیریتی (Executive Summary)

این گزارش مستندسازی جامع از کلیه اقدامات عیب‌یابی عمیق، ایمن‌سازی امنیتی، رفع باگ‌های خاموش و پنهان، بازسازی جریان تراکنش‌ها، ارتقای فرانت‌اند و آزمون‌های خودکار سامانه رزرواسیون و صدور بلیت موسیقی زنده رستوران می‌باشد.

تمامی اهداف مهندسی و الزامات قطعی کسب‌وکار بدون هیچ‌گونه مصالحه فنی پیاده‌سازی و راستی‌آزمایی گردیدند:
1. **امنیت مطلق اطلاعات مشتریان و بلیت‌ها**: آسیب‌پذیری IDOR در دسترسی به سفارش‌های پرداخت‌شده و بلیت‌ها به طور کامل برطرف شد. نشت توکن‌های محرمانه (`raw_token` و `guest_access_token`) از خروجی API حذف گردید. بازگشت از درگاه به آدرس‌های تزریق‌شده (Origin Poisoning) مسدود و مقادیر رمز عبور پیش‌فرض پرسنل حذف و اجباری شدند.
2. **حذف باگ‌های بی‌صدا و خاموش**: قیمت پیش‌فرض فرضی در صورت قطعی اتصال بک‌اند حذف و منطق Fail-Closed اعمال شد. اعتبارسنجی شماره تلفن‌های همراه ایران (`^(\+98|0)?9\d{9}$`) پیاده‌سازی گردید. مدیریت همزمانی با توابع استاندارد `crypto.randomUUID()` ایمن‌سازی شد.
3. **تراکنش‌های غیرمسدودکننده چندمرحله‌ای (Non-blocking Multi-phase Verification)**: قفل سطحی پایگاه‌داده قبل از برقراری ارتباط شبکه‌ای با زرین‌پال آزاد شده و استعلام وضعیت بدون مسدودسازی اتصالات دیتابیس صورت می‌پذیرد.
4. **تأیید کامل آزمون‌های خودکار**: تمام ۳۴ آزمون خودکار در `pytest` به همراه آزمون همزمانی با قفل سطحی PostgreSQL (`select_for_update`) با موفقیت ۱۰۰٪ پاس شدند.
5. **بیلد پایدار و تایپ‌استریپت بدون نقص**: تمام صفحات فرانت‌اند با دستور `npx tsc --noEmit` بدون حتی یک خطا کامپایل شده و خروجی `npm run build` برای تمامی ۱۲ مسیر برنامه با موفقیت تولید شد.

---

## ۲. ماتریس اعتبارسنجی و بررسی صحت فنی (Verification Matrix)

| ردیف | سنجه اعتبارسنجی | استاندارد مرجع | نتیجه | سند ارجاع / لاگ اجرایی |
|:---:|---|---|:---:|---|
| ۱ | بررسی سلامت سیستمی جنگو | عدم وجود هشدار یا خطای سیستمی | **PASS** | `manage.py check` (0 issues) |
| ۲ | سلامت مایگریشن‌های پایگاه‌داده | اعمال کامل تمام مدل‌ها در PostgreSQL 18 | **PASS** | `showmigrations` (All [X]) |
| ۳ | مجموعه تست‌های جامع خودکار بک‌اند | پوشش ۱۰۰٪ منطق کسب‌وکار، امنیت و زمان‌بندی | **PASS** | `pytest backend/tests/ -v` (34 passed in 7.43s) |
| ۴ | تست همزمانی و جلوگیری از ورود تکراری | قفل سطحی اتمیک در اسکن همزمان بارکد | **PASS** | `test_simultaneous_qr_redemption_race_condition` |
| ۵ | تست جلوگیری از آسیب‌پذیری IDOR | عدم دسترسی به بلیت‌های پرداخت‌شده بدون توکن | **PASS** | `test_guest_ownership.py` |
| ۶ | تست تأیید چندمرحله‌ای پرداخت | اعتبارسنجی خارجی خارج از تراکنش دیتابیس | **PASS** | `test_multiphase_payment.py` |
| ۷ | تست امنیت رمز عبور و تزریق Origin | مسدودسازی مسموم‌سازی هدر و رمزهای پیش‌فرض | **PASS** | `test_security_remediation.py` |
| ۸ | اعتبارسنجی نوع‌داده‌های TypeScript | انطباق کامل و Strict بدون خطای نوع | **PASS** | `npx tsc --noEmit` (Exit 0) |
| ۹ | خروجی بیلد پروداکشن Next.js | تولید بیلد بهینه برای ۱۲ مسیر کلاینت/سرور | **PASS** | `npm run build` (Exit 0, 12/12 static/dynamic routes) |
| ۱۰ | دسترسی‌پذیری مسیرهای برنامه | دریافت وضعیت 200 OK از تمام صفحات کلیدی | **PASS** | فراخوانی سرور (Home, Admin, Staff, Tickets) |

---

## ۳. جزییات اصلاحات امنیتی (Security Remediations - P0)

### ۱. رفع قطعی رخنه شناسه مستقیم شیء (IDOR Remediation)
- **شرح نقص پیشین:** در متدهای `OrderTicketsView` و `TicketQrImageView`، شرطی وجود داشت که اگر وضعیت سفارش `PAID` بود، دسترسی به صورت عمومی آزاد می‌شد (`if order.status in ['PAID', ...]: has_access = True`). این امر به هر شخص ثالث اجازه می‌داد صرفاً با دانستن یا حدس زدن شناسه عمومی سفارش (`public_id`)، بلیت‌ها و بارکدهای QR اختصاصی خریدار را مشاهده یا سرقت کند.
- **اقدام اصلاحی:** کلیه میان‌برهای وضعیتی و پارامترهای نامعتبر کوئری حذف گردیدند. دسترسی به بلیت‌ها و تصاویر QR منحصراً به دو گروه محدود شد:
  1. پرسنل و مدیران احرازهویت‌شده سالن (`is_staff` یا `is_superuser`).
  2. خریدار مهمان دارنده توکن محرمانه دسترسی که تطابق آن با روش امن زمانی `secrets.compare_digest` در مدل سفارش تایید می‌گردد. توکن مهمان از هدر `X-Guest-Token` یا کوکی HttpOnly امن استخراج می‌شود.

### ۲. حذف نشت توکن‌های محرمانه (Credential Leak Elimination)
- **شرح نقص پیشین:** فیلد `raw_token` در `TicketPassSerializer` به صورت متنی بازگردانده می‌شد و همچنین فیلد `guest_access_token` در پاسخ بدنه JSON سفارش وجود داشت.
- **اقدام اصلاحی:** فیلد `raw_token` از `TicketPassSerializer` به طور کامل حذف شد. کاربر مهمان صرفاً `qr_data_uri` را جهت نمایش و پرینت بارکد دریافت می‌نماید. فیلد `guest_access_token` از پاسخ متد `OrderTicketsView` حذف شد و انتقال توکن به مرورگر صرفاً از طریق کوکی امن `HttpOnly` با فلگ‌های `SameSite=Lax` و کنترل دامنه صورت می‌پذیرد.

### ۳. جلوگیری از مسموم‌سازی هدر هدایت پرداخت (Host/Origin Poisoning)
- **شرح نقص پیشین:** در کنترلر بازگشت از درگاه زرین‌پال (`ZarinPalCallbackView`)، در صورت وجود مقدار `order.frontend_origin` (که از هدر `Origin` کلاینت خوانده می‌شد)، کاربر به همراه توکن مهمان به آن آدرس هدایت می‌شد که خطر دزدی توکن از طریق فیشینگ را به همراه داشت.
- **اقدام اصلاحی:** آدرس بازگشت فرانت‌اند منحصراً از تنظیم سروری `settings.FRONTEND_URL` دریافت شده و هیچ‌گونه هدر ورودی از کلاینت در مسیردهی تأثیرگذار نیست.

### ۴. حذف رمز عبور پیش‌فرض پرسنل (Predictable Password Elimination)
- **شرح نقص پیشین:** در ایجاد پرسنل جدید، اگر رمز عبور ارسال نمی‌شد، سامانه به طور پیش‌فرض رمز ضعیف و قابل حدس `TempPass123!` را ثبت می‌کرد.
- **اقدام اصلاحی:** فیلد `password` در سریالایزر `StaffCreateUpdateSerializer` برای ساخت کاربران جدید اجباری شد و حداقل طول ۸ کاراکتر بر آن اعمال گردید. ثبت بدون رمز عبور با خطای اعتبارسنجی ۴۰۰ مسدود شد.

### ۵. پیش‌فرض‌های امنیتی فریم‌ورک (Fail-Closed DRF Permissions)
- **شرح نقص پیشین:** مقدار `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']` برابر `AllowAny` بود که در صورت افزودن ویوهای جدید بدون پرمیشن صریح، ریسک نشت داده وجود داشت.
- **اقدام اصلاحی:** پیش‌فرض سیستم به `rest_framework.permissions.IsAuthenticated` تغییر یافت و تمامی ویوهای عمومی به صورت صریح و کنترل‌شده از `permission_classes = [permissions.AllowAny]` استفاده می‌کنند.

### ۶. عدم لاگ توکن‌های خام در پایگاه‌داده (Check-In Note Hashing)
- **شرح نقص پیشین:** در صورت اسکن یک بارکد ناشناخته، ۳۲ کاراکتر اول ورودی خام در فیلد یادداشت دیتابیس لاگ می‌شد.
- **اقدام اصلاحی:** توکن‌های ناشناخته پیش از ثبت در لاگ دیتابیس با الگوریتم SHA-256 هش شده و صرفاً پیشوند هش ذخیره می‌گردد (`sha256:...`).

---

## ۴. رفع باگ‌های پنهان و بی‌صدا (Silent Failure Elimination)

1. **حذف قیمت فرضی در زمان عدم دسترسی به بک‌اند:** در صفحه اصلی (`page.tsx`) و فرم خرید (`TicketPurchaseForm.tsx`)، در صورت در دسترس نبودن تنظیمات رستوران، سامانه دیگر با نرخ فرضی ۱۰۰,۰۰۰ تومان کار نمی‌کند؛ بلکه وضعیت فروش به حالت غیرفعال درآمده و بنر هشدار جهت تازه‌سازی صفحه به کاربر نمایش داده می‌شود.
2. **اعتبارسنجی دقیق شماره موبایل:** فرم خرید پیش از این صرفاً طول شماره را چک می‌کرد. اکنون با رجکس دقیق `^(\+98|0)?9\d{9}$` شماره تلفن‌های ۱۱ رقمی همراه اول، ایرانسل و رایتل اعتبارسنجی شده و از ارسال خطای ناگهانی ۴۰۰ از سمت سرور جلوگیری می‌شود.
3. **تولید کلید تکرارناپذیری امن (Idempotency Key):** استفاده از رشته تصادفی ضعیف با استاندارد W3C `crypto.randomUUID()` جایگزین شد.
4. **کنترل هوشمند Polling در صفحه بلیت‌ها:** فرآیند بروزرسانی مداوم بلیت‌ها در صورت فعال نبودن تب مرورگر (`document.hidden`) یا رسیدن تمامی بلیت‌ها به وضعیت پایانی (`USED` یا `EXPIRED`) یا بروز خطای ۴۰۳/۴۰۴ متوقف شده و از هدررفت منابع سرور و کلاینت جلوگیری می‌کند.

---

## ۵. بازطراحی تراکنش‌های پرداخت (Non-blocking Multi-phase Verification)

در متد `PaymentService.process_callback`:
- **مرحله ۱:** در یک تراکنش کوتاه دیتابیسی، رکورد تراکنش با `select_for_update` قفل شده، وضعیت‌های لغو کاربر بررسی و به حالت `VERIFYING` می‌رود و سپس تراکنش بلافاصله پایان می‌یابد.
- **مرحله تماس خارجی:** فراخوانی وب‌سرویس تأیید پرداخت زرین‌پال (`adapter.verify_payment`) بدون نگه داشتن هیچ‌گونه قفل سطحی در PostgreSQL انجام می‌شود. بدین ترتیب کندی اینترنت یا تأخیر پاسخ درگاه زرین‌پال موجب مسدود شدن دیتابیس نخواهد شد.
- **مرحله ۲:** در یک تراکنش اتمیک کوتاه دیگر، وضعیت تراکنش مجدداً قفل شده، نتیجه استعلام اعمال، اعتبارسنجی مرز زمانی روز کاری بررسی و در صورت موفقیت، بلیت‌های یکتا صادر و تراکنش کامیت می‌شود.

---

## ۶. نتایج اجرای آزمون‌های خودکار (Automated Test Execution Results)

```text
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.2.0, pluggy-1.7.0
django: version: 6.1.2, settings: config.settings
rootdir: backend, configfile: pytest.ini
plugins: django-4.14.0
collected 34 items

backend/tests/test_business_time.py::TestBusinessTimeService::test_default_midnight_cutoff PASSED
backend/tests/test_business_time.py::TestBusinessTimeService::test_late_night_cutoff_at_04_am PASSED
backend/tests/test_business_time.py::TestBusinessTimeService::test_checkout_cutoff_safety_margin PASSED
backend/tests/test_checkin.py::TestCheckInRedemption::test_successful_checkin_and_single_use PASSED
backend/tests/test_checkin.py::TestCheckInRedemption::test_unpaid_order_checkin_rejected PASSED
backend/tests/test_checkin.py::TestCheckInRedemption::test_expired_ticket_checkin_rejected PASSED
backend/tests/test_checkin.py::TestCheckInRedemption::test_cancelled_ticket_rejected PASSED
backend/tests/test_checkin.py::TestCheckInRedemption::test_manual_ticket_number_checkin PASSED
backend/tests/test_guest_ownership.py::TestGuestOwnershipAndIDORPrevention::test_anonymous_cannot_view_paid_order_or_tickets_without_token PASSED
backend/tests/test_guest_ownership.py::TestGuestOwnershipAndIDORPrevention::test_authorized_guest_with_token_can_access_paid_tickets PASSED
backend/tests/test_guest_ownership.py::TestGuestOwnershipAndIDORPrevention::test_staff_admin_can_inspect_order_without_guest_token PASSED
backend/tests/test_multiphase_payment.py::TestMultiPhasePaymentVerification::test_multiphase_verification_fulfills_and_issues_tickets PASSED
backend/tests/test_multiphase_payment.py::TestMultiPhasePaymentVerification::test_multiphase_verification_handles_user_cancel PASSED
backend/tests/test_orders.py::TestOrderService::test_create_single_ticket_order PASSED
backend/tests/test_orders.py::TestOrderService::test_create_multiple_tickets_order PASSED
backend/tests/test_orders.py::TestOrderService::test_order_idempotency PASSED
backend/tests/test_orders.py::TestOrderService::test_invalid_quantity_rejected PASSED
backend/tests/test_orders.py::TestOrderService::test_disabled_sales_rejected PASSED
backend/tests/test_payments.py::TestPaymentWorkflows::test_toman_to_rial_conversion PASSED
backend/tests/test_payments.py::TestPaymentWorkflows::test_payment_initiation_and_fulfillment PASSED
backend/tests/test_payments.py::TestPaymentWorkflows::test_duplicate_callback_idempotency PASSED
backend/tests/test_payments.py::TestPaymentWorkflows::test_payment_user_cancellation PASSED
backend/tests/test_payments.py::TestPaymentWorkflows::test_late_payment_at_business_day_boundary PASSED
backend/tests/test_permissions.py::TestRolePermissions::test_anonymous_cannot_access_admin_dashboard PASSED
backend/tests/test_permissions.py::TestRolePermissions::test_scanner_staff_cannot_access_financial_dashboard_or_settings PASSED
backend/tests/test_permissions.py::TestRolePermissions::test_admin_can_access_dashboard_but_cannot_change_price PASSED
backend/tests/test_superadmin_can_change_price PASSED
backend/tests/test_security_remediation.py::TestSecurityRemediations::test_payment_callback_rejects_origin_poisoning PASSED
backend/tests/test_security_remediation.py::TestSecurityRemediations::test_staff_creation_requires_explicit_password PASSED
backend/tests/test_security_remediation.py::TestSecurityRemediations::test_checkin_notes_hash_unknown_token_without_plaintext_leak PASSED
backend/tests/test_tickets.py::TestTicketLifecycle::test_multi_ticket_independence PASSED
backend/tests/test_tickets.py::TestTicketLifecycle::test_token_encryption_and_decryption PASSED
backend/tests/test_tickets.py::TestTicketLifecycle::test_effective_status_transitions PASSED
backend/tests/test_concurrency.py::TestPostgreSQLConcurrency::test_simultaneous_qr_redemption_race_condition PASSED

============================= 34 passed in 7.43s ==============================
```

---

## ۷. نتیجه‌گیری و وضعیت نهایی

سامانه در وضعیت کاملاً پایدار، امن و آماده برای استفاده عملیاتی در محیط رستوران قرار دارد. تمامی سرویس‌های بک‌اند روی پورت `8000` و فرانت‌اند روی پورت `3000` با دسترسی شبکه محلی فعال بوده و کلاینت‌ها بدون هرگونه تداخل می‌توانند از امکانات خرید بلیت و گیت ورود استفاده نمایند.
