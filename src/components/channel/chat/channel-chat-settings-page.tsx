"use client";
// 크리에이터의 라이브 채팅 정책을 관리하는 채널 설정 페이지입니다.

import {
  updateChannelLiveSettingsAction,
  type ChannelLiveStudioSettings,
  type ChannelLiveStudioSnapshot,
} from "@/actions/channel/live";
import ChannelSettingToggle from "@/components/channel/channel-setting-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CHANNEL_STUDIO_SETTINGS_FALLBACK,
  createStudioSettingsInput,
  FOLLOWER_WAIT_OPTIONS,
  formatSecondsLabel,
  SLOW_MODE_OPTIONS,
} from "@/utils/channel/channel-studio-setting";
import { Link2, Save, ShieldCheck, Timer, UserCheck, Users, X } from "lucide-react";
import { useState, useTransition } from "react";

interface Props {
  initialSnapshot?: ChannelLiveStudioSnapshot;
}

const DEFAULT_FOLLOWER_WAIT_SECONDS = 300;

const CHAT_SCOPE_OPTIONS: Array<{
  description: string;
  icon: typeof Users;
  label: string;
  value: ChannelLiveStudioSettings["chatScope"];
}> = [
  {
    description: "로그인한 시청자가 채팅할 수 있습니다.",
    icon: Users,
    label: "모든 사람",
    value: "authenticated",
  },
  {
    description: "팔로우 조건을 만족한 시청자만 채팅합니다.",
    icon: UserCheck,
    label: "팔로워 전용",
    value: "follower",
  },
  {
    description: "운영 권한이 있는 사용자만 채팅합니다.",
    icon: ShieldCheck,
    label: "운영자 전용",
    value: "manager",
  },
];

function getInitialSettings(snapshot?: ChannelLiveStudioSnapshot): ChannelLiveStudioSettings {
  return snapshot?.settings ?? CHANNEL_STUDIO_SETTINGS_FALLBACK;
}

