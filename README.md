# پلتفرم جامع فروش و پذیرش بلیت سالن موسیقی زنده رستوران
## Premium Live Music Restaurant Ticketing Platform

سیستم تخصصی و پیشرفته فروش آنلاین بلیت ورودی و گیت پذیرش سالن موسیقی زنده رستوران، طراحی‌شده با معماری **Modular Monolith**، بک‌اند قدرتمند **Django 6.1 (Python 3.14)**، فرانت‌اند **Next.js 15 (TypeScript + Tailwind CSS v4)** و پایگاه‌داده **PostgreSQL 18**.

---

## ۱. منطق و اصول محوری کسب‌وکار (Non-Negotiable Business Rules)

- **تفکیک کامل فضاها**: این سامانه منحصراً برای فروش بلیت ورودی سالن موسیقی زنده رستوران است و مدیریت غذا، منو یا رزرو میزهای سالن غذاخوری را پوشش نمی‌دهد.
- **یک بلیت، یک نفر**: هر بلیت خریداری‌شده دقیقاً برای ورود یک فرد است.
- **نرخ یکپارچه و یکسان**: تمامی بلیت‌ها نرخ ثابتی دارند (بدون بلیت‌های VIP، سطحی یا قیمت‌گذاری پویا).
- **رکورد و بارکد مستقل**: در سفارش‌های چندنفره، به ازای هر نفر یک رکورد مستقل در پایگاه‌داده با بارکد ۲۵۶ بیتی QR غیرقابل حدس و مجزا صادر می‌شود.
- **اعتبار منحصراً ویژه همان روز کاری**: بلیت خریداری‌شده فقط و فقط تا لحظه پایان ساعت کاری همان روز (برش روز کاری) معتبر است و در روزهای آینده معتبر نخواهد بود.
- **یک‌بار مصرف قطعی**: هر بلیت منحصراً یک‌بار قابل اسکن است و پس از اولین ورود در گیت پذیرش، به وضعیت پایدار «استفاده شده» تغییر می‌یابد.
- **جلوگیری تضمینی از ورود تکراری (Double Entry)**: پذیرش بلیت در پایگاه‌داده با قفل‌گذاری سطحی (`select_for_update`) در سطح PostgreSQL انجام می‌شود تا هرگونه تلاش همزمان برای اسکن مجدد بلیت با خطای ۴۰۹ (Conflict) رد شود.
- **خرید به عنوان مهمان (Guest Checkout)**: عضویت یا ایجاد حساب کاربری برای مشتریان اجباری نیست؛ دسترسی به بلیت‌ها با توکن امن با انتروپی بالا محافظت می‌شود.
- **واحد پول تومان**: واحد مالی داخلی و نمایشی تومان است. در مرز ارتباط با درگاه بانکی زرین‌پال، تبدیل تومان به ریال با ضریب ۱۰ انجام می‌پذیرد.

---

## ۲. پشته فنی (Technology Stack)

### بک‌اند (Backend)
- **زبان**: Python 3.14
- **فریم‌ورک**: Django 6.1 + Django REST Framework
- **پایگاه‌داده**: PostgreSQL 18 (مجهز به تراکنش‌های ACID و قفل سطحی)
- **مستندات API**: OpenAPI 3.0 / Swagger از طریق `drf-spectacular`
- **رمزنگاری QR**: Fernet (AES-GCM/CBC) با کلید ۳۲ بایتی اختصاصی
- **درگاه پرداخت**: ZarinPal REST API v4 Sandbox + Mock Provider برای تست‌های خودکار

### فرانت‌اند (Frontend)
- **فریم‌ورک**: Next.js 15 (App Router) + React 19
- **زبان**: TypeScript (تنظیمات Strict)
- **طراحی و استایل**: Tailwind CSS v4 + تم اختصاصی Light گرم و مجلل (پالت رنگی `#F5F0E7`, `#FFFCF6`, `#203D33`, `#C3A16A`)
- **تایپوگرافی**: فونت وزیرمتن (Vazirmatn Variable) با چینش کامل راست‌به‌چپ (RTL)
- **اسکنر بارکد**: `html5-qrcode` با قابلیت انتخاب دوربین و ورودی دستی جایگزین
- **آیکون‌ها**: Lucide React

---

## ۳. ساختار پوشه‌ها و اجزای پروژه

```
my_project/
├── backend/
│   ├── apps/
│   │   ├── core/           # تنظیمات رستوران (Singleton)، ثبت رخدادها (AuditLog)
│   │   ├── business_time/  # محاسبات منطقه زمانی تهران، برش روز کاری و پایان اعتبار
│   │   ├── accounts/       # احراز هویت پرسنل، کنترل نقش‌ها (مدیر ارشد، مدیر، اسکنر)
│   │   ├── orders/         # مدل سفارش، ثبت سفارش مهمان، قیمت‌گذاری و وضعیت‌ها
│   │   ├── payments/       # ارتباط با درگاه زرین‌پال v4، تبدیل ارز و اعتبارسنجی
│   │   ├── tickets/        # مدل بلیت، تولید بارکد ۲۵۶ بیتی، رمزنگاری و وضعیت مؤثر
│   │   └── checkin/        # پذیرش اتمیک در گیت ورودی با قفل سطحی PostgreSQL
│   ├── config/             # تنظیمات اصلی، URLها، WSGI/ASGI
│   ├── tests/              # آزمون‌های pytest و تست‌های همزمانی پایگاه‌داده
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # صفحه اصلی و معرفی سالن رستوران
│   │   │   ├── payment/return/        # بازگشت از درگاه و نتیجه پرداخت
│   │   │   ├── tickets/[orderId]/     # نمایش کارت‌های بلیت و بارکدهای QR
│   │   │   ├── staff/scanner/         # اسکنر گیت ورودی ویژه پرسنل پذیرش
│   │   │   └── admin/                 # پرتال اختصاصی مدیریت (داشبورد، سفارش‌ها، بلیت‌ها)
│   │   ├── components/                # کامپوننت‌های رابط کاربری، فرم‌ها و طرح‌بندی
│   │   ├── lib/                       # توابع ابزار، تبدیل اعداد به فارسی و کلاینت API
│   │   └── types/                     # تعاریف داده‌ای TypeScript
│   ├── package.json
│   └── next.config.mjs
├── docs/                              # مستندات ۱۴‌گانه کامل پروژه
├── docker-compose.yml                 # سرویس PostgreSQL 18
├── .env.example                       # نمونه متغیرهای محیطی
└── README.md
```

