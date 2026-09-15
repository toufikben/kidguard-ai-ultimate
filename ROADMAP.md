# KidGuard AI Ultimate — خارطة الطريق

## الحالة الحالية

| البند | الحالة | التفاصيل |
|---|---|---|
| المستودع الخاص | مكتمل | `toufikben/kidguard-ai-ultimate` على GitHub |
| PART 1–5 | مكتمل | البنية، التشفير، P2P، الذكاء المحلي، Anti-Theft، الواجهات، Native Android |
| توسعة اللغات | مكتمل | 29 ملف لغة، auto-loader، RTL للعربية والأردية والفارسية والعبرية |
| مشروع Supabase جديد | مكتمل | `KidGuard AI Ultimate`، المشروع الجديد فقط، دون لمس المشروعين السابقين |
| Supabase project ref | مكتمل | `telcgkwnbxzcgnbgbqja` |
| Supabase region | مكتمل | West EU (Ireland) — `eu-west-1` |
| SQL migrations | مطبقة ومتحقق منها | تم إنشاء الجداول الأساسية وRLS وRealtime و`keepalive` عبر SQL Editor |
| التحقق من الجداول | مكتمل | تم التحقق من `devices` و`pairings` و`keepalive` عبر `to_regclass` |
| إعدادات التطبيق المحلية | مكتمل محلياً | `.env.local` موجود ومُستثنى من Git |
| TypeScript | ناجح | `npx tsc --noEmit` |
| Web production build | ناجح | `npm run build` |
| Vite dev server | يعمل | HTTP 200 على المنفذ 5173، ويعيد التشغيل عند تغيير `.env.local` |
| Android Java/Gradle compile | ناجح | `assembleDebug assembleRelease` نجح محلياً بعد إضافة packaging exclusions؛ release المحلي غير موقّع |
| GitHub Actions workflow | مضاف | `.github/workflows/android-build.yml` يفحص الويب، يبني Debug، ويبني APK/AAB موقّعاً عند توفر الأسرار |

## ملاحظة اتصال API

نجح endpoint الصحة الخاص بـAuth (`/auth/v1/health` HTTP 200)، بينما يعيد PostgREST حالياً `401` مع مفاتيح API العامة الجديدة والقديمة. رسالة gateway تشير إلى نوع API key غير مقبول لـREST root، رغم أن SQL Editor يعمل والجداول موجودة. يلزم إعادة فحص صفحة API Keys بعد اكتمال Provisioning أو تفعيل/إعادة توليد مفتاح public/publishable من مشروع KidGuard الجديد فقط قبل اعتماد REST/Realtime في التطبيق الإنتاجي.

## الخطوات التالية

| الأولوية | العمل | معيار الإتمام |
|---:|---|---|
| 1 | حل 401 الخاص بـPostgREST | `GET /rest/v1/devices?select=id` يعيد HTTP 200 بالمفتاح العام الصحيح |
| 2 | اختبار Supabase من التطبيق | تشغيل Auth/Realtime/Pairing من Vite مع المشروع الجديد فقط |
| 3 | إضافة GitHub Actions | مكتمل — workflow يفحص TypeScript/Web، يبني Android، ويرفع artifacts |
| 4 | إعداد أسرار GitHub | جزئي — أسرار التوقيع أُضيفت حسب تأكيد المستخدم؛ يلزم إضافة Supabase secrets للـworkflow عند الحاجة |
| 5 | إعداد Android signing | جزئي — إعداد Gradle جاهز؛ يلزم تشغيل workflow والتأكد من ظهور APK/AAB الموقّع |
| 6 | بناء Debug تلقائي | تنزيل APK من GitHub Actions وتجربته على جهاز Android فعلي |
| 7 | اختبار الوظائف الحساسة | GPS بالخلفية، إشعارات، SMS، SMTP، BLE، Foreground Service، Pairing، RLS وRealtime |
| 8 | بناء Release | إنشاء AAB موقّع بعد نجاح الاختبار اليدوي |
| 9 | Google Play | Internal Testing ثم Closed Testing بعد تجهيز Privacy Policy وData Safety |

## قواعد حماية المشاريع

- المشروعان السابقان في حساب Supabase لم يتم فتحهما أو تعديلهما.
- جميع عمليات SQL نفذت على project ref الجديد `telcgkwnbxzcgnbgbqja` فقط.
- مفاتيح Supabase المحلية موجودة في `.env.local` ولا يتم commit لها.
- لا يتم استخدام `service_role` أو أي secret داخل تطبيق الويب أو APK.
