# Quick Start - Login Guide

## 🚀 Ready to Login!

Your password reset feature is now live and both test users are ready to use.

## 🔑 Current Credentials

### User 1: Sophia Reigns Academy (Admin)
- **Email:** `sophiareignsacademy@gmail.com`
- **Password:** `SophiaPrep2024!`
- **Role:** Super Admin

### User 2: Reuben Sunday (Admin)
- **Email:** `reubensunday1220@gmail.com`
- **Password:** `SophiaPrep2024!`
- **Role:** Super Admin

## 🌐 Access the App

**Dev Server:** http://localhost:7351

### Quick Links
- **Login:** http://localhost:7351/login
- **Forgot Password:** http://localhost:7351/forgot-password
- **Signup:** http://localhost:7351/signup

## ✅ Test the Password Reset Feature

### Option 1: Login Directly
1. Go to http://localhost:7351/login
2. Enter email: `sophiareignsacademy@gmail.com`
3. Enter password: `SophiaPrep2024!`
4. Click "Log In"

### Option 2: Test Password Reset Flow
1. Go to http://localhost:7351/login
2. Click "Forgot your password?"
3. Enter email: `sophiareignsacademy@gmail.com`
4. Click "Send Reset Link"
5. Check email inbox for reset link
6. Click link and set new password
7. Login with new password

## 🛠️ Admin Commands

### Update Password (Quick)
```bash
node scripts/update-user-password.js <email> <new-password>
```

Example:
```bash
node scripts/update-user-password.js sophiareignsacademy@gmail.com MyNewPass123
```

### Send Password Reset Email
```bash
node scripts/reset-user-password.js <email>
```

Example:
```bash
node scripts/reset-user-password.js sophiareignsacademy@gmail.com
```

### Check User Exists
```bash
node scripts/check-user-exists.js
```

## 📋 What's New

✅ **Forgot Password Page** - Users can request password reset
✅ **Reset Password Page** - Users can set new password via email link
✅ **Updated Login Page** - Added "Forgot your password?" link
✅ **Admin Scripts** - Quick password management tools
✅ **Complete Documentation** - See `docs/PASSWORD_RESET_FEATURE.md`

## 🎯 Next Steps

1. **Test Login** - Use the credentials above
2. **Test Password Reset** - Try the forgot password flow
3. **Customize Emails** - Update Supabase email templates (optional)
4. **Deploy** - When ready, deploy to production

## 📞 Need Help?

- Check `docs/PASSWORD_RESET_FEATURE.md` for detailed documentation
- Check `PASSWORD_RESET_IMPLEMENTATION_SUMMARY.md` for implementation details
- Review browser console for any errors
- Check Supabase Auth logs in dashboard

---

**Happy Testing! 🎉**