---

## ۴. راه‌اندازی و اجرای محیط توسعه (Quick Start)

### مرحله ۱: اجرای پایگاه‌داده PostgreSQL 18
با اطمینان از اجرای Docker:
```powershell
docker compose up -d db
```

### مرحله ۲: راه‌اندازی بک‌اند Django
```powershell
# ایجاد محیط مجازی
py -3.14 -m venv backend/venv

# فعال‌سازی محیط مجازی در ویندوز
.\backend\venv\Scripts\activate

# نصب وابستگی‌ها
pip install -r backend/requirements.txt

# اعمال مایگریشن‌ها روی پایگاه‌داده
python backend/manage.py migrate

# مقداردهی اولیه تنظیمات رستوران و حساب‌های پرسنل
python backend/manage.py setup_restaurant

# اجرای سرور توسعه بک‌اند
python backend/manage.py runserver 127.0.0.1:8000
```

> **اطلاعات حساب‌های پیش‌فرض ایجادشده:**
> - **مدیر ارشد (Super Admin):** نام کاربری `admin` | رمز عبور `AdminSecret123!`
> - **پرسنل گیت ورودی (Scanner Staff):** نام کاربری `scanner_staff` | رمز عبور `StaffSecret123!`

### مرحله ۳: راه‌اندازی فرانت‌اند Next.js
در ترمینال مجزا:
```powershell
cd frontend
npm install
npm run dev
```
سامانه در آدرس `http://localhost:3000` در دسترس خواهد بود.

---

## ۵. اجرای آزمون‌های خودکار و تست‌های همزمانی (Testing)

کلیه آزمون‌های منطق تجاری، اعتبار تاریخ، تبدیل ارز، درگاه پرداخت و آزمون حیاتی همزمانی PostgreSQL با دستور زیر اجرا می‌شوند:

```powershell
.\backend\venv\Scripts\pytest.exe backend/tests/ -v
```

### تست سناریوی جامع پایان‌به‌پایان (Live End-to-End Test):
یک اسکریپت آزمون خودکار برای بررسی فرآیند واقعی خرید ۳ بلیت، اتصال زنده به سندباکس زرین‌پال، صدور بلیت‌ها، ورود پرسنل، پذیرش بلیت اول، رد ورود مجدد همان بلیت با خطای ۴۰۹، پذیرش بلیت دوم و بررسی آمار داشبورد پیاده‌سازی شده است:

```powershell
.\backend\venv\Scripts\python.exe scripts/e2e_live_test.py
```

---

## ۶. مستندات تفصیلی پروژه (Documentation Suite)

کلیه الزامات و تحلیل‌ها در پوشه `docs/` مدون گردیده‌اند:
- [`docs/IMPLEMENTATION_PLAN.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/IMPLEMENTATION_PLAN.md): برنامه فازبندی‌شده اجرا و وضعیت پیشرفت
- [`docs/REQUIREMENTS.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/REQUIREMENTS.md): الزامات کسب‌وکار و مرزهای عدم شمول
- [`docs/ARCHITECTURE.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/ARCHITECTURE.md): مشخصات معماری Modular Monolith
- [`docs/DATABASE.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/DATABASE.md): ساختار جداول، کلیدها، ایندکس‌ها و قیود
- [`docs/ERD.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/ERD.md): نمودار موجودیت-ارتباط (Mermaid)
- [`docs/API.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/API.md): مستندات و قراردادهای REST API
- [`docs/PAYMENT_FLOW.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/PAYMENT_FLOW.md): توالی پرداخت و نمودار حالت سفارش
- [`docs/ZARINPAL_SANDBOX.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/ZARINPAL_SANDBOX.md): مشخصات اتصال به زرین‌پال v4 و تبدیل ریال/تومان
- [`docs/TICKET_LIFECYCLE.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/TICKET_LIFECYCLE.md): چرخه حیات بلیت، اعتبار پویا و قوانین ابطال
- [`docs/BUSINESS_TIME.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/BUSINESS_TIME.md): محاسبات ساعت برش روز کاری و تقویم تهران
- [`docs/SECURITY.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/SECURITY.md): تحلیل تهدیدات و امنیت OWASP ASVS
- [`docs/TESTING.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/TESTING.md): استراتژی آزمون‌های خودکار و همزمانی
- [`docs/DEPLOYMENT.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/DEPLOYMENT.md): راهنمای استقرار و گیت‌های ورود به Production
- [`docs/OPEN_QUESTIONS.md`](file:///c:/Users/coder/OneDrive/Desktop/Project/my_project/docs/OPEN_QUESTIONS.md): فهرست موارد منوط به تصمیم نهایی مدیریت رستوران

