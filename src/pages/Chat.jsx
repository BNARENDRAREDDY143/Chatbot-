import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Send, User, Bot, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

const SUGGESTED_QUESTIONS = [
  "What courses are offered?",
  "How are the placements?",
  "Tell me about hostel facilities",
  "What is the fee structure?",
  "Where is the campus located?"
];

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: "welcome", text: "Hello! I am your AI assistant for **Vignan's Lara Institute of Technology & Science**. Ask me anything about courses, admissions, cutoffs, placements, hostels, or fees! 🤗", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const chatEndRef = useRef(null);

  // Load chat history from MongoDB backend
  useEffect(() => {
    if (user) {
      api.getChatHistory().then((data) => {
        if (data && Array.isArray(data)) {
          setHistory(data.map((d) => d.message));
        }
      }).catch((err) => {
        console.error("Failed to fetch chat history:", err);
      });
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClearHistory = async () => {
    try {
      await api.clearChatHistory();
      setHistory([]);
      toast.success("Chat history cleared");
    } catch (err) {
      toast.error("Failed to clear history");
    }
  };

  const sendMessage = async (eventOrMessage = null) => {
    const isString = typeof eventOrMessage === "string";
    const userMsg = isString ? eventOrMessage : input.trim();
    if (!userMsg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), text: userMsg, sender: "user" }]);
    setLoading(true);

    try {
      const data = await api.sendMessage(userMsg);
      const reply = data?.reply || "I couldn't understand that. Please contact the admissions office at +91-863-2381200.";
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: reply, sender: "bot" }]);

      if (user) {
        setHistory((prev) => [userMsg, ...prev.filter(item => item !== userMsg)]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: "Sorry, I am having trouble connecting to the backend server. Please make sure the MongoDB backend is running.", sender: "bot" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen pt-14 animated-gradient-bg">
      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 glass border-r border-border/40 shadow-2xl text-foreground flex flex-col transition-transform z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:w-64`}
      >
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider text-primary">Chat History</h2>
          {user && history.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Clear History"
              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <ScrollArea className="flex-1 p-3">
          {user ? (
            <>
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(h);
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left text-sm p-2 rounded-md mb-1 bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium truncate transition-colors"
                >
                  {h}
                </button>
              ))}
              {history.length === 0 && <p className="text-xs text-foreground/60 font-medium p-2">No history yet</p>}
            </>
          ) : (
            <div className="p-4 text-center mt-4">
              <p className="text-sm text-foreground/80 mb-3 font-medium">Login to automatically save your chat history in MongoDB</p>
              <Button size="sm" variant="outline" className="w-full border-foreground/20 hover:bg-foreground/5 text-foreground font-bold" onClick={() => navigate("/login")}>
                Login
              </Button>
            </div>
          )}
        </ScrollArea>
        <button
          onClick={() => navigate(user ? "/profile" : "/login")}
          className="p-4 border-t border-border/40 flex items-center gap-2 hover:bg-foreground/5 text-foreground transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-sm font-bold">{user ? (user.username || "Profile") : "Sign In"}</span>
        </button>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 glass border-b border-border/40 shadow-sm z-10">
          <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:bg-foreground/5" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full gradient-navy flex items-center justify-center flex-shrink-0 shadow-md">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-xl text-foreground tracking-tight">Lara College Assistant</h1>
            <p className="text-xs text-muted-foreground">Powered by Node.js & MongoDB</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg overflow-hidden ${
                    msg.sender === "user"
                      ? "gradient-navy text-primary-foreground rounded-br-md border border-white/10"
                      : "glass-card text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.sender === "user" ? (
                    msg.text
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:text-white">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass-card text-foreground px-4 py-3 rounded-2xl rounded-bl-md text-sm animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100"></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200"></span>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border/40 glass p-3 z-10">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {messages.length <= 2 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className="whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full bg-background/50 border border-border/40 text-foreground/80 hover:text-foreground hover:bg-foreground/5 shadow-sm snap-start transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your question about courses, fees, placements..."
                className="flex-1 bg-background/60 border-foreground/20 text-foreground text-base py-6 focus-visible:ring-primary shadow-inner"
                disabled={loading}
              />

              <Button size="lg" onClick={() => sendMessage()} disabled={loading || !input.trim()} className="gradient-navy text-primary-foreground px-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;