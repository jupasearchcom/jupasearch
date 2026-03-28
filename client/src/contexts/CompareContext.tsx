import React, { createContext, useContext, useState } from "react";
import type { Course } from "../../../drizzle/schema";

interface CompareContextType {
  compareList: Course[];
  addToCompare: (course: Course) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;
}

const CompareContext = createContext<CompareContextType>({
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
});

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<Course[]>([]);

  const addToCompare = (course: Course) => {
    setCompareList((prev) => {
      if (prev.find((c) => c.id === course.id)) return prev;
      if (prev.length >= 6) return prev;
      return [...prev, course];
    });
  };

  const removeFromCompare = (id: number) => {
    setCompareList((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCompare = () => setCompareList([]);

  const isInCompare = (id: number) => compareList.some((c) => c.id === id);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
