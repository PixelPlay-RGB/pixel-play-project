// 평문 텍스트에서 http(s) URL을 자동 감지해 클릭 가능한 링크로 렌더링한다.
// 개행은 whitespace-pre-wrap(호출부 className)로 보존된다.
import { Fragment } from "react";

import { cn } from "@/lib/utils";

// 캡처 그룹으로 split하면 URL 조각도 결과 배열에 포함된다.
const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g;
const URL_TEST_PATTERN = /^https?:\/\//;

interface Props {
  text: string;
  className?: string;
  linkClassName?: string;
}

export default function LinkifiedText({ text, className, linkClassName }: Props) {
  const parts = text.split(URL_SPLIT_PATTERN);

  return (
    <p className={className}>
      {parts.map((part, index) =>
        URL_TEST_PATTERN.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className={cn("text-brand break-all hover:underline", linkClassName)}
          >
            {part}
          </a>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </p>
  );
}
