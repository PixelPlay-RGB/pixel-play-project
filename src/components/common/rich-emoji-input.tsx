"use client";
// 이모지를 인라인 이미지로 보여주는 contentEditable 입력기(라이브 채팅·커뮤니티 글/댓글 공용).
// 값은 평문(스티커는 :pp-<id>: 토큰)으로 주고받고, DOM은 우리가 명령형으로 관리한다 — React가
// children을 렌더하면 한글 IME 조합 중 DOM이 갈려 조합이 깨지므로, 외부 value 변경(초기값·피커
// 삽입·전송 후 초기화)만 DOM에 반영하고 타이핑은 브라우저에 맡긴 뒤 읽어서 onChange로 흘린다.

import { useEffect, useRef } from "react";

import { STICKER_PX } from "@/constants/sticker/sticker";
import { cn } from "@/lib/utils";
import { buildStickerToken, splitStickerSegments } from "@/utils/sticker/sticker-token";
import type { Sticker } from "@/types/sticker/sticker";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  // Enter로 전송할지(채팅·댓글). false면 Enter가 줄바꿈(게시글).
  submitOnEnter?: boolean;
  // 줄바꿈 허용(게시글·댓글의 Shift+Enter). 채팅은 false(한 줄, Enter=전송만).
  allowNewline?: boolean;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  // 게이트 상태(비로그인·규칙 미동의 등) — 편집 불가지만 onClick은 받는다.
  readOnly?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  // 기본 스티커 외 맥락별 스티커(채널 채팅의 채널 이모지) — 피커로 삽입한 토큰을 입력창에서도 이미지로 그린다.
  extraStickers?: Sticker[];
}

function makeStickerImage(sticker: Sticker): HTMLImageElement {
  const img = document.createElement("img");
  img.src = sticker.src;
  img.alt = sticker.label;
  img.dataset.token = buildStickerToken(sticker.id);
  img.width = STICKER_PX.inline;
  img.height = STICKER_PX.inline;
  img.draggable = false;
  // contentEditable=false: 캐럿이 안으로 못 들어가고 backspace에 통째로 지워진다(원자 단위).
  img.contentEditable = "false";
  img.className = "inline-block max-w-none object-contain align-middle select-none";
  img.style.width = `${STICKER_PX.inline}px`;
  img.style.height = `${STICKER_PX.inline}px`;
  return img;
}

function valueToNodes(value: string, extraStickers?: Sticker[]): Node[] {
  return splitStickerSegments(value, extraStickers).map((segment) =>
    segment.type === "sticker"
      ? makeStickerImage(segment.sticker)
      : document.createTextNode(segment.value),
  );
}

// DOM → 평문 값. text는 그대로, 스티커 img는 토큰으로, 빈 editable의 filler <br>은 무시한다.
function readValue(root: HTMLElement): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent ?? "";
    else if (node instanceof HTMLImageElement) out += node.dataset.token ?? "";
    else if (node instanceof HTMLBRElement)
      return; // filler <br>은 값에 넣지 않는다(개행은 \n 텍스트로 관리).
    else node.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk);
  return out;
}

function placeCaretAtEnd(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertTextAtCaret(root: HTMLElement, text: string) {
  const selection = window.getSelection();
  const node = document.createTextNode(text);
  if (!selection || !selection.rangeCount || !root.contains(selection.anchorNode)) {
    root.appendChild(node);
  } else {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export default function RichEmojiInput({
  value,
  onChange,
  onSubmit,
  submitOnEnter = false,
  allowNewline = true,
  placeholder,
  maxLength,
  disabled = false,
  readOnly = false,
  onClick,
  className,
  ariaLabel,
  extraStickers,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  // 우리가 마지막으로 onChange로 내보낸 값 — 외부 변경과 자가 변경을 구분해 타이핑 중 DOM 재작성을 막는다.
  const lastEmittedRef = useRef<string | null>(null);

  const editable = !disabled && !readOnly;

  // 외부 value 변경(초기값·피커 삽입·전송 후 초기화)만 DOM에 반영한다.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (value === lastEmittedRef.current) return;
    root.replaceChildren(...valueToNodes(value, extraStickers));
    lastEmittedRef.current = value;
    if (document.activeElement === root) placeCaretAtEnd(root);
  }, [value, extraStickers]);

  // maxLength 강제(삽입만 차단, 삭제·IME 조합은 허용) — contentEditable엔 네이티브 maxLength가 없다.
  useEffect(() => {
    const root = ref.current;
    if (!root || !maxLength) return;
    const onBeforeInput = (event: Event) => {
      const inputType = (event as InputEvent).inputType ?? "";
      if (inputType === "insertCompositionText") return; // 조합은 막지 않는다(IME 깨짐 방지).
      if (!inputType.startsWith("insert")) return;
      if (readValue(root).length >= maxLength) event.preventDefault();
    };
    root.addEventListener("beforeinput", onBeforeInput);
    return () => root.removeEventListener("beforeinput", onBeforeInput);
  }, [maxLength]);

  function emit() {
    const root = ref.current;
    if (!root) return;
    const next = readValue(root);
    // 전부 지우면 filler <br>이 남아 :empty가 안 먹으므로 비운다(.is-empty는 value로 토글).
    if (next === "" && root.childNodes.length > 0) root.replaceChildren();
    lastEmittedRef.current = next;
    onChange(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!editable) {
      // 게이트 상태: 키보드 사용자도 클릭과 동일하게 안내(로그인·규칙)를 열 수 있게 한다.
      if (onClick && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onClick();
      }
      return;
    }
    if (event.key !== "Enter") return;
    if (composingRef.current || event.nativeEvent.isComposing) return; // IME 조합 확정용 Enter는 흘려보낸다.
    if (submitOnEnter && !event.shiftKey) {
      event.preventDefault();
      onSubmit?.();
      return;
    }
    if (!allowNewline) {
      event.preventDefault();
      return;
    }
    // 줄바꿈은 우리가 직접 \n으로 넣는다(브라우저의 <div>/<br> 삽입을 막아 값 모델을 단순화).
    const root = ref.current;
    if (!root) return;
    event.preventDefault();
    insertTextAtCaret(root, "\n");
    emit();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    // 서식 없는 평문만 붙여넣는다(블록 엘리먼트 유입 차단). 한 줄 입력은 개행을 공백으로 바꾼다.
    event.preventDefault();
    const root = ref.current;
    if (!root) return;
    const text = event.clipboardData.getData("text/plain");
    if (!text) return;
    insertTextAtCaret(root, allowNewline ? text : text.replace(/\s*\n\s*/g, " "));
    emit();
  }

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline={allowNewline}
      aria-readonly={!editable}
      tabIndex={editable ? undefined : onClick && !disabled ? 0 : -1}
      contentEditable={editable}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      spellCheck={false}
      onInput={() => {
        if (composingRef.current) return;
        emit();
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
        emit();
      }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onClick={onClick}
      className={cn(
        "rich-emoji-input outline-none",
        value === "" && "is-empty",
        allowNewline ? "wrap-break-word whitespace-pre-wrap" : "overflow-x-auto whitespace-nowrap",
        className,
      )}
    />
  );
}
