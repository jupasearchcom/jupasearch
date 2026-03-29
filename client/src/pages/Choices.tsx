import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ListOrdered, Search, Loader2, GripVertical,
  Trash2, ArrowUp, ArrowDown, Save, CheckCircle2, Cloud, Plus, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";

const LS_KEY = "jupasearch_choices";
const LS_PENDING_KEY = "jupasearch_choices_pending";

interface ChoiceItem {
  courseId: number;
  rank: number;
}

function getLocalChoices(): ChoiceItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalChoices(choices: ChoiceItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(choices.map(({ courseId, rank }) => ({ courseId, rank }))));
}

function getLocalPending(): number[] {
  try {
    const raw = localStorage.getItem(LS_PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPending(ids: number[]) {
  localStorage.setItem(LS_PENDING_KEY, JSON.stringify(ids));
}

export default function Choices() {
  const { t, language } = useLanguage();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  // Server choices (when logged in)
  const { data: choicesData, isLoading: choicesLoading } = trpc.choices.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const saveChoices = trpc.choices.save.useMutation({
    onSuccess: () => {
      utils.choices.get.invalidate();
      toast.success(t("choices.saved"));
    },
  });

  // Use a single source of truth: localChoices (synced from server when authenticated)
  const [localChoices, setLocalChoices] = useState<ChoiceItem[]>([]);
  // Pending courses: added from search but not yet in the choices list
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize from localStorage after auth is determined
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated && !initialized) {
      setLocalChoices(getLocalChoices());
      setPendingIds(getLocalPending());
      setInitialized(true);
    }
  }, [authLoading, isAuthenticated, initialized]);

  // Sync from server when authenticated
  useEffect(() => {
    if (isAuthenticated && choicesData?.choices) {
      setLocalChoices(choicesData.choices.sort((a, b) => a.rank - b.rank));
      setInitialized(true);
    }
  }, [isAuthenticated, choicesData]);

  // Persist to localStorage when not authenticated
  useEffect(() => {
    if (!isAuthenticated && initialized) {
      saveLocalChoices(localChoices);
    }
  }, [isAuthenticated, localChoices, initialized]);

  useEffect(() => {
    if (!isAuthenticated && initialized) {
      saveLocalPending(pendingIds);
    }
  }, [isAuthenticated, pendingIds, initialized]);

  // Fetch course details for all courseIds (choices + pending) using getByIds
  const allIds = useMemo(() => Array.from(new Set([...localChoices.map((c) => c.courseId), ...pendingIds])), [localChoices, pendingIds]);
  const [courseDetails, setCourseDetails] = useState<Record<number, Course>>({});

  const { data: byIdsData } = trpc.courses.getByIds.useQuery(
    { ids: allIds },
    { enabled: allIds.length > 0 }
  );

  useEffect(() => {
    if (byIdsData) {
      const map: Record<number, Course> = {};
      byIdsData.forEach((c) => { map[c.id] = c; });
      setCourseDetails(map);
    }
  }, [byIdsData]);

  // ─── Drag & Drop ──────────────────────────────────────────────────────────
  const dragIndex = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
  };

  const handleDragEnter = (index: number) => setDragOverIdx(index);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === toIndex) {
      setDragOverIdx(null);
      dragIndex.current = null;
      return;
    }
    const newChoices = [...localChoices];
    const [moved] = newChoices.splice(fromIndex, 1);
    newChoices.splice(toIndex, 0, moved);
    const reranked = newChoices.map((c, i) => ({ ...c, rank: i + 1 }));
    setLocalChoices(reranked);
    setIsDirty(true);
    setDragOverIdx(null);
    dragIndex.current = null;
  };

  const handleDragEnd = () => {
    setDragOverIdx(null);
    dragIndex.current = null;
  };

  // ─── Arrow controls ────────────────────────────────────────────────────────
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newChoices = [...localChoices];
    [newChoices[index - 1], newChoices[index]] = [newChoices[index], newChoices[index - 1]];
    setLocalChoices(newChoices.map((c, i) => ({ ...c, rank: i + 1 })));
    setIsDirty(true);
  };

  const moveDown = (index: number) => {
    if (index === localChoices.length - 1) return;
    const newChoices = [...localChoices];
    [newChoices[index], newChoices[index + 1]] = [newChoices[index + 1], newChoices[index]];
    setLocalChoices(newChoices.map((c, i) => ({ ...c, rank: i + 1 })));
    setIsDirty(true);
  };

  const removeChoice = useCallback((courseId: number) => {
    setLocalChoices((prev) =>
      prev.filter((c) => c.courseId !== courseId).map((c, i) => ({ ...c, rank: i + 1 }))
    );
    setIsDirty(true);
  }, []);

  // ─── Pending → Choices ─────────────────────────────────────────────────────
  const addPendingToChoices = useCallback((courseId: number) => {
    if (localChoices.length >= 20) {
      toast.error(t("choices.max"));
      return;
    }
    const newChoices = [...localChoices, { courseId, rank: localChoices.length + 1 }];
    setLocalChoices(newChoices);
    setPendingIds((prev) => prev.filter((id) => id !== courseId));
    setIsDirty(true);
    toast.success(language === "en" ? "Added to choices list" : language === "zh-CN" ? "已添加到志愿表" : "已添加到志願表");
  }, [localChoices, t, language]);

  const removePending = useCallback((courseId: number) => {
    setPendingIds((prev) => prev.filter((id) => id !== courseId));
  }, []);

  const handleSave = () => {
    if (isAuthenticated) {
      saveChoices.mutate({ choices: localChoices });
    } else {
      saveLocalChoices(localChoices);
      toast.success(t("choices.saved"));
    }
    setIsDirty(false);
  };

  const getInstitutionName = (course: Course) => {
    if (language === "zh-CN") return course.institutionZhCn || course.institution;
    if (language === "en") return course.institutionEn || course.institution;
    return course.institution;
  };

  const getCourseName = (course: Course) => {
    if (language === "zh-CN") return course.nameZhCn || course.nameZhTw;
    if (language === "en") return course.nameEn || course.nameZhTw;
    return course.nameZhTw;
  };

  if (authLoading || (isAuthenticated && choicesLoading)) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
            <ListOrdered className="w-6 h-6" />
            {t("choices.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("choices.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{localChoices.length}/20</span>
          {isDirty && (
            <Button size="sm" onClick={handleSave} disabled={saveChoices.isPending} className="gap-2">
              {saveChoices.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t("choices.save")}
            </Button>
          )}
          {!isDirty && localChoices.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              {t("choices.saved")}
            </div>
          )}
        </div>
      </div>

      {/* Guest sync notice */}
      {!isAuthenticated && (localChoices.length > 0 || pendingIds.length > 0) && (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
          <Cloud className="w-3.5 h-3.5 shrink-0" />
          <span>
            {language === "en"
              ? "Choices saved locally. Login to sync across devices."
              : language === "zh-CN"
              ? "志愿已保存在本地。登录以跨设备同步。"
              : "志願已儲存於本機。登入以跨裝置同步。"}
          </span>
          <a href={getLoginUrl()} className="font-medium underline underline-offset-2 hover:text-foreground">
            {t("nav.login")}
          </a>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{language === "en" ? "Choices filled" : language === "zh-CN" ? "已填志愿" : "已填志願"}</span>
          <span>{localChoices.length}/20</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-300"
            style={{ width: `${(localChoices.length / 20) * 100}%` }}
          />
        </div>
      </div>

      {/* ─── Choices List ─── */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          {language === "en" ? "My Choices" : language === "zh-CN" ? "我的志愿表" : "我的志願表"}
        </h2>
        {localChoices.length > 1 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <GripVertical className="w-3.5 h-3.5" />
            {language === "en" ? "Drag to reorder" : language === "zh-CN" ? "拖拽调整顺序" : "拖拉調整順序"}
          </p>
        )}
      </div>

      {localChoices.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl mb-6">
          <ListOrdered className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">{t("choices.empty")}</p>
          <Link href="/courses">
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="w-4 h-4" />
              {t("choices.empty.cta")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {localChoices.map((choice, index) => {
            const course = courseDetails[choice.courseId];
            const name = course ? getCourseName(course) : `Course #${choice.courseId}`;
            const isDraggingOver = dragOverIdx === index;

            return (
              <div
                key={choice.courseId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 bg-card border rounded-xl p-3 transition-all duration-150 group cursor-grab active:cursor-grabbing",
                  isDraggingOver
                    ? "border-foreground bg-secondary/30 scale-[1.01] shadow-md"
                    : "border-border hover:border-foreground/20"
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />

                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  index === 0 ? "bg-foreground text-background" :
                  index < 5 ? "bg-secondary text-foreground" :
                  "bg-secondary/50 text-muted-foreground"
                )}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {course?.jupasCode && (
                      <span className="text-xs font-mono text-muted-foreground">{course.jupasCode}</span>
                    )}
                    {course?.degreeType && (
                      <span className="text-xs bg-foreground text-background px-1.5 py-0.5 rounded">
                        {course.degreeType}
                      </span>
                    )}
                  </div>
                  <Link href={`/courses/${choice.courseId}`}>
                    <p className="text-sm font-medium hover:underline cursor-pointer truncate">{name}</p>
                  </Link>
                  {course && (
                    <p className="text-xs text-muted-foreground">{getInstitutionName(course)}</p>
                  )}
                </div>

                {course && (
                  <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
                    <div>
                      <div className="text-xs font-medium">{course.lastYearMedian ? String(course.lastYearMedian) : "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{t("courses.col.median")}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium">{course.quota ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{t("courses.col.quota")}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"
                    onClick={() => moveUp(index)} disabled={index === 0}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"
                    onClick={() => moveDown(index)} disabled={index === localChoices.length - 1}>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeChoice(choice.courseId)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Pending Courses (Staging Area) ─── */}
      {pendingIds.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              {language === "en" ? "Pending Courses" : language === "zh-CN" ? "待加入课程" : "待加入課程"}
            </h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {pendingIds.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {language === "en"
              ? "Courses you added from search. Click \"Add\" to move them into your choices list."
              : language === "zh-CN"
              ? "从课程搜索添加的课程。点击「添加」将其移入志愿表。"
              : "從課程搜尋加入的課程。點擊「添加」將其移入志願表。"}
          </p>
          <div className="space-y-2">
            {pendingIds.map((courseId) => {
              const course = courseDetails[courseId];
              const name = course ? getCourseName(course) : `Course #${courseId}`;
              const alreadyInChoices = localChoices.some((c) => c.courseId === courseId);

              return (
                <div
                  key={courseId}
                  className="flex items-center gap-3 bg-secondary/30 border border-dashed border-border rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {course?.jupasCode && (
                        <span className="text-xs font-mono text-muted-foreground">{course.jupasCode}</span>
                      )}
                      {course?.degreeType && (
                        <span className="text-xs bg-foreground/70 text-background px-1.5 py-0.5 rounded">
                          {course.degreeType}
                        </span>
                      )}
                    </div>
                    <Link href={`/courses/${courseId}`}>
                      <p className="text-sm font-medium hover:underline cursor-pointer truncate">{name}</p>
                    </Link>
                    {course && (
                      <p className="text-xs text-muted-foreground">{getInstitutionName(course)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {alreadyInChoices ? (
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">
                        {language === "en" ? "In list" : language === "zh-CN" ? "已在志愿表" : "已在志願表"}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => addPendingToChoices(courseId)}
                        disabled={localChoices.length >= 20}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        {language === "en" ? "Add" : language === "zh-CN" ? "添加" : "添加"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removePending(courseId)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add more button */}
      {localChoices.length > 0 && localChoices.length < 20 && pendingIds.length === 0 && (
        <div className="mt-4 text-center">
          <Link href="/courses">
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="w-4 h-4" />
              {t("choices.addFromSearch")}
            </Button>
          </Link>
        </div>
      )}

      {/* Save button */}
      {isDirty && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saveChoices.isPending} className="gap-2">
            {saveChoices.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("choices.save")}
          </Button>
        </div>
      )}
    </div>
  );
}
