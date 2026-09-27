import { create } from "zustand";

type UiState = Record<string, never>;

export const useUiStore = create<UiState>()(() => ({}));
