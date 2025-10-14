import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, Paperclip, X, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { callAI } from "@/lib/ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
}

interface Employee {
  id: string;
  name: string;
  expertise: string;
  avatar_url: string | null;
}

const Employee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEmployee();
    fetchOrCreateConversation();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employee",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrCreateConversation = async () => {
    try {
      let { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("employee_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (conversations && conversations.length > 0) {
        setConversationId(conversations[0].id);
        await fetchMessages(conversations[0].id);
      } else {
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({ employee_id: id })
          .select()
          .single();

        if (createError) throw createError;
        setConversationId(newConv.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const { data: attachments } = await supabase
        .from("conversation_attachments")
        .select("*")
        .eq("conversation_id", convId);

      const messagesWithAttachments = (data || []).map(msg => ({
        ...msg,
        attachments: attachments?.filter(att => 
          // Group attachments by created_at timestamp proximity (within same second)
          Math.abs(new Date(msg.created_at).getTime() - new Date(att.created_at).getTime()) < 5000
        ) || []
      })) as Message[];

      setMessages(messagesWithAttachments);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch messages",
        variant: "destructive",
      });
    }
  };

  const uploadFiles = async (files: File[]): Promise<FileAttachment[]> => {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const uploadedFiles: FileAttachment[] = [];
    
    for (const file of files) {
      const filePath = `${userId}/${conversationId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('conversation_files')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "File upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      uploadedFiles.push({
        id: crypto.randomUUID(),
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        content_type: file.type,
      });
    }

    return uploadedFiles;
  };

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;
    if (!conversationId || !employee) return;

    const userMessage = input.trim() || "(File attachment)";
    setInput("");
    setSending(true);
    setUploadingFiles(true);

    try {
      // Upload files first if any
      let uploadedFiles: FileAttachment[] = [];
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadFiles(selectedFiles);
        setSelectedFiles([]);
      }
      setUploadingFiles(false);

      // Insert user message
      const { error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content: userMessage,
        });

      if (userMsgError) throw userMsgError;

      // Save file attachments
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;

      if (uploadedFiles.length > 0 && userId) {
        await supabase.from("conversation_attachments").insert(
          uploadedFiles.map(file => ({
            conversation_id: conversationId,
            file_name: file.file_name,
            file_path: file.file_path,
            file_size: file.file_size,
            content_type: file.content_type,
            uploaded_by: userId,
          }))
        );
      }

      setMessages((prev) => [
        ...prev,
        { 
          id: crypto.randomUUID(), 
          role: "user", 
          content: userMessage, 
          created_at: new Date().toISOString(),
          attachments: uploadedFiles 
        },
      ]);

      const memory = await supabase
        .from("employee_memory")
        .select("factlet")
        .eq("employee_id", id)
        .order("importance_score", { ascending: false })
        .limit(8);

      let fileContext = "";
      if (uploadedFiles.length > 0) {
        fileContext = `\n\n[User attached ${uploadedFiles.length} file(s): ${uploadedFiles.map(f => 
          `${f.file_name} (${(f.file_size / 1024).toFixed(2)} KB)`
        ).join(', ')}]\n\nAcknowledge these files and note that you can refer to them in future conversations.`;
      }

      const chatMessages = [...messages, { role: "user", content: userMessage + fileContext }].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // read aiProvider from user metadata
      const aiProvider = ((session.data.session?.user?.user_metadata as any)?.aiProvider as string) || "gemini";
      const accessToken = session.data.session?.access_token || null;
      const response = await callAI({ provider: aiProvider as any, messages: chatMessages as any, expertise: employee.expertise, memory: memory.data || [], authToken: accessToken });
      if (!response.ok) throw new Error("Failed to get AI response");

      const contentType = response.headers.get("content-type") || "";
      let assistantContent = "";
      let textBuffer = "";

      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", created_at: new Date().toISOString() },
      ]);

      if (contentType.includes("application/json")) {
        const json = await response.json();
        assistantContent = json.content || "";
        setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: assistantContent } : m)));
      } else if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).replace(/^data:\s*/, "").trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              let content = parsed.choices?.[0]?.delta?.content;
              if (!content && parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                content = parsed.candidates[0].content.parts[0].text;
              }
              if (content) {
                assistantContent += content;
                setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: assistantContent } : m)));
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantContent,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setUploadingFiles(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img
          src={employee.avatar_url || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(employee.name)}&radius=50`}
          alt={`${employee.name} avatar`}
          className="h-10 w-10 rounded-full border object-cover"
        />
        <div>
          <h1 className="font-bold text-lg">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">{employee.expertise}</p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Start a conversation with {employee.name}</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
               <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
                    {msg.attachments.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 text-sm opacity-80">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{file.file_name}</span>
                        <span className="text-xs">({(file.file_size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          {selectedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploadingFiles || selectedFiles.length >= 5}
              title="Attach files (max 5)"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending || uploadingFiles}
            />
            <Button onClick={handleSend} disabled={sending || uploadingFiles || (!input.trim() && selectedFiles.length === 0)}>
              {sending || uploadingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employee;