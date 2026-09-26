import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Menu,
  Send,
  User,
  Bot,
  Trash2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  UploadCloud,
  FileCheck
} from "lucide-react";
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

const FILE_SUGGESTIONS = [
  "📄 Review my document for VLITS admissions",
  "🎯 What branches can I get with this rank card?",
  "💰 Check my fee concession / scholarship eligibility",
  "📋 What other certificates do I need to bring?"
];

// Helper to format file size in human-readable units
const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Hello! I am your AI assistant for **Vignan's Lara Institute of Technology & Science**. Ask me anything about courses, admissions, cutoffs, placements, hostels, or fees! You can also **upload your rank card, marksheet, or fee receipt** for guidance. 🤗",
      sender: "bot"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load chat history from backend
  useEffect(() => {
    if (user) {
      api.getChatHistory()
        .then((data) => {
          if (data && Array.isArray(data)) {
            setHistory(data.map((d) => d.message));
          }
        })
        .catch((err) => {
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

  const processFile = (file) => {
    if (!file) return;

    // Max 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Please select a file under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: reader.result,
        isImage: file.type.startsWith("image/")
      });
      toast.success(`Attached "${file.name}" (${formatBytes(file.size)})`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so the same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (eventOrMessage = null) => {
    const isString = typeof eventOrMessage === "string";
    const userMsg = isString ? eventOrMessage : input.trim();
    const currentAttachment = selectedFile;

    if ((!userMsg && !currentAttachment) || loading) return;

    setInput("");
    setSelectedFile(null);

    const attachmentPayload = currentAttachment
      ? {
          fileName: currentAttachment.name,
          fileType: currentAttachment.type,
          fileSize: currentAttachment.size,
          fileUrl: currentAttachment.dataUrl
        }
      : null;

    const userMessageObj = {
      id: Date.now().toString(),
      text: userMsg || (currentAttachment ? `Uploaded file: ${currentAttachment.name}` : ""),
      sender: "user",
      attachment: attachmentPayload
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setLoading(true);

    try {
      const data = await api.sendMessage(userMsg, undefined, attachmentPayload);
      const reply =
        data?.reply ||
        "I received your request. Please contact the admissions office at +91-863-2381200 for further verification.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: reply,
          sender: "bot"
        }
      ]);

      if (user && userMsg) {
        setHistory((prev) => [userMsg, ...prev.filter((item) => item !== userMsg)]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I am having trouble connecting to the backend server. Please verify your connection or try again shortly.",
          sender: "bot"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex h-screen pt-14 animated-gradient-bg relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-4 border-dashed border-primary rounded-xl m-4 pointer-events-none transition-all">
          <UploadCloud className="w-16 h-16 text-primary animate-bounce mb-3" />
          <p className="text-xl font-bold text-foreground bg-background/80 px-6 py-2 rounded-full shadow-lg">
            Drop your document or image here to attach
          </p>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-background rounded-xl p-2 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white rounded-full p-2 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageModal}
              alt="Attachment preview"
              className="max-h-[80vh] w-auto object-contain rounded-lg mx-auto"
            />
          </div>
        </div>
      )}

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
              <p className="text-sm text-foreground/80 mb-3 font-medium">
                Login to automatically save your chat history and document uploads
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-foreground/20 hover:bg-foreground/5 text-foreground font-bold"
                onClick={() => navigate("/login")}
              >
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
          <span className="text-sm font-bold">{user ? user.username || "Profile" : "Sign In"}</span>
        </button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 glass border-b border-border/40 shadow-sm z-10">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground hover:bg-foreground/5"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full gradient-navy flex items-center justify-center flex-shrink-0 shadow-md">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-xl text-foreground tracking-tight">
              Lara College Assistant
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Admissions, Placements & Document Review Online
            </p>
          </div>
        </div>

        {/* Message Stream */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg overflow-hidden ${
                    msg.sender === "user"
                      ? "gradient-navy text-primary-foreground rounded-br-md border border-white/10"
                      : "glass-card text-foreground rounded-bl-md"
                  }`}
                >
                  {/* Render Attachment if present */}
                  {msg.attachment && (
                    <div className="mb-2.5">
                      {msg.attachment.fileType?.startsWith("image/") || msg.attachment.fileUrl?.startsWith("data:image") ? (
                        <div className="space-y-1.5">
                          <img
                            src={msg.attachment.fileUrl}
                            alt={msg.attachment.fileName || "Uploaded image"}
                            className="max-h-56 max-w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/20 shadow-sm"
                            onClick={() => setPreviewImageModal(msg.attachment.fileUrl)}
                          />
                          <div className="flex items-center gap-1.5 text-xs opacity-90">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px]">{msg.attachment.fileName}</span>
                            {msg.attachment.fileSize && (
                              <span className="text-[11px] opacity-75">
                                ({formatBytes(msg.attachment.fileSize)})
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/15 backdrop-blur-sm">
                          <div className="p-2 rounded-lg bg-white/10 flex-shrink-0">
                            <FileText className="w-5 h-5 text-sky-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs truncate">{msg.attachment.fileName}</p>
                            <p className="text-[10px] opacity-80">
                              {msg.attachment.fileSize ? formatBytes(msg.attachment.fileSize) : "Document"}
                            </p>
                          </div>
                          {msg.attachment.fileUrl && (
                            <a
                              href={msg.attachment.fileUrl}
                              download={msg.attachment.fileName || "document"}
                              className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  {msg.sender === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:text-white">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
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
                  Analyzing query & document...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Input Bar with File Upload */}
        <div className="border-t border-border/40 glass p-3 z-10">
          <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
            {/* Suggested Questions / File Prompts */}
            {selectedFile ? (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                {FILE_SUGGESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className="whitespace-nowrap px-3.5 py-1.5 text-xs font-medium rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 shadow-sm snap-start transition-all flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    {q}
                  </button>
                ))}
              </div>
            ) : (
              messages.length <= 2 && (
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
              )
            )}

            {/* Attached File Preview Card */}
            {selectedFile && (
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-primary/10 border border-primary/30 text-foreground text-sm animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedFile.isImage ? (
                    <img
                      src={selectedFile.dataUrl}
                      alt="Thumbnail"
                      className="w-9 h-9 object-cover rounded-md border border-primary/20"
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-primary/20 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate max-w-[220px] md:max-w-md">{selectedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="p-1 hover:bg-foreground/10 text-muted-foreground hover:text-destructive rounded-full transition-colors"
                  title="Remove attached file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {/* Input & Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                title="Attach Rank Card, Marksheet, Fee Receipt, or Document (PDF, Images, DOC, TXT)"
                className="h-12 w-12 rounded-xl border-foreground/20 hover:bg-foreground/10 hover:border-primary text-foreground/80 hover:text-primary transition-all flex-shrink-0 relative group"
              >
                <Paperclip className="w-5 h-5 transition-transform group-hover:rotate-45" />
                {selectedFile && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background"></span>
                )}
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  selectedFile
                    ? "Add a message with this file or click send..."
                    : "Ask a question or attach a document / rank card..."
                }
                className="flex-1 bg-background/60 border-foreground/20 text-foreground text-base h-12 rounded-xl focus-visible:ring-primary shadow-inner px-4"
                disabled={loading}
              />

              <Button
                size="icon"
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !selectedFile)}
                className="h-12 w-12 rounded-xl gradient-navy text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex-shrink-0"
              >
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