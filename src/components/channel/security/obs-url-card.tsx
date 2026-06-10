// 채널 보안 설정의 OBS 브라우저 소스 URL 카드를 렌더링합니다.
import { SecurityActionGroup } from "@/components/channel/security/security-action-group";
import { SecurityFieldRow } from "@/components/channel/security/security-field-row";
import { SecurityTutorialList } from "@/components/channel/security/security-tutorial-list";
import { UrlTokenReissueDialog } from "@/components/channel/security/url-token-reissue-dialog";
import { TutorialDialog } from "@/components/common/tutorial-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ChannelSecuritySnapshot,
  ChannelSecurityTokenKind,
  ChannelSecurityUrlCardMeta,
} from "@/types/channel/security";
import { maskSensitiveValue } from "@/utils/channel/channel-security-format";

export function ObsUrlCard({
  meta,
  snapshot,
  disabled,
  isRotating,
  isUrlVisible,
  onCopy,
  onPreview,
  onToggleVisible,
  onRotate,
}: {
  meta: ChannelSecurityUrlCardMeta;
  snapshot: ChannelSecuritySnapshot;
  disabled: boolean;
  isRotating: boolean;
  isUrlVisible: boolean;
  onCopy: (value: string) => Promise<void>;
  onPreview: (url: string) => void;
  onToggleVisible: (tokenKind: ChannelSecurityTokenKind) => void;
  onRotate: (tokenKind: ChannelSecurityTokenKind, onSuccess?: () => void) => void;
}) {
  const Icon = meta.icon;
  const url =
    meta.tokenKind === "chat_overlay" ? snapshot.chatOverlayUrl : snapshot.donationAlertUrl;

  return (
    <Card className="gap-5 shadow-sm">
      <CardHeader className="gap-2 px-5 sm:px-6">
        <CardTitle className="flex items-center gap-2 leading-none">
          <Icon
            className={cn(
              "size-4 translate-y-px",
              meta.accent === "live" ? "text-live" : "text-brand",
            )}
          />
          {meta.title}
          {meta.tutorial && (
            <TutorialDialog
              title={meta.tutorial.title}
              steps={meta.tutorial.steps}
              triggerLabel={`${meta.title} 연결 가이드 보기`}
            />
          )}
        </CardTitle>
        <CardDescription className="max-w-xl leading-6 text-pretty">
          {meta.description}
        </CardDescription>
        <CardAction className="col-start-1 row-start-3 justify-self-start pt-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0">
          <UrlTokenReissueDialog
            title={meta.title}
            icon={meta.icon}
            tokenKind={meta.tokenKind}
            disabled={disabled}
            isRotating={isRotating}
            onRotate={onRotate}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="px-5 sm:px-6">
        <SecurityFieldRow
          label={meta.label}
          value={isUrlVisible ? url : maskSensitiveValue(url)}
          action={
            <SecurityActionGroup
              tokenKind={meta.tokenKind}
              isVisible={isUrlVisible}
              disabled={disabled}
              onToggleVisible={onToggleVisible}
              onCopy={() => onCopy(url)}
              onPreview={() => onPreview(url)}
            />
          }
        />
        <SecurityTutorialList items={meta.tutorialItems} />
      </CardContent>
    </Card>
  );
}
