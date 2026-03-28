import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ListOrdered, Search, Loader2, GripVertical,
  Trash2, ArrowUp, ArrowDown, Save, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";

interface ChoiceItem {
  courseId: number;
  rank: number;
  course?: Course;
}

export default function Choices() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

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

  const [localChoices, setLocalChoices] = useState<ChoiceItem[]>([]);
  const [courseDetails, setCourseDetails] = useState<Record<number, Course>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Load choices from server
  useEffect(() => {
    if (choicesData?.choices) {
      setLocalChoices(choicesData.choices.sort((a, b) => a.rank - b.rank));
    }
  }, [choicesData]);

  // Fetch course details for each choice
  const courseIds = localChoices.map((c) => c.courseId);

  const { data: allCoursesData } = trpc.courses.list.useQuery(
    { pageSize: 100 },
    { enabled: courseIds.length > 0 }
  );

  useEffect(() => {
    if (allCoursesData?.courses) {
      const map: Record<number, Course> = {};
      allCoursesData.courses.forEach((c) => { map[c.id] = c; });
      setCourseDetails(map);
    }
  }, [allCoursesData]);

  // ─── Drag & Drop (HTML5 native) ────────────────────────────────────────────
  const dragIndex = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
    // Ghost image: use the element itself
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIdx(index);
  };

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
    const reranked = newChoices.map((c, i) => ({ ...c, rank: i + 1 }));
    setLocalChoices(reranked);
    setIsDirty(true);
  };

  const moveDown = (index: number) => {
    if (index === localChoices.length - 1) return;
    const newChoices = [...localChoices];
    [newChoices[index], newChoices[index + 1]] = [newChoices[index + 1], newChoices[index]];
    const reranked = newChoices.map((c, i) => ({ ...c, rank: i + 1 }));
    setLocalChoices(reranked);
    setIsDirty(true);
  };

  const removeChoice = (courseId: number) => {
    const newChoices = localChoices
      .filter((c) => c.courseId !== courseId)
      .map((c, i) => ({ ...c, rank: i + 1 }));
    setLocalChoices(newChoices);
    setIsDirty(true);
  };

  const handleSave = () => {
    saveChoices.mutate({ choices: localChoices });
    setIsDirty(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <ListOrdered className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t("choices.title")}</h2>
        <p className="text-muted-foreground mb-6">{t("choices.loginRequired")}</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="gap-2">
          {t("nav.login")}
        </Button>
      </div>
    );
  }

  if (choicesLoading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl">
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
          <span className="text-sm text-muted-foreground">
            {localChoices.length}/20
          </span>
          {isDirty && (
            <Button size="sm" onClick={handleSave} disabled={saveChoices.isPending} className="gap-2">
              {saveChoices.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
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

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{language === "en" ? "Choices filled" : "已填志願"}</span>
          <span>{localChoices.length}/20</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-300"
            style={{ width: `${(localChoices.length / 20) * 100}%` }}
          />
        </div>
      </div>

      {/* Drag hint */}
      {localChoices.length > 1 && (
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5" />
          {language === "en" ? "Drag to reorder, or use arrows" : "拖拉調整順序，或使用箭頭按鈕"}
        </p>
      )}

      {localChoices.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ListOrdered className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t("choices.empty")}</p>
          <Link href="/courses">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              {t("choices.empty.cta")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {localChoices.map((choice, index) => {
            const course = courseDetails[choice.courseId];
            const name = course
              ? (language === "zh-CN" ? (course.nameZhCn || course.nameZhTw) :
                language === "en" ? (course.nameEn || course.nameZhTw) : course.nameZhTw)
              : `Course #${choice.courseId}`;

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
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />

                {/* Rank badge */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  index === 0 ? "bg-foreground text-background" :
                  index < 5 ? "bg-secondary text-foreground" :
                  "bg-secondary/50 text-muted-foreground"
                )}>
                  {index + 1}
                </div>

                {/* Course info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
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
                    <p className="text-xs text-muted-foreground">{course.institution}</p>
                  )}
                </div>

                {/* Stats */}
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

                {/* Controls */}
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground"
                    onClick={() => moveDown(index)}
                    disabled={index === localChoices.length - 1}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeChoice(choice.courseId)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {localChoices.length > 0 && localChoices.length < 20 && (
        <div className="mt-4 text-center">
          <Link href="/courses">
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="w-4 h-4" />
              {t("choices.addFromSearch")}
            </Button>
          </Link>
        </div>
      )}

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
