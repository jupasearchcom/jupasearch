// This page is replaced by DSEScores page
// Redirect to /dse
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AIAdvisor() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dse");
  }, [setLocation]);
  return null;
}
