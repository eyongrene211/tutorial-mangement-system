'use client';

import { motion } from 'framer-motion';

export function TutorialIllustration() {
  return (
    <motion.svg
      viewBox="0 0 600 500"
      className="w-full h-auto"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <motion.rect
        x="100"
        y="350"
        width="400"
        height="20"
        fill="#6366F1"
        rx="10"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      />
      <motion.g
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 15 }}
      >
        <rect x="200" y="280" width="200" height="120" fill="#1E293B" rx="5" />
        <rect x="210" y="290" width="180" height="100" fill="#3B82F6" rx="3" />
        <rect x="280" y="395" width="40" height="5" fill="#1E293B" />
      </motion.g>
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
      >
        <rect x="110" y="320" width="60" height="30" fill="#A78BFA" rx="3" />
        <rect x="115" y="295" width="55" height="25" fill="#C4B5FD" rx="3" />
        <rect x="120" y="275" width="50" height="20" fill="#DDD6FE" rx="3" />
      </motion.g>
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 12 }}
      >
        <ellipse cx="440" cy="340" rx="20" ry="5" fill="#EC4899" opacity="0.3" />
        <rect x="420" y="310" width="40" height="30" fill="#F9A8D4" rx="5" />
        <path d="M 460 320 Q 475 320 475 330 Q 475 340 460 340" stroke="#EC4899" strokeWidth="3" fill="none" />
      </motion.g>
      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
      >
        <circle cx="150" cy="150" r="25" fill="#FCD34D" opacity="0.8" />
        <text x="150" y="160" textAnchor="middle" fontSize="30">📚</text>
      </motion.g>
      <motion.g
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "loop", delay: 0.3 }}
      >
        <circle cx="450" cy="120" r="25" fill="#A7F3D0" opacity="0.8" />
        <text x="450" y="130" textAnchor="middle" fontSize="30">✏️</text>
      </motion.g>
      <motion.g
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatType: "loop", delay: 0.6 }}
      >
        <circle cx="300" cy="80" r="30" fill="#FBCFE8" opacity="0.8" />
        <text x="300" y="93" textAnchor="middle" fontSize="35">🎓</text>
      </motion.g>
      <motion.g
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
      >
        <circle cx="500" cy="200" r="20" fill="#FEF08A" />
        <path d="M 500 220 L 495 235 L 505 235 Z" fill="#FDE047" />
      </motion.g>
    </motion.svg>
  );
}
