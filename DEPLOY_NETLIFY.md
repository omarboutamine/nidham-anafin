# التحديث التلقائي على Netlify (nidham-anafin)

## المتطلبات
- حساب [GitHub](https://github.com)
- حساب [Netlify](https://app.netlify.com)
- Git مثبّت على الجهاز (تم)

## 1) أول commit محلياً
في PowerShell:

```powershell
cd "$env:USERPROFILE\Desktop\nidham-anafin"

# مرة واحدة فقط إن طلب Git اسمك وبريدك:
# git config --global user.name "Votre Nom"
# git config --global user.email "vous@email.com"

git add .
git commit -m "Initial commit — Nidham Anafin landing"
```

## 2) إنشاء مستودع على GitHub
1. افتح https://github.com/new
2. Repository name: `nidham-anafin`
3. Public (أو Private)
4. **لا** تضف README (المشروع موجود محلياً)
5. Create repository

## 3) ربط الجهاز بـ GitHub ثم الدفع
استبدل `VOTRE_USER` باسم مستخدمك على GitHub:

```powershell
cd "$env:USERPROFILE\Desktop\nidham-anafin"
git remote add origin https://github.com/VOTRE_USER/nidham-anafin.git
git push -u origin main
```

(سيطلب تسجيل الدخول إلى GitHub)

## 4) ربط Netlify بالمستودع
1. Netlify → **Add new project** → **Import an existing project**
2. اختر **GitHub** وامنح الصلاحيات
3. اختر المستودع `nidham-anafin`
4. الإعدادات (عادة تُقرأ من `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Deploy**

## 5) بعد ذلك
كل مرة تعدّل الكود ثم:

```powershell
git add .
git commit -m "وصف التعديل"
git push
```

Netlify يعيد البناء والنشر تلقائياً.
