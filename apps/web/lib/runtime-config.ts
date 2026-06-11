export type RuntimeProviderMode = "local";

export interface WebmakerRuntimeConfig {
  readonly mode: RuntimeProviderMode;
}

export const getRuntimeProviderLabel = (): string => "Local (Podman preview)";

export const getRuntimeConfig = (): WebmakerRuntimeConfig => ({
  mode: "local",
});
