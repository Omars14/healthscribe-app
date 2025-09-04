# Supabase Email Verification Setup Guide

## Issue: Email verification not working after signup

### Steps to Fix Email Verification in Supabase

## 1. Configure Supabase Authentication Settings

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `yaznemrwbingjwqutbvb`

2. **Navigate to Authentication Settings**
   - Go to `Authentication` → `Settings`
   - Click on the `Email Auth` tab

3. **Enable Email Confirmations**
   - Ensure "Enable email confirmations" is **ON**
   - Set "Confirm email" to **Required**

## 2. Configure Email Templates

1. **Go to Email Templates**
   - Navigate to `Authentication` → `Email Templates`

2. **Update the Confirmation Email Template**
   - Select "Confirm signup" template
   - Update the redirect URL in the template to:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
   ```
   
   Or if you want to redirect to login after confirmation:
   ```
   https://healthscribepro.vercel.app/login
   ```

3. **Email Template Variables**
   Make sure your template includes:
   ```html
   <h2>Confirm your email</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
   ```

## 3. Configure URL Configuration

1. **Go to URL Configuration**
   - Navigate to `Authentication` → `URL Configuration`

2. **Add Site URL**
   - Set Site URL to: `https://healthscribepro.vercel.app`

3. **Add Redirect URLs**
   Add these URLs to the "Redirect URLs" whitelist:
   ```
   https://healthscribepro.vercel.app
   https://healthscribepro.vercel.app/login
   https://healthscribepro.vercel.app/dashboard
   https://healthscribepro.vercel.app/auth/callback
   https://healthscribepro.vercel.app/auth/confirm
   ```

## 4. SMTP Configuration (For Custom Email Sending)

### Option A: Use Supabase's Built-in Email Service (Default)
- Supabase provides a built-in email service
- Limited to 3 emails per hour for free tier
- No configuration needed

### Option B: Configure Custom SMTP (Recommended for Production)

1. **Go to Settings → Project Settings**
2. **Navigate to Auth → SMTP Settings**
3. **Enable custom SMTP**
4. **Configure with your email provider:**

#### Example with Gmail:
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-specific-password
Sender email: your-email@gmail.com
Sender name: HealthScribe Pro
```

#### Example with SendGrid:
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: your-sendgrid-api-key
Sender email: noreply@healthscribepro.vercel.app
Sender name: HealthScribe Pro
```

#### Example with Resend:
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: your-resend-api-key
Sender email: noreply@healthscribepro.vercel.app
Sender name: HealthScribe Pro
```

## 5. Test Email Configuration

1. **Create a test account**
   - Go to https://healthscribepro.vercel.app/signup
   - Sign up with a valid email address

2. **Check email delivery**
   - Check inbox and spam folder
   - Verify the confirmation link works

## 6. Troubleshooting

### If emails are not being sent:

1. **Check Supabase Logs**
   - Go to `Logs` → `Auth Logs` in Supabase Dashboard
   - Look for email sending errors

2. **Verify Rate Limits**
   - Free tier: 3 emails per hour
   - Consider upgrading or using custom SMTP

3. **Check Email Provider Settings**
   - Ensure "Less secure app access" is enabled (Gmail)
   - Use app-specific passwords for 2FA accounts
   - Verify SMTP credentials are correct

4. **Test with Supabase SQL Editor**
   Run this query to check auth settings:
   ```sql
   SELECT * FROM auth.users WHERE email = 'test@example.com';
   ```

### Common Issues and Solutions:

| Issue | Solution |
|-------|----------|
| No email received | Check spam folder, verify SMTP settings |
| "Email not confirmed" error | Ensure email confirmations are enabled |
| Invalid redirect URL | Add URL to whitelist in Supabase |
| Rate limit exceeded | Use custom SMTP or wait |
| SMTP connection failed | Verify credentials and port settings |

## 7. Code Updates Already Applied

The following code has been updated to support email verification:

```typescript
// src/contexts/AuthContext.tsx
const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://healthscribepro.vercel.app'}/login`,
      },
    })
    // ...
  }
}
```

## 8. Environment Variables

Ensure these are set in Vercel:
- `NEXT_PUBLIC_SITE_URL`: https://healthscribepro.vercel.app
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## Next Steps

1. Log into Supabase Dashboard
2. Follow the configuration steps above
3. Test with a new signup
4. Monitor auth logs for any issues

## Support

If issues persist after following these steps:
1. Check Supabase Status: https://status.supabase.com/
2. Review Supabase Auth Docs: https://supabase.com/docs/guides/auth/auth-email
3. Contact Supabase Support with your project ID
