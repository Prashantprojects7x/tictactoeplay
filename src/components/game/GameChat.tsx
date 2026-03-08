import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Smile } from "lucide-react";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "opponent";
  timestamp: number;
  isEmoji?: boolean;
}

const QUICK_EMOJIS = ["👋", "😂", "🔥", "💀", "😎", "🤔", "😤", "🎉", "💪", "😭", "👏", "⚡"];

interface GameChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  myRole: "X" | "O" | null;
}

export default function GameChat({ messages, onSend, myRole }: GameChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!open && messages.length > prevCountRef.current) {
      const newMsgs = messages.slice(prevCountRef.current);
      const opponentMsgs = newMsgs.filter((m) => m.sender === "opponent");
      if (opponentMsgs.length > 0) setUnread((u) => u + opponentMsgs.length);
    }
    prevCountRef.current = messages.length;
  }, [messages.length, open]);

  // Clear unread when opening
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, open]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
    setShowEmojis(false);
  };

  const handleEmojiSend = (emoji: string) => {
    onSend(emoji);
    setShowEmojis(false);
  };

  return (
    <>
      {/* Floating emoji reactions from opponent */}
      <AnimatePresence>
        {messages
          .filter((m) => m.sender === "opponent" && m.isEmoji && Date.now() - m.timestamp < 3000)
          .slice(-3)
          .map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1.2, y: -30 }}
              exit={{ opacity: 0, y: -60, scale: 0.8 }}
              transition={{ duration: 1.5 }}
              className="fixed top-20 right-20 text-4xl pointer-events-none z-50"
            >
              {m.text}
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Chat toggle button */}
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:brightness-110 active:scale-95 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MessageCircle className="w-5 h-5" />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
            >
              {unread}
            </motion.span>
          )}
        </motion.button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-40 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "400px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold">Game Chat</span>
                <span className="text-[9px] text-muted-foreground">({myRole})</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[180px] max-h-[260px]">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-[10px] mt-8">
                  Send a message or emoji! 🎮
                </p>
              )}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.sender === "me" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-xl px-3 py-1.5 text-xs
                      ${msg.isEmoji ? "text-2xl bg-transparent px-1" : ""}
                      ${msg.sender === "me"
                        ? "bg-primary/20 text-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                      }
                    `}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border/30 overflow-hidden"
                >
                  <div className="grid grid-cols-6 gap-1 p-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSend(emoji)}
                        className="text-lg hover:bg-secondary rounded-lg p-1 transition-colors active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50">
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className={`text-muted-foreground hover:text-foreground transition-colors ${showEmojis ? "text-primary" : ""}`}
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 100))}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                maxLength={100}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="text-primary hover:brightness-110 transition-all disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
