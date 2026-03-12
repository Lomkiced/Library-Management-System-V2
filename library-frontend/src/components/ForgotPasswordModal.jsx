import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight, Lock, KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import axiosClient from "../axios-client";
import FloatingInput from "./ui/FloatingInput";
import Button from "./ui/Button";

const STEPS = {
    EMAIL: 0,
    OTP: 1,
    RESET: 2,
    SUCCESS: 3,
};

export default function ForgotPasswordModal({ isOpen, onClose }) {
    const [step, setStep] = useState(STEPS.EMAIL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const resetState = () => {
        setStep(STEPS.EMAIL);
        setEmail("");
        setOtp("");
        setPassword("");
        setPasswordConfirmation("");
        setError(null);
        setLoading(false);
    };

    const traverseBack = () => {
        if (step > STEPS.EMAIL && step < STEPS.SUCCESS) {
            setStep(step - 1);
            setError(null);
        } else {
            onClose();
            setTimeout(resetState, 300); // Reset after modal closes
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axiosClient.post("/forgot-password/send-otp", { email });
            setStep(STEPS.OTP);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axiosClient.post("/forgot-password/verify-otp", { email, otp });
            setStep(STEPS.RESET);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            await axiosClient.post("/forgot-password/reset", {
                email,
                otp,
                password,
                password_confirmation: passwordConfirmation,
            });
            setStep(STEPS.SUCCESS);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.password?.[0] || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-800">
                            {step === STEPS.EMAIL && "Reset Password"}
                            {step === STEPS.OTP && "Enter OTP"}
                            {step === STEPS.RESET && "New Password"}
                            {step === STEPS.SUCCESS && "Success"}
                        </h3>
                        <button
                            onClick={traverseBack}
                            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                                >
                                    <AlertCircle size={16} className="shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* STEP 1: EMAIL INPUT */}
                        {step === STEPS.EMAIL && (
                            <motion.form
                                key="step-email"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendOtp}
                                className="space-y-4"
                            >
                                <p className="text-slate-600 text-sm">
                                    Enter your email address to receive a One-Time Password (OTP) for resetting your password.
                                </p>
                                <FloatingInput
                                    label="Email Address"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    icon={Mail}
                                    required
                                    autoFocus
                                />
                                <Button type="submit" loading={loading} fullWidth className="btn-primary">
                                    Send OTP <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </motion.form>
                        )}

                        {/* STEP 2: OTP INPUT */}
                        {step === STEPS.OTP && (
                            <motion.form
                                key="step-otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-4"
                            >
                                <p className="text-slate-600 text-sm">
                                    We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below.
                                </p>
                                <div className="flex justify-center my-4">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-3xl font-bold tracking-[0.5em] text-slate-800 border-b-2 border-slate-300 focus:border-blue-500 focus:outline-none py-2 bg-transparent"
                                        placeholder="••••••"
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" loading={loading} fullWidth className="btn-primary">
                                    Verify OTP
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setStep(STEPS.EMAIL)}
                                    className="w-full text-center text-xs text-blue-600 hover:underline mt-2"
                                >
                                    Change email address
                                </button>
                            </motion.form>
                        )}

                        {/* STEP 3: NEW PASSWORD */}
                        {step === STEPS.RESET && (
                            <motion.form
                                key="step-reset"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-4"
                            >
                                <p className="text-slate-600 text-sm">
                                    Create a new password for your account.
                                </p>
                                <FloatingInput
                                    label="New Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={Lock}
                                    required
                                />
                                <FloatingInput
                                    label="Confirm Password"
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    icon={KeyRound}
                                    required
                                />
                                <Button type="submit" loading={loading} fullWidth className="btn-primary">
                                    Reset Password
                                </Button>
                            </motion.form>
                        )}

                        {/* STEP 4: SUCCESS */}
                        {step === STEPS.SUCCESS && (
                            <motion.div
                                key="step-success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6"
                            >
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Password Reset!</h3>
                                <p className="text-slate-600 mb-6">
                                    Your password has been successfully updated. You can now login with your new credentials.
                                </p>
                                <Button onClick={() => { onClose(); resetState(); }} fullWidth className="btn-primary">
                                    Back to Login
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
