import { create } from "zustand";

export type Platform = "youtube" | "drive" | "spotify" | "web";

export interface RoomMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isMuted: boolean;
  isLeader: boolean;
}

export interface VideoState {
  url: string;
  platform: Platform;
  isPlaying: boolean;
  position: number;
  lastEventAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
}

interface RoomStore {
  roomId: string | null;
  members: RoomMember[];
  videoState: VideoState | null;
  messages: ChatMessage[];
  micEnabled: boolean;
  myMicOn: boolean;
  setRoom: (roomId: string) => void;
  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  setVideoState: (state: VideoState) => void;
  addMessage: (message: ChatMessage) => void;
  setMicEnabled: (enabled: boolean) => void;
  toggleMyMic: () => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  members: [],
  videoState: null,
  messages: [],
  micEnabled: false,
  myMicOn: false,
  setRoom: (roomId) => set({ roomId }),
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((s) => ({ members: [...s.members, member] })),
  removeMember: (userId) =>
    set((s) => ({ members: s.members.filter((m) => m.id !== userId) })),
  setVideoState: (videoState) => set({ videoState }),
  addMessage: (message) =>
    set((s) => ({
      messages: [...s.messages.slice(-200), message], // keep last 200
    })),
  setMicEnabled: (micEnabled) => set({ micEnabled }),
  toggleMyMic: () => set((s) => ({ myMicOn: !s.myMicOn })),
  clearRoom: () =>
    set({ roomId: null, members: [], videoState: null, messages: [] }),
}));