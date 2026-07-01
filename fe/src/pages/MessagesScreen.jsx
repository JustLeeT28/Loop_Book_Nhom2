import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Parse conversation id để lấy thông tin 2 user và book.
 * Format: conv-{userIdA}-{userIdB}-{bookId}
 */
function parseRoomId(roomId) {
  if (!roomId || !roomId.startsWith("conv-")) return null;
  const parts = roomId.replace("conv-", "").split("-");
  if (parts.length < 2) return null;
  const userId1 = parts[0];
  const userId2 = parts[1];
  const bookId = parts.slice(2).join("-") || null;
  return { userId1, userId2, bookId: bookId === "no-book" ? null : bookId };
}

export default function MessagesScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvIndex, setActiveConvIndex] = useState(-1);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentConv = conversations[activeConvIndex] || null;
  const room = currentConv?.id || "default";

  // ---- Fetch user name từ lb_users ----
  const userNameCache = useRef({});
  const getUserName = useCallback(async (userId) => {
    if (!userId) return "Người dùng";
    if (userNameCache.current[userId]) return userNameCache.current[userId];
    try {
      const { data } = await supabase
        .from("lb_users")
        .select("name, email")
        .eq("id", userId)
        .maybeSingle();
      const name = data?.name || (data?.email ? data.email.split('@')[0] : userId.substring(0, 8));
      userNameCache.current[userId] = name;
      return name;
    } catch {
      return userId.substring(0, 8);
    }
  }, []);

  // ---- Fetch book metadata từ lb_books ----
  const bookCache = useRef({});
  const getBookInfo = useCallback(async (bookId) => {
    if (!bookId || bookId === "no-book") return null;
    if (bookCache.current[bookId]) return bookCache.current[bookId];
    try {
      const { data } = await supabase
        .from("lb_books")
        .select("title, image, price")
        .eq("id", bookId)
        .maybeSingle();
      const info = data ? { bookTitle: data.title, bookImage: data.image, bookPrice: data.price } : null;
      if (info) bookCache.current[bookId] = info;
      return info;
    } catch {
      return null;
    }
  }, []);

  // ---- Load conversations từ Supabase ----
  useEffect(() => {
    if (!userData?.id) return;

    const loadAllConversations = async () => {
      const { data: msgData, error } = await supabase
        .from("lb_messages")
        .select("conversation_id, sender_id, receiver_id, text, book_id, created_at, image_url, message_type")
        .or(`sender_id.eq.${userData.id},receiver_id.eq.${userData.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Failed to load messages from Supabase:", error.message);
        return;
      }

      const convMap = new Map();
      const seenConvIds = new Set();

      for (const msg of msgData || []) {
        if (!seenConvIds.has(msg.conversation_id)) {
          seenConvIds.add(msg.conversation_id);
          const otherId =
            msg.sender_id === userData.id ? msg.receiver_id : msg.sender_id;

          convMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            sellerId: msg.sender_id === userData.id ? msg.receiver_id : msg.sender_id,
            otherUserId: otherId,
            name: otherId?.substring(0, 8) || "Người dùng",
            bookId: msg.book_id || null,
            preview: msg.text || "[Hình ảnh]",
            messages: [],
          });
        }
      }

      const allConvs = Array.from(convMap.values());

      const convsWithMessages = await Promise.all(
        allConvs.map(async (conv) => {
          const otherId = userData.id === conv.sellerId ? conv.otherUserId : conv.sellerId;
          const fetchedName = await getUserName(otherId);
          const fetchedBookInfo = await getBookInfo(conv.bookId);

          const { data: messagesData } = await supabase
            .from("lb_messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });

          const msgs = await Promise.all((messagesData || []).map(async (m) => {
            const senderName = await getUserName(m.sender_id);
            const receiverName = await getUserName(m.receiver_id);
            return {
              room: m.conversation_id,
              from: m.sender_id === userData.id ? "me" : "other",
              text: m.text,
              imageUrl: m.image_url || null,
              messageType: m.message_type || "text",
              time: m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
              senderId: m.sender_id,
              senderName,
              receiverId: m.receiver_id,
              receiverName,
              bookId: m.book_id,
            };
          }));

          return {
            ...conv,
            name: fetchedName || conv.name,
            bookTitle: fetchedBookInfo?.bookTitle || null,
            bookImage: fetchedBookInfo?.bookImage || null,
            bookPrice: fetchedBookInfo?.bookPrice || null,
            messages: msgs,
            preview: msgs.length > 0
              ? (msgs[msgs.length - 1].messageType === "image"
                  ? "[Hình ảnh]"
                  : msgs[msgs.length - 1].text)
              : conv.preview,
          };
        })
      );

      convsWithMessages.sort((a, b) => {
        const aLast = a.messages?.[a.messages.length - 1]?.time || "";
        const bLast = b.messages?.[b.messages.length - 1]?.time || "";
        return bLast.localeCompare(aLast);
      });

      setConversations(convsWithMessages);
    };

    loadAllConversations();
  }, [userData?.id, getUserName, getBookInfo]);

  // ---- Xử lý state từ BookDetail (nhấn "Nhắn tin cho người bán") ----
  useEffect(() => {
    const state = location.state;
    if (!state?.sellerId || !userData?.id) return;

    const bothIds = [state.sellerId, userData.id].sort();
    const roomId = `conv-${bothIds[0]}-${bothIds[1]}-${state.bookId || "no-book"}`;

    setConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === roomId);
      if (existingIdx >= 0) {
        setActiveConvIndex(existingIdx);
        return prev;
      }

      const newConv = {
        id: roomId,
        name: state.sellerName || "Người bán",
        sellerId: state.sellerId,
        otherUserId: userData.id,
        myId: userData.id,
        bookId: state.bookId || null,
        bookTitle: state.bookTitle || "",
        bookImage: state.bookImage || null,
        bookPrice: state.bookPrice || null,
        preview: "Bắt đầu cuộc trò chuyện",
        messages: [],
      };
      setActiveConvIndex(0);
      return [newConv, ...prev];
    });

    window.history.replaceState({}, document.title);
  }, [location.state, userData?.id]);

  // ---- Join user room ----
  useEffect(() => {
    if (userData?.id) {
      socket.emit("join_user_room", userData.id);
    }
  }, [userData?.id]);

  // ---- Join tất cả room của conversations hiện tại ----
  useEffect(() => {
    for (const conv of conversations) {
      if (conv.id && conv.id !== "default") {
        socket.emit("join_room", conv.id);
      }
    }
  }, [conversations.length]);

  // Socket: nhận tin nhắn real-time
  useEffect(() => {
    const handleReceive = (data) => {
      const msgRoom = data.room || data.conversation_id;
      const isFromMe = data.senderId === userData?.id;
      const fixedData = { ...data, from: isFromMe ? "me" : "other" };

      setMessages((prev) => {
        if (msgRoom !== room) return prev;
        return [...prev, fixedData];
      });

      setConversations((prevConvs) => {
        let found = false;
        const convs = prevConvs.map((c) => {
          if (c.id === msgRoom) {
            found = true;
            const newMsgs = [...(c.messages || []), fixedData];
            return {
              ...c,
              messages: newMsgs,
              preview: data.messageType === "image"
                ? "[Hình ảnh]"
                : fixedData.text,
            };
          }
          return c;
        });

        if (!found) {
          const senderName = data.senderName || data.senderId?.substring(0, 8);
          convs.unshift({
            id: msgRoom,
            name: isFromMe
              ? (data.receiverName || data.receiverId?.substring(0, 8))
              : senderName,
            sellerId: data.senderId,
            otherUserId: data.receiverId,
            bookId: data.bookId || null,
            preview: data.messageType === "image"
              ? "[Hình ảnh]"
              : fixedData.text,
            messages: [fixedData],
          });
        }

        return convs;
      });
    };

    socket.on("receive_message", handleReceive);
    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [room, userData?.id]);

  // Load messages từ hội thoại đang active
  useEffect(() => {
    if (currentConv?.messages) {
      setMessages(currentConv.messages);
    } else {
      setMessages([]);
    }
  }, [currentConv]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateConversationPreview = useCallback(
    (text) => {
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === room) {
            return { ...c, preview: text };
          }
          return c;
        });
      });
    },
    [room]
  );

  const sendMessageLocally = useCallback((messageData) => {
    setMessages((prev) => {
      const updated = [...prev, messageData];
      setConversations((prevConvs) => {
        return prevConvs.map((c) => {
          if (c.id === room) {
            return { ...c, messages: updated, preview: messageData.messageType === "image" ? "[Hình ảnh]" : messageData.text };
          }
          return c;
        });
      });
      return updated;
    });
  }, [room]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !currentConv) return;

    const messageData = {
      room,
      from: "me",
      text: newMessage,
      messageType: "text",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderId: userData?.id,
      senderName: userData?.name || userData?.email || userData?.id?.substring(0, 8),
      receiverId: currentConv.sellerId,
      receiverName: currentConv.name,
      bookId: currentConv.bookId || null,
    };

    socket.emit("send_message", messageData);
    sendMessageLocally(messageData);
    setNewMessage("");
  };

  // ---- Upload ảnh và gửi ----
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentConv || !userData?.id) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      alert("Chỉ chấp nhận file ảnh!");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert("Ảnh không được quá 5MB!");
      return;
    }

    setUploadingImage(true);
    try {
      // Upload ảnh lên Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `chat_${userData.id}_${Date.now()}.${fileExt}`;
      const filePath = `messages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Lấy public URL
      const { data: urlData } = supabase.storage
        .from("chat-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData?.publicUrl;

      // Gửi tin nhắn ảnh qua socket
      const messageData = {
        room,
        from: "me",
        text: "",
        imageUrl,
        messageType: "image",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderId: userData?.id,
        senderName: userData?.name || userData?.email || userData?.id?.substring(0, 8),
        receiverId: currentConv.sellerId,
        receiverName: currentConv.name,
        bookId: currentConv.bookId || null,
      };

      socket.emit("send_message", messageData);
      sendMessageLocally(messageData);
    } catch (err) {
      console.error("Upload image failed:", err);
      alert("Gửi ảnh thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setUploadingImage(false);
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Mark messages as read khi active conversation thay đổi
  useEffect(() => {
    if (room && userData?.id) {
      socket.emit("mark_read", { room, userId: userData.id });
    }
  }, [room, userData?.id]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const switchConversation = (index) => {
    setActiveConvIndex(index);
  };

  const goToUserProfile = (userId, e) => {
    if (e) e.stopPropagation();
    if (userId) navigate(`/user/${userId}`);
  };

  // ---------- RENDER ----------
  // Không có hội thoại nào
  if (!currentConv && conversations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-160px)] min-h-[600px] border border-slate-200 bg-white shadow-sm mt-6">
        <div className="w-1/3 flex flex-col border-r border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900">Tin nhắn</h1>
          </div>
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Không có tin nhắn
          </div>
        </div>
        <div className="w-2/3 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-200 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-slate-400 text-sm">
              Trò chuyện với người bán để trao đổi thông tin
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex h-[calc(100vh-160px)] min-h-[600px] border border-slate-200 bg-white shadow-sm mt-6">
      {/* Left Sidebar: Conversations List */}
      <div className="w-1/3 flex flex-col border-r border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Tin nhắn</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c, i) => (
            <div
              key={c.id}
              onClick={() => switchConversation(i)}
              className={`p-4 border-b border-slate-100 flex gap-3 cursor-pointer transition-colors ${
                i === activeConvIndex
                  ? "bg-slate-50 relative"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              {i === activeConvIndex && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-700"></div>
              )}
              <div
                className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold shrink-0 cursor-pointer hover:bg-teal-200 transition-colors"
                onClick={(e) => goToUserProfile(c.otherUserId, e)}
                title="Xem trang cá nhân"
              >
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-bold text-slate-900 truncate pr-2">
                    {c.name}
                  </p>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {/* Bỏ time mẫu */}
                  </span>
                </div>
                <p
                  className={`text-sm truncate ${
                    i === activeConvIndex
                      ? "text-slate-900 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  {c.preview || "Chưa có tin nhắn"}
                </p>
                {c.bookTitle && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    Sách: {c.bookTitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar: Chat Area */}
      <div className="w-2/3 flex flex-col relative bg-white">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center h-[73px]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold shrink-0 cursor-pointer hover:bg-teal-200 transition-colors"
              onClick={() => goToUserProfile(currentConv?.otherUserId)}
              title="Xem trang cá nhân"
            >
              {currentConv?.name?.charAt(0) || "N"}
            </div>
            <h2 className="font-bold text-slate-900">
              {currentConv?.name || "Người bán"}
            </h2>
          </div>

          {currentConv?.bookTitle && (
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 -mr-2 rounded-lg transition-colors"
              onClick={() => currentConv.bookId && navigate(`/sach/${currentConv.bookId}`)}
              title="Xem chi tiết sách"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">
                  {currentConv.bookTitle}
                </p>
                {currentConv.bookPrice && (
                  <p className="text-sm font-bold text-teal-700">
                    {Number(currentConv.bookPrice).toLocaleString()}đ
                  </p>
                )}
              </div>
              {currentConv.bookImage && (
                <img
                  src={currentConv.bookImage}
                  className="w-10 h-10 object-cover border border-slate-200 rounded"
                  alt={currentConv.bookTitle}
                />
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-[#fdfdfd]">
          <div className="text-center text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
            Hôm nay
          </div>

          <div className="self-center bg-slate-100 px-4 py-2 rounded-full text-xs text-slate-500 font-semibold mb-2">
            {currentConv?.name || "Người bán"} đã bắt đầu cuộc trò chuyện về
            một tài liệu
          </div>

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex max-w-[70%] gap-3 ${
                m.from === "me"
                  ? "self-end flex-row-reverse"
                  : "self-start"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  m.from === "me"
                    ? "bg-slate-200 text-slate-700"
                    : "bg-teal-100 text-teal-700 hover:bg-teal-200"
                } cursor-pointer transition-colors`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (m.from === "other") {
                    goToUserProfile(m.senderId);
                  } else {
                    navigate("/profile");
                  }
                }}
                title={m.from === "me" ? "Trang cá nhân của tôi" : "Xem trang cá nhân"}
              >
                {m.from === "me"
                  ? userData?.name?.charAt(0) || "T"
                  : currentConv?.name?.charAt(0) || "N"}
              </div>
              <div>
                {m.messageType === "image" && m.imageUrl ? (
                  <div>
                    <img
                      src={m.imageUrl}
                      alt="Hình ảnh"
                      className={`max-w-[280px] max-h-[300px] rounded-xl object-cover border border-slate-200 cursor-pointer ${
                        m.from === "me" ? "" : ""
                      }`}
                      onClick={() => window.open(m.imageUrl, "_blank")}
                    />
                    <div
                      className={`text-[11px] text-slate-400 mt-1 uppercase ${
                        m.from === "me" ? "text-right" : "text-left"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      className={`p-3 text-[15px] leading-relaxed ${
                        m.from === "me"
                          ? "bg-teal-700 text-white rounded-2xl rounded-tr-sm"
                          : "bg-slate-100 text-slate-900 rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    <div
                      className={`text-[11px] text-slate-400 mt-1 uppercase ${
                        m.from === "me" ? "text-right" : "text-left"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            {/* Nút chọn ảnh */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || !currentConv}
              className="p-3 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-full transition-colors shrink-0 disabled:opacity-50"
              title="Gửi ảnh"
            >
              {uploadingImage ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            <input
              type="text"
              className="vinted-input m-0 flex-1 bg-slate-50 border-transparent focus:border-teal-500 focus:bg-white focus:ring-0"
              placeholder="Viết tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-3 font-bold text-teal-700 hover:bg-teal-50 rounded transition-colors shrink-0"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}