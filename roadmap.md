# Task Roadmap

## Open
- [ ] (على المستخدم) تفعيل مزوّد Google في Supabase: Authentication → Providers → Google، بـ Client ID/Secret من نفس OAuth client بتاع الموقع التاني في Google Cloud
- [ ] (على المستخدم) في Google Cloud (نفس OAuth client): إضافة Authorized redirect URI بتاع Supabase (https://etzrurlkjvfqwjwxljuw.supabase.co/auth/v1/callback — يظهر في لوحة Supabase عند توسيع Google) و Authorized JavaScript origin: https://megsy.online
- [ ] (على المستخدم) في Supabase Authentication → URL Configuration: Site URL = https://megsy.online وإضافة https://megsy.online في Redirect URLs (وللاختبار المحلي http://localhost:8080)
- [ ] (على المستخدم) إزالة إعداد Third-party auth الخاص بـ Clerk من Supabase (لم يعد مستخدمًا) — اختياري للنظافة
- [ ] اختبار دخول حقيقي بجوجل من طرف المستخدم على https://megsy.online

## Done
- [x] استيراد مشروع boost-hub إلى /dev-server بنفس القالب
- [x] قاعدة بيانات نظيفة بجداول sms_* مع RLS وسياسات
- [x] ربط مزوّد الخدمات smmfollows.com (مفتاح SMMFOLLOWS_API_KEY)
- [x] دالة sms_credit_deposit + استيراد الكتالوج (syncServices/listServices)
- [x] بناء نسخة Vercel (nitro preset "vercel" بتجاوز اكتشاف بيئة المعاينة) — المخرجات في .vercel/output
- [x] إنشاء مشروع Vercel باسم megsy + ضبط كل الإعدادات (Supabase، SMMFOLLOWS) للإنتاج والمعاينة
- [x] النشر على Vercel وربط الدومين megsy.online (يعمل 200 وwww يحوّل له)
- [x] إزالة Clerk بالكامل (ClerkProvider، sso-callback، clerk.functions، clerk-context، ClerkSessionLink، @clerk/clerk-react)
- [x] تسجيل الدخول بجوجل من Supabase مباشرة: supabase.auth.signInWithOAuth + linkSupabaseUser (ربط auth_user_id بـ sms_users) + SupabaseSessionLink + تسجيل خروج من Supabase
- [x] فهرس فريد على sms_users.auth_user_id لمنع تكرار الربط
