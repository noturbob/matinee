"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function AuthInitializer() {
  const { initAuth } = useAuth();

  useEffect(() => {
    initAuth();
  }, []);   // intentionally empty — runs once on mount

  return null;
}