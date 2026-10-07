"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useRoomStore, type ChatMessage } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

export function RoomChat() {
  const [input, setInput] = useState("");
  const { messages, addMessage } = useRoomStore();
  const { user } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user) return;

    // TODO: emit via socket — for now add locally
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    addMessage(msg);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm">Room Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hi!
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.userId === user?.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="px-3 py-3 border-t border-border shrink-0 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          className="flex-1 h-8 text-sm"
          maxLength={500}
        />
        <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
      <UserAvatar
        src={message.avatarUrl}
        username={message.username}
        displayName={message.displayName}
        size="sm"
        className="shrink-0 mt-0.5"
      />
      <div className={cn("max-w-[75%] space-y-0.5", isOwn && "items-end flex flex-col")}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium">{message.displayName}</span>
          <span className="text-[10px] text-muted-foreground">
            {timeAgo(message.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            "px-3 py-1.5 rounded-2xl text-sm leading-relaxed",
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}