// 채널 보안 설정의 OBS 브라우저 소스 URL 카드를 렌더링합니다.
import { SecurityActionGroup } from "@/components/channel/security/security-action-group";
import { SecurityFieldRow } from "@/components/channel/security/security-field-row";
import { UrlTokenReissueDialog } from "@/components/channel/security/security-reissue-dialog";
import { SecurityTutorialList } from "@/components/channel/security/security-tutorial-list";
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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={cn("size-4", meta.accent === "live" ? "text-live" : "text-brand")} />
          {meta.title}
        </CardTitle>
        <CardDescription>{meta.description}</CardDescription>
        <CardAction className="col-start-1 row-start-3 justify-self-start pt-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0">
          <UrlTokenReissueDialog
            title={meta.title}
            tokenKind={meta.tokenKind}
            disabled={disabled}
            isRotating={isRotating}
            onRotate={onRotate}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
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
