// 채팅 금칙어 추가와 삭제 필드를 렌더링합니다.

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT,
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH,
} from "@/constants/channel/chat";
import { FORM_MESSAGE } from "@/constants/common/form-message";
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
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-bold">금칙어</h3>
        <p className="text-muted-foreground text-xs leading-5">
          등록된 단어가 포함된 채팅은 자동으로 가려져요.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
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
        />
        <Button type="button" disabled={disabled} onClick={handleAdd} className="sm:w-24">
          추가
        </Button>
      </div>
      <div className="text-muted-foreground flex justify-between gap-3 text-xs">
        <span>한 단어씩 입력하고 추가해주세요.</span>
        <span className="shrink-0">
          {value.length} / {CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT}
        </span>
      </div>
      <FieldError errors={[inputError ? { message: inputError } : undefined, { message: error }]} />
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => handleRemove(item)}
              className="bg-brand/10 text-brand hover:bg-brand hover:text-brand-foreground inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold transition-colors disabled:pointer-events-none disabled:opacity-60"
            >
              <span>{item}</span>
              <X className="size-3" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
          아직 등록한 금칙어가 없어요.
        </p>
      )}
    </div>
  );
}
