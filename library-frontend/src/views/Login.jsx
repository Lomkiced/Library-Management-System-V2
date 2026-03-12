import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle, ArrowRight, BookOpen,
  CheckCircle2, Library,
  Lock,
  User
} from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import axiosClient from "../axios-client";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import LoginTransition from "../components/LoginTransition";
import Button from "../components/ui/Button";
import FloatingInput from "../components/ui/FloatingInput";
import { useLibrarySettings } from "../context/LibrarySettingsContext";

// --- Components ---

const FloatingLogo = ({ logoSrc }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative z-10 flex flex-col items-center justify-center h-full">
      <motion.div
        animate={shouldReduceMotion ? {} : {
          y: [-15, 15, -15],
          rotate: [0, 2, -2, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-20"
      >
        <img
          src={logoSrc || "/pclu-logo.png"}
          alt="School Logo"
          className="w-80 h-80 object-contain drop-shadow-2xl"
        />
      </motion.div>

      {/* Floating particles around logo */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 left-1/4 w-4 h-4 rounded-full bg-blue-400/50 blur-sm"
          />
          <motion.div
            animate={{ y: [20, -20, 20], x: [10, -10, 10], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-purple-400/40 blur-md"
          />
        </>
      )}
    </div>
  );
};

const AnimatedBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[100px]" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
  </div>
));

AnimatedBackground.displayName = 'AnimatedBackground';

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [secureConnection, setSecureConnection] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { libraryName, libraryShortName } = useLibrarySettings();

  useEffect(() => {
    const timer = setTimeout(() => setSecureConnection(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!username) errors.username = "Required";
    if (!password) errors.password = "Required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username, password]);

  const onSubmit = useCallback((ev) => {
    ev.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setLoading(true);

    axiosClient.post("/login", { username, password })
      .then(({ data }) => {
        localStorage.setItem("ACCESS_TOKEN", data.token);
        localStorage.setItem("USER_NAME", data.user.name);
        localStorage.setItem("USER_ROLE", data.user.role);
        setShowTransition(true);
      })
      .catch((err) => {
        setLoading(false);
        const response = err.response;
        if (response && response.status === 401) {
          setError("Invalid credentials.");
        } else {
          setError("Server unreachable.");
        }
      });
  }, [username, password, validateForm]);

  const handleStudentAccess = () => window.location.href = '/catalog';
  const handleTransitionFinish = () => window.location.reload();

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Transition Overlay */}
      <AnimatePresence>
        {showTransition && <LoginTransition onFinish={handleTransitionFinish} />}
      </AnimatePresence>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />

      {/* --- LEFT PANEL (Visual & Branding) --- */}
      <div className="hidden lg:flex w-1/2 relative flex-col text-white">
        <AnimatedBackground />

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Top Brand Text */}
          <div className="p-12">
            <h2 className="text-2xl font-bold tracking-tight text-white/90 flex items-center gap-3">
              <Library className="text-blue-400" />
              Polytechnic College of La Union
            </h2>
          </div>

          {/* Centered Floating Logo */}
          <div className="flex-1 flex items-center justify-center">
            <FloatingLogo />
          </div>

          {/* Bottom Text/Quote */}
          <div className="p-12 text-center text-blue-200/60 text-sm font-medium tracking-wide uppercase">
            Admin Access Only - Manage your library with ease and efficiency
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL (Form & Interaction) --- */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center relative shadow-2xl z-20">

        <div className="max-w-md w-full mx-auto px-8 py-12">

          {/* Header Section */}
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Welcome Back
              </h1>
              <p className="text-slate-500 font-medium">
                Please enter your details to sign in
              </p>
            </motion.div>
          </div>

          {/* Main Login Card (Simplified Visuals for Clean Look) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Error Feedback */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, h: 0 }}
                  animate={{ opacity: 1, h: "auto" }}
                  exit={{ opacity: 0, h: 0 }}
                  className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-4">
                <FloatingInput
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={User}
                  error={fieldErrors.username}
                  className="bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 transition-all"
                />

                <div className="relative">
                  <FloatingInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={Lock}
                    error={fieldErrors.password}
                    className="bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 transition-all"
                  />
                  <div className="absolute right-0 top-full mt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              </div>

              {/* Secure Connection Badge */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 py-2">
                {secureConnection ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 size={14} />
                    Secure SSL Connection
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                    Connecting...
                  </div>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
              >
                Sign In to Dashboard
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-medium tracking-wider">
                  Access Library
                </span>
              </div>
            </div>

            {/* Student Access Button */}
            <motion.button
              whileHover={{ scale: 1.01, backgroundColor: "#f8fafc" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStudentAccess}
              className="w-full group relative flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <BookOpen size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">Student Access</h3>
                  <p className="text-sm text-slate-500">Public catalog & Search</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </motion.button>

          </motion.div>

          {/* Footer Copyright */}
          <div className="mt-12 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} {libraryName || "Library System"}. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

