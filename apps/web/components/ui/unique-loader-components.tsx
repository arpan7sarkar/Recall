"use client";
import { motion } from "motion/react";
import React from "react";

export const LoaderOne = () => {
  const transition = (x: number) => {
    return {
      duration: 1,
      repeat: Infinity,
      repeatType: "loop" as const,
      delay: x * 0.2,
      ease: "easeInOut" as const,
    };
  };
  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, 10, 0] }}
        transition={transition(0)}
        className="h-3 w-3 rounded-full border border-border bg-linear-to-b from-accent to-(--accent-600)"
      />
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, 10, 0] }}
        transition={transition(1)}
        className="h-3 w-3 rounded-full border border-border bg-linear-to-b from-accent to-(--accent-600)"
      />
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, 10, 0] }}
        transition={transition(2)}
        className="h-3 w-3 rounded-full border border-border bg-linear-to-b from-accent to-(--accent-600)"
      />
    </div>
  );
};

export const LoaderTwo = () => {
  const transition = (x: number) => {
    return {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const,
      delay: x * 0.2,
      ease: "easeInOut" as const,
    };
  };
  return (
    <div className="flex items-center">
      <motion.div
        transition={transition(0)}
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        className="h-3 w-3 rounded-full bg-(--text-tertiary) shadow-md dark:bg-(--text-tertiary)"
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.4)}
        className="h-3 w-3 -translate-x-2 rounded-full bg-(--text-tertiary) shadow-md dark:bg-(--text-tertiary) opacity-60"
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.8)}
        className="h-3 w-3 -translate-x-4 rounded-full bg-(--text-tertiary) shadow-md dark:bg-(--text-tertiary) opacity-30"
      />
    </div>
  );
};

export const LoaderThree = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-12 w-12 stroke-(--text-tertiary) [--fill-final:#0059ff] [--fill-initial:transparent] dark:stroke-(--text-primary)"
    >
      <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <motion.path
        initial={{ pathLength: 0, fill: "var(--fill-initial)" }}
        animate={{ pathLength: 1, fill: "var(--fill-final)" }}
        transition={{
          duration: 2,
          ease: "easeInOut" as const,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
      />
    </motion.svg>
  );
};

export const LoaderFour = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="relative font-bold text-(--text-primary) [perspective:1000px]">
      <motion.span
        animate={{
          skewX: [0, -20, 0],
          scaleX: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 1,
          ease: "linear" as const,
        }}
        className="relative z-20 inline-block"
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-[#0059ff]/30 blur-[0.5px]"
        animate={{
          x: [-1, 2, -1.5, 1, -1],
          y: [-1, 2, -1.5, 1, -1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear" as const,
        }}
      >
        {text}
      </motion.span>
    </div>
  );
};

export const LoaderFive = ({ text }: { text: string }) => {
  return (
    <div className="font-sans font-medium text-xs tracking-[0.2em] uppercase text-(--text-tertiary)">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "loop" as const,
            delay: i * 0.1,
            ease: "easeInOut" as const,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
};
