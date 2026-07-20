"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashVideo() {
  const [showSplash, setShowSplash] = useState(true);

  // If user has reduced motion, we might want to skip the splash screen, 
  // but let's just show it and let it play, or skip if prefers-reduced-motion is on.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      const timer = setTimeout(() => setShowSplash(false), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <video
            autoPlay
            muted
            playsInline
            onEnded={() => setShowSplash(false)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          >
            <source src="/video/intro.mp4" type="video/mp4" />
          </video>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
