'use client';

import React, { useState, useContext, useEffect } from 'react';
import {
  Mail,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCheck,
  MailPlus,
  KeyRound,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// RTK Query hooks
import {
  useInitiateEmailChangeMutation,
  useVerifyEmailChangeMutation,
  useInitiatePasswordChangeMutation,
  useVerifyPasswordChangeMutation,
} from '@/features/userApi';

export default function SettingProfiles() {
  const { user, setUser } = useContext(AuthContext) || {};

  const safeUser = {
    id: user?.id ?? '',
    name: user?.name ?? '',
    email: user?.email ?? '',
    companyId: user?.companyId ?? '',
    role: user?.role ?? '',
    plan: user?.plan ?? 'Basic',
    renewal: user?.renewal ?? '—',
    modulePlans: user?.modulePlans ?? {},
  };

  const [toast, setToast] = useState({ type: '', message: '' });

  // ======== Email form + OTP dialog ========
  const [emailForm, setEmailForm] = useState({
    currentEmail: safeUser.email,
    newEmail: '',
    confirmEmail: '',
  });
  const [emailOtpOpen, setEmailOtpOpen] = useState(false);
  const [emailCode, setEmailCode] = useState('');

  const [initiateEmailChange, { isLoading: sendingEmailCode }] =
    useInitiateEmailChangeMutation();
  const [verifyEmailChange, { isLoading: verifyingEmailCode }] =
    useVerifyEmailChangeMutation();

  useEffect(() => {
    setEmailForm((f) => ({ ...f, currentEmail: safeUser.email }));
  }, [safeUser.email]);

  const handleEmailSendCode = async (e) => {
    e.preventDefault();

    if (!emailForm.newEmail || !emailForm.confirmEmail) {
      return setToast({
        type: 'error',
        message: 'Please fill all email fields.',
      });
    }
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      return setToast({
        type: 'error',
        message: 'New email and confirm email do not match.',
      });
    }

    try {
      const res = await initiateEmailChange({
        currentEmail: emailForm.currentEmail,
        newEmail: emailForm.newEmail,
      }).unwrap();

      setToast({
        type: 'success',
        message: res?.message || 'Code sent to your current email.',
      });
      setEmailOtpOpen(true);
    } catch (err) {
      const msg =
        err?.data?.message || err?.error || 'Failed to send verification code.';
      setToast({ type: 'error', message: msg });
    }
  };

  const handleEmailVerify = async () => {
    if (!emailCode)
      return setToast({ type: 'error', message: 'Enter the code.' });
    try {
      const res = await verifyEmailChange({ code: emailCode }).unwrap();

      // Update context email to the new one from server response
      if (typeof setUser === 'function' && res?.data?.email) {
        setUser((u) => ({ ...u, email: res.data.email }));
      }

      setEmailForm({
        currentEmail: res?.data?.email || emailForm.newEmail,
        newEmail: '',
        confirmEmail: '',
      });
      setEmailCode(''); // Clear OTP field
      setEmailOtpOpen(false);
      setToast({
        type: 'success',
        message: res?.message || 'Email updated successfully.',
      });
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.error ||
        'Verification failed. Please check the code.';
      setToast({ type: 'error', message: msg });
      setEmailCode(''); // Clear OTP field on error
    }
  };

  // ======== Password form + OTP dialog ========
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passOtpOpen, setPassOtpOpen] = useState(false);
  const [passCode, setPassCode] = useState('');

  const [initiatePasswordChange, { isLoading: sendingPassCode }] =
    useInitiatePasswordChangeMutation();
  const [verifyPasswordChange, { isLoading: verifyingPassCode }] =
    useVerifyPasswordChangeMutation();

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const strengths = {
      0: { label: 'Very Weak', color: 'bg-red-500' },
      1: { label: 'Weak', color: 'bg-red-400' },
      2: { label: 'Fair', color: 'bg-yellow-500' },
      3: { label: 'Good', color: 'bg-blue-500' },
      4: { label: 'Strong', color: 'bg-green-500' },
      5: { label: 'Very Strong', color: 'bg-green-600' },
    };

    return { strength, ...strengths[Math.min(strength, 5)] };
  };

  const passwordStrength = getPasswordStrength(passForm.newPassword);

  // Generate strong password
  const generateStrongPassword = () => {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    setPassForm({
      ...passForm,
      newPassword: password,
      confirmPassword: password,
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordSendCode = async (e) => {
    e.preventDefault();

    if (
      !passForm.currentPassword ||
      !passForm.newPassword ||
      !passForm.confirmPassword
    ) {
      return setToast({
        type: 'error',
        message: 'Please fill all password fields.',
      });
    }
    if (passForm.newPassword.length < 8) {
      return setToast({
        type: 'error',
        message: 'New password must be at least 8 characters.',
      });
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      return setToast({
        type: 'error',
        message: 'New password and confirm password do not match.',
      });
    }

    try {
      const res = await initiatePasswordChange({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      }).unwrap();

      setToast({
        type: 'success',
        message: res?.message || 'Code sent to your email.',
      });
      setPassOtpOpen(true);
    } catch (err) {
      const msg =
        err?.data?.message || err?.error || 'Failed to send verification code.';
      setToast({ type: 'error', message: msg });
    }
  };

  const handlePasswordVerify = async () => {
    if (!passCode)
      return setToast({ type: 'error', message: 'Enter the code.' });
    try {
      const res = await verifyPasswordChange({ code: passCode }).unwrap();
      setPassForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPassCode(''); // Clear OTP field
      setPassOtpOpen(false);
      setToast({
        type: 'success',
        message: res?.message || 'Password updated successfully.',
      });
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.error ||
        'Verification failed. Please check the code.';
      setToast({ type: 'error', message: msg });
      setPassCode(''); // Clear OTP field on error
    }
  };

  return (
    <div className="mx-auto max-w-full px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account details, security, and subscription.
          </p>
        </div>
      
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Email */}
        <Card className="bg-card border-border p-6 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-medium">Change your email</h2>
          </div>

          <form onSubmit={handleEmailSendCode} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <div className="rounded-lg bg-primary/10 text-primary p-2">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Label>Current Email</Label>
                </div>
                <Input
                  value={emailForm.currentEmail}
                  onChange={(e) =>
                    setEmailForm((f) => ({
                      ...f,
                      currentEmail: e.target.value,
                    }))
                  }
                  type="email"
                  placeholder="your@email.com"
                  className="mt-1"
                  readOnly
                />
              </div>
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <div className="rounded-lg bg-primary/10 text-primary p-2">
                    <MailPlus className="h-4 w-4" />
                  </div>
                  <Label>New Email</Label>
                </div>
                <Input
                  value={emailForm.newEmail}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, newEmail: e.target.value }))
                  }
                  type="email"
                  placeholder="new@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <div className="rounded-lg bg-primary/10 text-primary p-2">
                    <CheckCheck className="h-4 w-4" />
                  </div>
                  <Label>Confirm New Email</Label>
                </div>
                <Input
                  value={emailForm.confirmEmail}
                  onChange={(e) =>
                    setEmailForm((f) => ({
                      ...f,
                      confirmEmail: e.target.value,
                    }))
                  }
                  type="email"
                  placeholder="new@email.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={sendingEmailCode}>
                {sendingEmailCode ? 'Sending…' : 'Send Code'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setEmailForm({
                    currentEmail: safeUser.email,
                    newEmail: '',
                    confirmEmail: '',
                  })
                }
              >
                Reset
              </Button>
            </div>
          </form>
        </Card>

        {/* Password */}
        <Card className="bg-card border-border p-6 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-medium">Password</h2>
          </div>

          <form onSubmit={handlePasswordSendCode} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Current Password */}
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <div className="rounded-lg bg-primary/10 text-primary p-2">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Label>Current Password</Label>
                </div>
                <div className="relative mt-1">
                  <Input
                    value={passForm.currentPassword}
                    onChange={(e) =>
                      setPassForm((f) => ({
                        ...f,
                        currentPassword: e.target.value,
                      }))
                    }
                    type={showPasswords.current ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <div className="rounded-lg bg-primary/10 text-primary p-2">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Label>New Password</Label>
                </div>
                <div className="relative mt-1">
                  <Input
                    value={passForm.newPassword}
                    onChange={(e) =>
                      setPassForm((f) => ({
                        ...f,
                        newPassword: e.target.value,
                      }))
                    }
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passForm.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Password strength:</span>
                      <span
                        className={`font-medium ${
                          passwordStrength.strength <= 2
                            ? 'text-red-600'
                            : passwordStrength.strength <= 3
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex h-1 gap-1">
                      {[1, 2, 3, 4, 5].map((index) => (
                        <div
                          key={index}
                          className={`flex-1 rounded-full ${
                            index <= passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <div className="rounded-lg bg-primary/10 text-primary p-2">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <Label>Confirm New Password</Label>
                </div>
                <div className="relative mt-1">
                  <Input
                    value={passForm.confirmPassword}
                    onChange={(e) =>
                      setPassForm((f) => ({
                        ...f,
                        confirmPassword: e.target.value,
                      }))
                    }
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {passForm.newPassword && passForm.confirmPassword && (
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    {passForm.newPassword === passForm.confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">
                          Passwords don't match
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Generate Password Button */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="header"
                onClick={generateStrongPassword}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Generate Strong Password
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={sendingPassCode}>
                {sendingPassCode ? 'Sending…' : 'Send Code'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setPassForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }
              >
                Reset
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* ===== Email OTP Dialog ===== */}
      <Dialog open={emailOtpOpen} onOpenChange={setEmailOtpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Email Change</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to your current email (
              {safeUser.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label>Code</Label>
            <Input
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setEmailOtpOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailVerify} disabled={verifyingEmailCode}>
              {verifyingEmailCode ? 'Verifying…' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Password OTP Dialog ===== */}
      <Dialog open={passOtpOpen} onOpenChange={setPassOtpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Password Change</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code we emailed to {safeUser.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label>Code</Label>
            <Input
              value={passCode}
              onChange={(e) => setPassCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setPassOtpOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordVerify} disabled={verifyingPassCode}>
              {verifyingPassCode ? 'Verifying…' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
