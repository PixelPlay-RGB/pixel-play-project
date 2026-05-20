// Supabase auth provider 목록 판정을 관리합니다.

export function getAuthProviders(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((provider): provider is string => typeof provider === "string");
}

export function hasEmailProvider(value: unknown): boolean {
  return getAuthProviders(value).includes("email");
}
