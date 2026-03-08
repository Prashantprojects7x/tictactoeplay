import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Player } from "./types";

export type MultiplayerState = {
  roomCode: string | null;
  myRole: "X" | "O" | null;
  opponentJoined: boolean;
  isHost: boolean;
  connected: boolean;
};

type BroadcastPayload =
  | { type: "move"; index: number; player: "X" | "O"; board: Player[] }
  | { type: "join"; role: "O" }
  | { type: "reset" }
  | { type: "leave" };

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useMultiplayer() {
  const [state, setState] = useState<MultiplayerState>({
    roomCode: null,
    myRole: null,
    opponentJoined: false,
    isHost: false,
    connected: false,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMoveRef = useRef<((index: number, player: "X" | "O", board: Player[]) => void) | null>(null);
  const onResetRef = useRef<(() => void) | null>(null);
  const onOpponentJoinRef = useRef<(() => void) | null>(null);
  const onOpponentLeaveRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "game", payload: { type: "leave" } });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setState({
      roomCode: null,
      myRole: null,
      opponentJoined: false,
      isHost: false,
      connected: false,
    });
  }, []);

  const subscribe = useCallback((code: string, role: "X" | "O", isHost: boolean) => {
    const channel = supabase.channel(`ttt-room-${code}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "game" }, ({ payload }: { payload: BroadcastPayload }) => {
      switch (payload.type) {
        case "move":
          onMoveRef.current?.(payload.index, payload.player, payload.board);
          break;
        case "join":
          setState((s) => ({ ...s, opponentJoined: true }));
          onOpponentJoinRef.current?.();
          break;
        case "reset":
          onResetRef.current?.();
          break;
        case "leave":
          setState((s) => ({ ...s, opponentJoined: false }));
          onOpponentLeaveRef.current?.();
          break;
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setState((s) => ({ ...s, connected: true }));
        // If joining (not host), announce
        if (!isHost) {
          channel.send({
            type: "broadcast",
            event: "game",
            payload: { type: "join", role: "O" },
          });
        }
      }
    });

    channelRef.current = channel;
  }, []);

  const createRoom = useCallback(() => {
    cleanup();
    const code = generateRoomCode();
    setState({
      roomCode: code,
      myRole: "X",
      opponentJoined: false,
      isHost: true,
      connected: false,
    });
    subscribe(code, "X", true);
    return code;
  }, [cleanup, subscribe]);

  const joinRoom = useCallback((code: string) => {
    cleanup();
    const normalized = code.trim().toUpperCase();
    setState({
      roomCode: normalized,
      myRole: "O",
      opponentJoined: true, // host is already there
      isHost: false,
      connected: false,
    });
    subscribe(normalized, "O", false);
    return normalized;
  }, [cleanup, subscribe]);

  const sendMove = useCallback((index: number, player: "X" | "O", board: Player[]) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "game",
      payload: { type: "move", index, player, board },
    });
  }, []);

  const sendReset = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "game",
      payload: { type: "reset" },
    });
  }, []);

  const leaveRoom = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.send({ type: "broadcast", event: "game", payload: { type: "leave" } });
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    state,
    createRoom,
    joinRoom,
    sendMove,
    sendReset,
    leaveRoom,
    onMoveRef,
    onResetRef,
    onOpponentJoinRef,
    onOpponentLeaveRef,
  };
}
