// 채팅 금칙어 추가와 삭제 필드를 렌더링합니다.

import { HintNote } from "@/components/common/hint-note";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT,
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH,
} from "@/constants/channel/chat";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useState } from "react";

interface Props {
  value: string[];
  disabled: boolean;
  error?: string;
  onChange: (value: string[]) => void;
}

export function ChatForbiddenWordsField({ value, disabled, error, onChange }: Props) {
  const [word, setWord] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAdd = () => {
    const nextWord = word.trim();

    if (!nextWord) {
      setInputError(FORM_MESSAGE.channelChat.forbiddenWordRequired);
      return;
    }

    if (nextWord.length > CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH) {
      setInputError(
        FORM_MESSAGE.channelChat.forbiddenWordMax(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH),
      );
      return;
    }

    if (value.length >= CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT) {
      setInputError(
        FORM_MESSAGE.channelChat.forbiddenWordsMax(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT),
      );
      return;
    }

    if (!value.includes(nextWord)) {
      onChange([...value, nextWord]);
    }

    setWord("");
    setInputError(null);
  };

  const handleRemove = (targetWord: string) => {
    onChange(value.filter((item) => item !== targetWord));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "border-border bg-muted/40 overflow-hidden rounded-xl border",
          "focus-within:border-brand/50 focus-within:ring-brand/20 transition-colors focus-within:ring-3",
        )}
      >
        <div className="flex items-center gap-4 py-1.5 pr-1.5 pl-3.5">
          <Input
            value={word}
            disabled={disabled}
            maxLength={CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH}
            onChange={(event) => {
              setWord(event.target.value);
              setInputError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder="금칙어를 입력해주세요."
            className={cn(
              "h-8 min-w-0 flex-1 border-0 px-0 py-0 shadow-none focus-visible:ring-0",
              "bg-transparent disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent",
            )}
          />
          <span className="text-muted-foreground shrink-0 text-xs font-semibold whitespace-nowrap">
            {value.length} / {CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT}
          </span>
          <Button
            type="button"
            disabled={disabled}
            onClick={handleAdd}
            className="bg-brand hover:bg-brand/85 shrink-0 font-bold text-white"
          >
            금칙어 추가
          </Button>
        </div>

        <div className="border-border/60 border-t p-3">
          {value.length > 0 ? (
            <div className="flex flex-wrap content-start gap-2">
              {value.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant="destructive"
                  disabled={disabled}
                  onClick={() => handleRemove(item)}
                  className={cn(
                    "bg-error/10 text-error hover:bg-error inline-flex h-7 items-center gap-1 rounded-full px-3",
                    "text-xs font-bold transition-colors hover:text-white",
                    "disabled:pointer-events-none disabled:opacity-60",
                  )}
                >
                  <span>{item}</span>
                  <X className="size-3" />
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-1.5 text-center text-xs">
              아직 등록한 금칙어가 없어요.
            </p>
          )}
        </div>
      </div>
      <FieldError errors={[inputError ? { message: inputError } : undefined, { message: error }]} />
      <HintNote>등록된 단어가 포함된 메시지는 방송 채팅에서 자동으로 가려져요.</HintNote>
    </div>
  );
}
