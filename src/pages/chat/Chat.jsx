import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ChevronLeft, Send, Phone } from 'lucide-react';

const Chat = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch booking to show partner info
  const { data: booking = {} } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const res = await api.get(`/bookings/${bookingId}`);
      return res.data?.data?.booking || {};
    },
    staleTime: 60000,
  });

  const partnerName = booking?.partner?.name || 'Service Partner';
  const partnerInitials = partnerName.substring(0, 2).toUpperCase();

  // ── Auto-scroll to latest message ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Firestore real-time chat listener ─────────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return;

    const messagesRef = collection(db, 'chats', bookingId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text,
            senderUid: data.senderUid,
            senderRole: data.senderRole,
            time: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Now',
          };
        });
        setMessages(msgs);
      },
      (err) => {
        console.error('[Chat] Firestore listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [bookingId]);

  // ── Send message via Firestore ─────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      const messagesRef = collection(db, 'chats', bookingId, 'messages');
      await addDoc(messagesRef, {
        text,
        senderUid: user?.uid,
        senderRole: 'customer',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[Chat] Failed to send message:', err);
      setInputText(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mobile-shell flex flex-col bg-slate-50 min-h-screen justify-between">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/bookings/${bookingId}`)}
            className="p-1 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-xs text-primary uppercase">
              {partnerInitials}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{partnerName}</h2>
              <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                Online
              </p>
            </div>
          </div>
        </div>

        <a
          href={`tel:${booking?.partner?.phone || '9999999999'}`}
          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all border border-slate-100"
        >
          <Phone className="w-4 h-4" />
        </a>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-24">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-xs text-slate-400 font-medium">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.senderUid === user?.uid;
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[78%] ${
                isUser ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-400 font-medium mt-1 px-1">
                {msg.time}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <form
        onSubmit={handleSendMessage}
        className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex items-center gap-3 z-50"
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
