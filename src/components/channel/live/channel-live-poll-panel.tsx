"use client";
// 방송 운영 빠른 설정 영역에서 투표 생성과 현재 투표 상태를 렌더링합니다.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BarChart3, Plus, Vote, X } from "lucide-react";
import { type FormEvent, useState } from "react";

interface PollState {
  title: string;
  options: string[];
}

const DEFAULT_POLL_OPTIONS = ["", ""];
const MAX_POLL_OPTION_COUNT = 4;

export default function ChannelLivePollPanel() {
  const [open, setOpen] = useState(false);
  const [activePoll, setActivePoll] = useState<PollState | null>(null);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(DEFAULT_POLL_OPTIONS);

  const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);
  const canCreatePoll = title.trim().length > 0 && trimmedOptions.length >= 2;

  const handleOptionChange = (index: number, value: string) => {
    setOptions((currentOptions) =>
      currentOptions.map((currentOption, currentIndex) =>
        currentIndex === index ? value : currentOption,
      ),
    );
  };

  const handleAddOption = () => {
    if (options.length >= MAX_POLL_OPTION_COUNT) return;

    setOptions((currentOptions) => [...currentOptions, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;

    setOptions((currentOptions) =>
      currentOptions.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleCreatePoll = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreatePoll) return;

    setActivePoll({
      title: title.trim(),
      options: trimmedOptions,
    });
    setTitle("");
    setOptions(DEFAULT_POLL_OPTIONS);
    setOpen(false);
  };

  return (
    <section className="border-border bg-muted/40 mt-auto flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="bg-background text-brand flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Vote className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-foreground text-sm font-bold">투표</h3>
            <p className="text-muted-foreground text-xs font-semibold">
              {activePoll ? "진행 중" : "대기 중"}
            </p>
          </div>
        </div>
        {activePoll && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl font-bold"
            onClick={() => setActivePoll(null)}
          >
            종료
          </Button>
        )}
      </div>

      {activePoll ? (
        <div className="flex flex-col gap-3">
          <strong className="text-sm leading-5">{activePoll.title}</strong>
          <div className="grid gap-2">
            {activePoll.options.map((option, index) => (
              <div
                key={`${option}-${index}`}
                className="border-border bg-background flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <span className="text-sm font-semibold">{option}</span>
                <span className="text-muted-foreground text-xs font-bold">0%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground bg-background flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
          <BarChart3 className="size-4 shrink-0" />
          <span>진행 중인 투표 없음</span>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              type="button"
              className={cn(
                "bg-brand hover:bg-brand/90 shadow-brand/20 h-10 rounded-xl text-sm font-bold text-white shadow-sm",
                "active:scale-95",
              )}
            />
          }
        >
          <Plus className="size-4" />
          투표 만들기
        </DialogTrigger>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0 shadow-xl">
          <DialogHeader className="bg-brand/5 border-brand/10 border-b px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="bg-brand/10 text-brand ring-brand/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
                <Vote className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold">투표 만들기</DialogTitle>
                <DialogDescription className="mt-1 leading-relaxed">
                  방송 중 사용할 투표를 준비합니다.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreatePoll} className="flex flex-col gap-5 px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-muted-foreground text-xs font-semibold">투표 제목</label>
              <Input
                value={title}
                maxLength={50}
                placeholder="투표 제목을 입력하세요"
                className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-muted-foreground text-xs font-semibold">선택지</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-bold"
                  disabled={options.length >= MAX_POLL_OPTION_COUNT}
                  onClick={handleAddOption}
                >
                  <Plus className="size-3.5" />
                  추가
                </Button>
              </div>
              <div className="grid gap-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      maxLength={24}
                      placeholder={`선택지 ${index + 1}`}
                      className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                      onChange={(event) => handleOptionChange(index, event.target.value)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-xl"
                      disabled={options.length <= 2}
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="size-4" />
                      <span className="sr-only">선택지 삭제</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 rounded-xl font-semibold"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={!canCreatePoll}
                className="bg-brand hover:bg-brand/90 h-10 flex-1 rounded-xl font-bold text-white"
              >
                투표 시작
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
