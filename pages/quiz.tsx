// pages/quiz.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

/** ---------------------------
 *  Types
 *  --------------------------*/
type Single =
  | "vibe"
  | "group"
  | "location"
  | "foodType"
  | "involvement"
  | "flavourProfile"
  | "budget"
  | "adventureLevel"
  | "animalType";

type Multi = "experienceTags" | "restrictions";

type QuizState = {
  name?: string;
  vibe?: string;
  group?: string;
  location?: string;
  foodType?: string;
  involvement?: string;
  experienceTags?: string[];
  flavourProfile?: string;
  budget_pp?: number;
  adventureLevel?: string;
  restrictions?: string[];
  animalType?: string;
};

type Step =
  | {
      id: "name";
      type: "text";
      title: string;
      subtitle?: string;
      placeholder?: string;
    }
  | {
      id: Single;
      type: "single";
      title: string;
      subtitle?: string;
      options: { label: string; value: string }[];
      autoAdvance?: boolean; // default true
    }
  | {
      id: Multi;
      type: "multi";
      title: string;
      subtitle?: string;
      options: { label: string; value: string }[];
      min?: number;
      max?: number;
    };

/** ---------------------------
 *  Step configuration
 *  --------------------------*/
const STEPS: Step[] = [
  {
    id: "name",
    type: "text",
    title: "Let's start on a first-name basis.",
    subtitle: "What should we call you?",
    placeholder: "Type your name",
  },
  {
    id: "vibe",
    type: "single",
    title: "What kind of vibe are you going for?",
    options: [
      { label: "A cosy night in", value: "cosy" },
      { label: "A big night out", value: "bigNightOut" },
      { label: "An outdoor adventure", value: "adventure" },
      { label: "A chance to learn something new", value: "learnSomething" },
      { label: "Surprise me", value: "surprise" },
    ],
  },
  {
    id: "group",
    type: "single",
    title: "Who are you planning to gather with?",
    options: [
      { label: "Just me", value: "solo" },
      { label: "Date night", value: "date" },
      { label: "A group of friends", value: "friends" },
      { label: "Family", value: "family" },
      { label: "Work Crew", value: "work" },
    ],
  },
  {
    id: "location",
    type: "single",
    title: "Where do you want it to happen?",
    options: [
      { label: "Out and about", value: "out" },
      { label: "At home", value: "home" },
      { label: "Online", value: "online" },
      { label: "Anywhere’s fine", value: "anywhere" },
    ],
  },
  {
    id: "foodType",
    type: "single",
    title: "What sounds tastiest?",
    options: [
      { label: "A delicious meal", value: "meal" },
      { label: "A food-based experience", value: "foodExperience" },
      { label: "A boozy tasting session", value: "tasting
