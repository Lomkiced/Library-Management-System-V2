import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library } from "lucide-react";

// --- Constants ---
const PAGE_COUNT = 5;
const ANIMATION_DURATION = 4.5;
const OPEN_DELAY = 0.5;

const LoginTransition = memo(({ onFinish }) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Show text sync with animation
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 2000);

    // Redirect
    const finishTimer = setTimeout(() => {
      onFinish();
    }, ANIMATION_DURATION * 1000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // --- Reduced Motion View ---
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020463]/95"
      >
        <div className="text-center">
          <Library size={64} className="text-white mx-auto mb-4" />
          <div className="text-white text-2xl font-bold">Welcome, Admin</div>
        </div>
      </div>
    );
  }

  // --- 3D Animation Variants ---

  // Container to set the stage
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8 } },
    exit: { opacity: 0 }
  };

  // The book wrapper
  const bookVariants = {
    initial: {
      rotateX: 10,
      rotateY: -20,
      scale: 0.8,
      y: 50,
      opacity: 0
    },
    animate: {
      rotateX: 10,
      rotateY: -20,
      scale: 1,
      y: 0,
      opacity: 1,
      transition: { duration: 1, type: "spring", stiffness: 100 }
    }
  };

  // The front cover
  const coverVariants = {
    closed: { rotateY: 0 },
    open: {
      rotateY: -135,
      transition: { duration: 1.2, delay: OPEN_DELAY, ease: [0.4, 0, 0.2, 1] }
    }
  };

  // Generic page flip
  const pageVariants = (index) => ({
    closed: { rotateY: 0, z: -index }, // Stack depth
    open: {
      rotateY: -130 + (index * 2), // Fan out slightly
      transition: {
        duration: 0.8,
        delay: OPEN_DELAY + 0.3 + (index * 0.15), // Staggered flipping
        ease: "easeInOut"
      }
    }
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020463]/95 backdrop-blur-md overflow-hidden"
      style={{ perspective: "2000px" }} // Higher perspective for better 3D look
    >
      {/* Dynamic Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-radial-gradient from-blue-500/10 via-transparent to-transparent pointer-events-none"
      />

      {/* --- THE BOOK --- */}
      <motion.div
        variants={bookVariants}
        className="relative w-[280px] h-[420px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back Cover (Static Base) */}
        <div
          className="absolute inset-0 rounded-r-lg bg-[#1a1c7a] shadow-2xl"
          style={{
            transform: "translateZ(-15px)",
            boxShadow: "20px 20px 60px rgba(0,0,0,0.5)"
          }}
        />

        {/* --- PAGES --- */}
        {/* We map a few pages to flip */}
        {[...Array(PAGE_COUNT)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={pageVariants(i)}
            initial="closed"
            animate="open"
            className="absolute inset-0 origin-left bg-white rounded-r-md border-l border-gray-200"
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Front of the page (Text/Content simulation) */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between overflow-hidden bg-gradient-to-r from-gray-100 to-white">
              <div className="space-y-3 opacity-30 mt-4">
                <div className="h-2 bg-gray-400 rounded w-3/4" />
                <div className="h-2 bg-gray-400 rounded w-full" />
                <div className="h-2 bg-gray-400 rounded w-5/6" />
                <div className="h-2 bg-gray-400 rounded w-full" />
              </div>
              <div className="text-[10px] text-gray-400 text-right">{i + 1}</div>

              {/* Fake text shadow on flip */}
              <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
            </div>

            {/* Back of the page (when flipped) */}
            <div
              className="absolute inset-0 bg-gray-50 rounded-l-md border-r border-gray-200"
              style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        ))}

        {/* --- FRONT COVER --- */}
        <motion.div
          variants={coverVariants}
          initial="closed"
          animate="open"
          className="absolute inset-0 origin-left z-20"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Cover Outside Front */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#020463] to-[#1a1c7a] rounded-r-lg border border-white/10 flex flex-col items-center justify-center text-white p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Spine Highlight */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-white/5 border-r border-white/10" />

            {/* Decorative Golden Border */}
            <div className="absolute inset-4 border-2 border-[#FFD700]/30 rounded-r-sm" />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Library size={56} strokeWidth={1.5} className="mb-6 drop-shadow-md text-white/90" />
            </motion.div>

            <div className="text-center z-10">
              <h1 className="text-xl font-bold uppercase tracking-widest text-white drop-shadow-md">
                PCLU Library
              </h1>
              <div className="h-px w-16 bg-[#FFD700]/50 mx-auto my-3" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#FFD700]/80">
                Management System
              </p>
            </div>
          </div>

          {/* Cover Inside (When opened) */}
          <div
            className="absolute inset-0 bg-[#0f114a] rounded-l-lg transform rotate-y-180 flex items-center justify-center border-r border-white/10"
            style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
          >
            <div className="text-blue-200/20 font-serif text-6xl opacity-20">Ex Libris</div>
          </div>
        </motion.div>

        {/* --- LAST PAGE / WELCOME MESSAGE --- */}
        {/* This stays flat at the back of the book stack */}
        <div className="absolute inset-0 bg-white rounded-r-lg z-0 flex items-center justify-center p-8 text-center border-l border-gray-200">

          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mb-4"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <Library className="text-[#020463]" size={24} />
                  </div>
                </motion.div>

                <h2 className="text-[#020463] text-2xl font-extrabold font-sans tracking-tight mb-1">
                  Welcome Back
                </h2>
                <p className="text-[#1a1c7a] text-lg font-medium">
                  Admin
                </p>

                {/* Loading ellipsis */}
                <div className="flex gap-1 mt-6">
                  {[0, 1, 2].map(dot => (
                    <motion.div
                      key={dot}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                      className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>

      {/* Floor Shadow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute bottom-1/4 w-[300px] h-[40px] bg-black/40 blur-2xl rounded-[100%] pointer-events-none"
        style={{ transform: "rotateX(70deg) translateY(150px)" }}
      />
    </motion.div>
  );
});

LoginTransition.displayName = 'LoginTransition';

export default LoginTransition;
