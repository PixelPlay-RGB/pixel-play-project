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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown, Link2, Save, ShieldCheck, Timer, UserCheck, Users, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

interface Props {
  initialSnapshot?: ChannelLiveStudioSnapshot;
}

interface TimeOption {
  label: string;
  value: number;
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

const SLOW_MODE_TIME_OPTIONS = SLOW_MODE_OPTIONS.map((seconds) => ({
  label: formatSecondsLabel(seconds),
  value: seconds,
}));

function getInitialSettings(snapshot?: ChannelLiveStudioSnapshot): ChannelLiveStudioSettings {
  return snapshot?.settings ?? CHANNEL_STUDIO_SETTINGS_FALLBACK;
}

function findOptionLabel(options: TimeOption[], value: number) {
  return options.find((option) => option.value === value)?.label ?? formatSecondsLabel(value);
}

function TimeSelectMenu({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  options: TimeOption[];
  value: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            className="h-9 min-w-40 justify-between px-3"
          >
            <span className="truncate text-sm font-semibold">
              {findOptionLabel(options, value)}
            </span>
            <ChevronDown className="size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent align="start" sideOffset={6} className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={String(value)}
            onValueChange={(next) => onChange(Number(next))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={String(option.value)}
                closeOnClick
                className="py-2"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="border-border grid gap-3 border-b pb-4 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
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

      <Card className="mx-auto w-full max-w-7xl">
        <CardHeader>
          <CardTitle>채팅 운영 설정</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SettingSection title="채팅권한">
            <div className="grid gap-2 lg:grid-cols-3">
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
                        <span className="text-muted-foreground text-xs">{option.description}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {chatScope === "follower" && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">팔로워 채팅 대기시간</span>
                <TimeSelectMenu
                  label="팔로워 채팅 대기시간"
                  options={FOLLOWER_WAIT_OPTIONS}
                  value={followerWaitSeconds}
                  onChange={setFollowerWaitSeconds}
                />
              </div>
            )}
          </SettingSection>

          <SettingSection title="저속모드">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <ChannelSettingToggle
                checked={slowModeEnabled}
                description="시청자 채팅 입력 간격을 제한합니다."
                icon={Timer}
                label="사용 여부"
                onChange={setSlowModeEnabled}
              />
              <div className="flex items-center justify-between gap-2 lg:justify-end">
                <span className="text-muted-foreground text-sm">입력 간격</span>
                <TimeSelectMenu
                  label="저속모드 시간"
                  options={SLOW_MODE_TIME_OPTIONS}
                  value={slowModeSeconds}
                  onChange={setSlowModeSeconds}
                />
              </div>
            </div>
          </SettingSection>

          <SettingSection title="링크차단">
            <ChannelSettingToggle
              checked={linkBlocked}
              description="채팅에서 URL 공유를 차단합니다."
              icon={Link2}
              label="사용 여부"
              onChange={setLinkBlocked}
            />
          </SettingSection>

          <SettingSection title="금지어">
            <Label htmlFor="channel-chat-forbidden-word" className="sr-only">
              금지어
            </Label>
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
          </SettingSection>

          <SettingSection title="채팅규칙">
            <Label htmlFor="channel-chat-rule" className="sr-only">
              채팅규칙
            </Label>
            <Textarea
              id="channel-chat-rule"
              className="min-h-36"
              value={chatRuleText}
              maxLength={300}
              onChange={(event) => setChatRuleText(event.target.value)}
              placeholder="시청자가 채팅 전에 확인할 안내를 입력하세요."
            />
            <span className="text-muted-foreground text-xs">{chatRuleText.length} / 300</span>
          </SettingSection>
        </CardContent>
      </Card>

      <div className="mx-auto flex w-full max-w-7xl justify-end">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          <Save className="size-4" />
          설정 저장
        </Button>
      </div>
    </div>
  );
}