export default function ChannelChatSettingsPage({ initialSnapshot }: Props) {
  const initialSettings = getInitialSettings(initialSnapshot);
  const [settings, setSettings] = useState(initialSettings);
  const [chatScope, setChatScope] = useState(initialSettings.chatScope);
  const [followerWaitSeconds, setFollowerWaitSeconds] = useState(
    initialSettings.followerWaitSeconds || DEFAULT_FOLLOWER_WAIT_SECONDS,
  );
  const [slowModeEnabled, setSlowModeEnabled] = useState(initialSettings.slowModeEnabled);
  const [slowModeSeconds, setSlowModeSeconds] = useState(initialSettings.slowModeSeconds);
  const [linkBlocked, setLinkBlocked] = useState(initialSettings.linkBlocked);
  const [forbiddenWords, setForbiddenWords] = useState(initialSettings.forbiddenWords);
  const [forbiddenWordInput, setForbiddenWordInput] = useState("");
  const [chatRuleText, setChatRuleText] = useState(initialSettings.chatRuleText);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChatScopeChange = (nextChatScope: ChannelLiveStudioSettings["chatScope"]) => {
    setChatScope(nextChatScope);

    if (nextChatScope === "follower" && followerWaitSeconds === 0) {
      setFollowerWaitSeconds(DEFAULT_FOLLOWER_WAIT_SECONDS);
    }
  };

  const handleAddForbiddenWord = () => {
    const nextWord = forbiddenWordInput.trim();

    if (!nextWord || forbiddenWords.includes(nextWord) || forbiddenWords.length >= 100) return;

    setForbiddenWords((currentWords) => [...currentWords, nextWord]);
    setForbiddenWordInput("");
  };

  const handleRemoveForbiddenWord = (word: string) => {
    setForbiddenWords((currentWords) => currentWords.filter((currentWord) => currentWord !== word));
  };

  const handleSave = () => {
    setActionMessage(null);
    startTransition(async () => {
      const result = await updateChannelLiveSettingsAction(
        createStudioSettingsInput(settings, {
          chatRuleText,
          chatScope,
          forbiddenWords,
          followerWaitSeconds,
          linkBlocked,
          slowModeEnabled,
          slowModeSeconds,
        }),
      );

      if (!result.success || !result.data) {
        setActionMessage("채팅 설정을 저장하지 못했습니다.");
        return;
      }

      setSettings(result.data.settings);
      setActionMessage("채팅 설정을 저장했습니다.");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">채팅 설정</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          라이브 채팅 권한, 보호 정책, 채팅 규칙을 설정합니다.
        </p>
      </div>

      {actionMessage && (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-xs font-semibold",
            actionMessage.includes("못했습니다")
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-brand/20 bg-brand/10 text-brand",
          )}
        >
          {actionMessage}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>채팅 접근</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label>채팅 권한</Label>
              <div className="grid gap-2 md:grid-cols-3">
                {CHAT_SCOPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = chatScope === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "border-border relative min-h-24 overflow-hidden rounded-lg border p-3 text-left transition-all duration-200",
                        selected
                          ? "border-brand bg-brand/10 ring-brand/20 shadow-sm ring-2"
                          : "hover:bg-muted/50",
                      )}
                      aria-pressed={selected}
                      onClick={() => handleChatScopeChange(option.value)}
                    >
                      <span
                        className={cn(
                          "absolute inset-x-3 top-0 h-1 rounded-b-full transition-transform duration-200",
                          selected ? "bg-brand translate-y-0" : "-translate-y-1 bg-transparent",
                        )}
                      />
                      <span className="flex items-start gap-2">
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                            selected ? "bg-brand text-white" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="grid gap-1">
                          <strong className="text-sm">{option.label}</strong>
                          <span className="text-muted-foreground text-xs">
                            {option.description}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {chatScope === "follower" && (
              <div className="grid gap-2">
                <Label>팔로워 채팅 대기시간</Label>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {FOLLOWER_WAIT_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={followerWaitSeconds === option.value ? "default" : "outline"}
                      onClick={() => setFollowerWaitSeconds(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <ChannelSettingToggle
              checked={slowModeEnabled}
              description="시청자 채팅 입력 간격을 제한합니다."
              icon={Timer}
              label="저속모드"
              onChange={setSlowModeEnabled}
            />
            <div className="grid gap-2">
              <Label>저속모드 시간</Label>
              <div className="flex flex-wrap gap-1">
                {SLOW_MODE_OPTIONS.map((seconds) => (
                  <Button
                    key={seconds}
                    type="button"
                    size="sm"
                    variant={slowModeSeconds === seconds ? "default" : "outline"}
                    onClick={() => setSlowModeSeconds(seconds)}
                  >
                    {formatSecondsLabel(seconds)}
                  </Button>
                ))}
              </div>
            </div>
            <ChannelSettingToggle
              checked={linkBlocked}
              description="채팅에서 URL 공유를 차단합니다."
              icon={Link2}
              label="링크 차단"
              onChange={setLinkBlocked}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>금지어와 규칙</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="channel-chat-forbidden-word">금지어</Label>
              <div className="flex gap-2">
                <Input
                  id="channel-chat-forbidden-word"
                  value={forbiddenWordInput}
                  maxLength={30}
                  onChange={(event) => setForbiddenWordInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddForbiddenWord();
                    }
                  }}
                  placeholder="금지어를 입력하세요."
                />
                <Button type="button" variant="outline" onClick={handleAddForbiddenWord}>
                  추가
                </Button>
              </div>
              <div className="border-border flex min-h-16 flex-wrap items-center gap-2 rounded-lg border p-2">
                {forbiddenWords.length ? (
                  forbiddenWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                      onClick={() => handleRemoveForbiddenWord(word)}
                    >
                      {word}
                      <X className="size-3" />
                    </button>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">등록된 금지어가 없습니다.</span>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="channel-chat-rule">채팅 규칙</Label>
              <Textarea
                id="channel-chat-rule"
                className="min-h-36"
                value={chatRuleText}
                maxLength={300}
                onChange={(event) => setChatRuleText(event.target.value)}
                placeholder="시청자가 채팅 전에 확인할 안내를 입력하세요."
              />
              <span className="text-muted-foreground text-xs">{chatRuleText.length} / 300</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          <Save className="size-4" />
          설정 저장
        </Button>
      </div>
    </div>
  );
}
