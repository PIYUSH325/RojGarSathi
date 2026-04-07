import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ChatWidget.css';
import { useAuth } from '../../context/AuthContext';

const formatTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return '';
  }
};

const TypingIndicator = () => (
  <span className="typing-indicator">
    <span className="dot" />
    <span className="dot" />
    <span className="dot" />
  </span>
);

const getChatStorageKey = (userId) => `rojgarsathi-ai-chat-${userId || 'guest'}`;

const PREDEFINED_ISSUES = [
    { id: 'auth-login-fails', title: 'Login fails', text: 'Login fails', solution: 'User steps:\n1) Verify username/email and password (check Caps Lock).\n2) Clear browser cache & cookies or try Incognito.\n3) Use the "Forgot password" flow to reset credentials.\n\nDeveloper steps:\n1) Inspect auth logs for failed attempts and error codes.\n2) Verify hashing and user lookup logic.\n3) Check rate limiting and account lockout policies.' },
    { id: 'auth-random-logout', title: 'Random logout', text: 'Random logout', solution: 'User steps:\n1) Close and reopen the browser, then re-login.\n2) Try a different browser or device.\n\nDeveloper steps:\n1) Check token expiry/refresh flows and clock skew on server.\n2) Confirm cookies (HttpOnly/secure) and storage strategy.\n3) Investigate concurrent session invalidation logic.' },
    { id: 'auth-session-expired', title: 'Session expired', text: 'Session expired', solution: 'User steps:\n1) Re-login and enable "Remember me" if available.\n2) Check system clock and timezone.\n\nDeveloper steps:\n1) Verify refresh token handling and expiry values.\n2) Ensure tokens are renewed before expiry during active sessions.' },
    { id: 'auth-token-issues', title: 'Token issues', text: 'Token invalid/expired/refresh problems', solution: 'User steps:\n1) Log out and log back in to obtain fresh tokens.\n\nDeveloper steps:\n1) Validate JWT signing/verification keys and rotation.\n2) Add detailed logs around token validation errors.\n3) Ensure client uses the refresh flow correctly.' },

    { id: 'apply-button-not-working', title: 'Apply button not working', text: 'Apply button not working', solution: 'User steps:\n1) Make sure you are logged in.\n2) Check required profile fields (resume, contact).\n3) Try another browser or clear cache.\n\nDeveloper steps:\n1) Inspect client console for JS errors and button handler wiring.\n2) Confirm API endpoint and auth headers are correct.\n3) Add server-side validation and return helpful errors.' },
    { id: 'resume-upload-failed', title: 'Resume upload failed', text: 'Resume upload failed', solution: 'User steps:\n1) Use supported file types (PDF/DOCX) and reduce file size.\n2) Retry and check network connectivity.\n\nDeveloper steps:\n1) Verify multipart handling (FormData + multer) and storage permissions.\n2) Check file size limits and return friendly errors for too-large files.' },
    { id: 'application-not-saved', title: 'Application not saved', text: 'Application not saved after submit', solution: 'User steps:\n1) Confirm you received a success message or email.\n2) Try re-submitting and note any error shown.\n\nDeveloper steps:\n1) Check API response and server logs for DB write errors.\n2) Ensure transactions are used where multiple writes are required.' },
    { id: 'already-applied-not-visible', title: 'Already applied but not visible', text: 'Application submitted but not visible in my applications', solution: 'User steps:\n1) Refresh the My Applications page and clear cache.\n2) Check your email for confirmation.\n\nDeveloper steps:\n1) Verify application record creation and user-job relation.\n2) Ensure the frontend fetches the correct endpoint and handles pagination.' },

    { id: 'messages-not-sending', title: 'Messages not sending', text: 'Messages not sending', solution: 'User steps:\n1) Ensure you are logged in and have network access.\n2) Reload the page and try again.\n\nDeveloper steps:\n1) Check the message POST endpoint and auth headers.\n2) Inspect socket/server logs for errors and timeouts.' },
    { id: 'chat-not-opening', title: 'Chat not opening', text: 'Chat UI not opening or crashes', solution: 'User steps:\n1) Re-login and open the chat from Messages page.\n2) Try a different browser to reproduce.\n\nDeveloper steps:\n1) Add defensive checks for null conversation/job objects.\n2) Ensure route params are validated before rendering.' },
    { id: 'undefined-id-error', title: "'undefined id' error", text: "'undefined id' error", solution: 'User steps:\n1) Refresh the page.\n2) Report the URL and steps to reproduce.\n\nDeveloper steps:\n1) Validate incoming route params and DB ids before use.\n2) Add explicit error handling and fallback UI when id is missing.' },
    { id: 'socket-connection-failed', title: 'Socket connection failed', text: 'Socket connection failed / disconnected', solution: 'User steps:\n1) Check your internet and firewall settings.\n2) Reload the app and try again.\n\nDeveloper steps:\n1) Inspect Socket.IO server logs and CORS/upgrades (NGINX) config.\n2) Add reconnect logic and increase pingTimeout/pingInterval as needed.' },

    { id: 'api-not-responding', title: 'API not responding', text: 'API not responding / network errors', solution: 'User steps:\n1) Check network and try again later.\n2) If using a proxy, ensure it allows requests to api domain.\n\nDeveloper steps:\n1) Check API server health and logs.\n2) Verify load balancer and firewall rules.\n3) Add health checks and monitoring.' },
    { id: 'server-500-error', title: '500 server error', text: 'Internal server error (500)', solution: 'User steps:\n1) Try the action again later.\n2) Report the action and time to support.\n\nDeveloper steps:\n1) Inspect server logs and stack traces for the error.\n2) Add validation, input sanitization, and better error messages.' },
    { id: 'slow-loading', title: 'Slow loading', text: 'Slow page loads or API responses', solution: 'User steps:\n1) Test with another network and browser.\n2) Clear cache and retry.\n\nDeveloper steps:\n1) Profile API responses and DB queries.\n2) Add caching, pagination, and optimize queries.\n3) Use a CDN for static assets.' },

    { id: 'profile-not-updating', title: 'Profile not updating', text: 'Profile changes not saved', solution: 'User steps:\n1) Ensure all required fields are filled.\n2) Check for success message after saving.\n\nDeveloper steps:\n1) Verify API endpoint and request payload.\n2) Check validation errors and return them to the client.' },
    { id: 'image-upload-failed', title: 'Image upload failed', text: 'Profile image upload failed', solution: 'User steps:\n1) Use JPG/PNG and smaller images.\n2) Retry after network check.\n\nDeveloper steps:\n1) Validate storage config (Cloudinary/s3) and keys.\n2) Add server-side image validation and helpful error messages.' },
    { id: 'missing-required-fields', title: 'Missing required fields', text: 'Form submission fails due to missing fields', solution: 'User steps:\n1) Fill all required fields marked with *.\n2) Hover/inspect fields for inline validation messages.\n\nDeveloper steps:\n1) Ensure frontend enforces required fields and shows validation messages.\n2) Backend must validate and return structured errors.' },

    { id: '404-page-not-found', title: 'Page not found (404)', text: '404 Page not found', solution: 'User steps:\n1) Check the URL for typos.\n2) Use the site navigation or homepage link.\n\nDeveloper steps:\n1) Add friendly 404 page and logging for broken links.\n2) Verify route definitions and client-side routing.' },
    { id: 'wrong-redirects', title: 'Wrong redirects', text: 'Page redirects to wrong location', solution: 'User steps:\n1) Report the link and where it redirects.\n2) Use the site menu to reach intended page.\n\nDeveloper steps:\n1) Check router logic and server redirect rules.\n2) Verify auth guards do not incorrectly redirect users.' },
    { id: 'nav-button-not-working', title: 'Button not working', text: 'Navigation or action button not responding', solution: 'User steps:\n1) Refresh and retry the button.\n2) Try another browser or device.\n\nDeveloper steps:\n1) Inspect console for JS errors and event bindings.\n2) Ensure accessibility attributes (role/button) are correct.' },

    { id: 'language-not-changing', title: 'Language not changing', text: 'Language selection not applied', solution: 'User steps:\n1) Select the language and refresh the page.\n2) Clear cache if strings still show previous language.\n\nDeveloper steps:\n1) Verify i18n initialization and language store.\n2) Ensure translations are loaded and keys are correct.' },
    { id: 'mixed-language-ui', title: 'Mixed language UI', text: 'Some UI shows in the wrong language', solution: 'User steps:\n1) Refresh and check language preferences.\n2) Report the pages with mixed language.\n\nDeveloper steps:\n1) Ensure all UI strings use i18n keys and no hard-coded text remains.\n2) Check fallback locale behavior.' },
    { id: 'notifications-not-showing', title: 'Notifications not showing', text: 'Notifications missing or not appearing', solution: 'User steps:\n1) Check notification settings in profile.\n2) Refresh the page and check the Notifications page.\n\nDeveloper steps:\n1) Verify notification creation and delivery logic.\n2) Ensure sockets emit notification events or background jobs run properly.' },
    { id: 'wrong-unread-count', title: 'Wrong unread count', text: 'Unread notification count incorrect', solution: 'User steps:\n1) Open Notifications page to sync read status.\n2) Refresh to see updated counts.\n\nDeveloper steps:\n1) Verify read/unread marking endpoint and client updates.\n2) Ensure optimistic UI does not drift from server state.' }
    ,{ id: 'registration-failed', title: 'Registration failed', text: 'Registration or signup failed', solution: 'User steps:\n1) Check email format and password requirements.\n2) Try a different email and disable browser autofill.\n\nDeveloper steps:\n1) Verify register API validation rules and duplicate-user checks.\n2) Return field-specific errors to the UI.' }
    ,{ id: 'otp-not-received', title: 'OTP not received', text: 'OTP not received for verification', solution: 'User steps:\n1) Check spam/promotions folders and wait 2-3 minutes.\n2) Confirm mobile/email is correct, then request OTP again.\n\nDeveloper steps:\n1) Verify SMS/email gateway delivery logs and rate limits.\n2) Ensure OTP expiry and resend flow are configured correctly.' }
    ,{ id: 'jobs-not-loading', title: 'Jobs not loading', text: 'Job list not loading', solution: 'User steps:\n1) Refresh page and check internet connection.\n2) Remove filters and retry.\n\nDeveloper steps:\n1) Verify jobs listing endpoint and pagination params.\n2) Check DB query performance and API timeout limits.' }
    ,{ id: 'search-not-working', title: 'Search not working', text: 'Job search not working', solution: 'User steps:\n1) Try shorter keywords and clear filters.\n2) Refresh and retry search.\n\nDeveloper steps:\n1) Verify search query parsing and indexing strategy.\n2) Validate debounce and API request cancellation behavior.' }
    ,{ id: 'filters-not-working', title: 'Filters not working', text: 'Location/category/salary filter not working', solution: 'User steps:\n1) Reset all filters and apply one by one.\n2) Check if any filter value is empty or invalid.\n\nDeveloper steps:\n1) Confirm filter params map correctly from UI to API.\n2) Validate backend query builder for combined filters.' }
    ,{ id: 'bookmark-job-failed', title: 'Save job not working', text: 'Save or bookmark job not working', solution: 'User steps:\n1) Re-login and try saving again.\n2) Refresh Saved Jobs page after action.\n\nDeveloper steps:\n1) Verify save/unsave endpoint and user-job mapping.\n2) Ensure optimistic updates are reverted on API failure.' }
    ,{ id: 'contact-form-failed', title: 'Contact form not submitting', text: 'Contact form not submitting', solution: 'User steps:\n1) Fill all required fields and try again.\n2) Disable ad-blockers and retry once.\n\nDeveloper steps:\n1) Validate contact API payload and spam protection rules.\n2) Check mail service and persistence logs for failures.' }
    ,{ id: 'email-notifications-not-received', title: 'Email notifications not received', text: 'Email notifications not received', solution: 'User steps:\n1) Check spam folder and whitelist sender email.\n2) Confirm notification preferences are enabled.\n\nDeveloper steps:\n1) Verify SMTP credentials and sender reputation.\n2) Check notification queue/cron job processing and retries.' }
    ,{ id: 'admin-dashboard-data-mismatch', title: 'Admin dashboard data mismatch', text: 'Admin dashboard stats are wrong', solution: 'User steps:\n1) Refresh dashboard and compare with detailed pages.\n2) Note exact stat and time for support.\n\nDeveloper steps:\n1) Validate analytics aggregation queries and date ranges.\n2) Rebuild cached metrics and verify timezone handling.' }
  ];

const getLocalGeneralFallback = (text) => {
  const q = String(text || '').toLowerCase().trim();
  if (!q) {
    return 'I can still help while AI is reconnecting. Ask me about careers, interviews, resumes, or basic website issues.';
  }

  if (/\b(hello|hi|hey|namaste|good morning|good evening)\b/.test(q)) {
    return 'Hello! I can help with job search, resumes, interviews, and quick troubleshooting for this platform.';
  }
  if (/\b(resume|cv)\b/.test(q)) {
    return 'Resume quick tips:\n1) Keep it 1-2 pages with measurable achievements.\n2) Add role-specific keywords from the job post.\n3) Put strongest projects/experience near the top.';
  }
  if (/\b(interview|hr round|technical round)\b/.test(q)) {
    return 'Interview quick plan:\n1) Prepare a 60-second self-introduction.\n2) Use STAR format for experience questions.\n3) Practice 3 role-specific technical topics and 2 questions to ask the interviewer.';
  }
  if (/\b(cover letter)\b/.test(q)) {
    return 'Cover letter structure:\n1) Why this role/company.\n2) 2-3 relevant achievements.\n3) Clear closing with availability and contact details.';
  }
  if (/\b(salary|ctc|pay|package)\b/.test(q)) {
    return 'Salary discussion tip: share a researched range, highlight your impact, and ask for total compensation details (fixed, bonus, benefits, growth).' ;
  }
  if (/\b(skill|upskill|learn|course)\b/.test(q)) {
    return 'Upskilling starter path:\n1) Pick one target role.\n2) Build 2 portfolio projects for that role.\n3) Practice interview questions weekly and update your profile with new work.';
  }

  return 'I am temporarily in offline assist mode. I can still answer general career questions and website help. Try asking about resume review, interview prep, or job application tips.';
};

const ChatWindow = ({ onClose, inline = false, visible = true, onNewMessage }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const storageKeyRef = useRef(getChatStorageKey(user?.id));
  const createWelcomeMessage = () => ({
    id: 'welcome',
    sender: 'bot',
    text: `${t('chatWidget.greetingPrefix')} ${user?.name ? user.name.split(' ')[0] : t('chatWidget.there')} — ${t('chatWidget.greetingBody')}`,
    time: new Date().toISOString()
  });
  const [messages, setMessages] = useState([
    createWelcomeMessage(),
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [searchText, setSearchText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const presetScrollRef = useRef(null);

  useEffect(() => {
    storageKeyRef.current = getChatStorageKey(user?.id);
    try {
      const raw = localStorage.getItem(storageKeyRef.current);
      if (!raw) {
        setMessages([createWelcomeMessage()]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed);
      } else {
        setMessages([createWelcomeMessage()]);
      }
    } catch (err) {
      setMessages([createWelcomeMessage()]);
    }
  }, [user?.id, user?.name, t]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyRef.current, JSON.stringify(messages));
    } catch (err) {
      // ignore storage write issues (private mode, quota)
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
    };
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      try {
        bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
      } catch (err) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    await sendMessageFromText(text);
  };

  const sendMessageFromText = async (text, replaceId = null) => {
    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text, time: new Date().toISOString() };
    if (!replaceId) setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    // loading placeholder (will be replaced by one and only one reply)
    const loadingId = replaceId || `l-${Date.now()}`;
    if (!replaceId) setMessages((m) => [...m, { id: loadingId, sender: 'bot', type: 'loading', text: '', time: new Date().toISOString() }]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, role: user?.role || 'guest' }),
      });

      if (!res.ok) throw new Error(t('chatWidget.aiServiceError'));
      const data = await res.json();
      const reply = (data && (data.reply || data.message)) || t('chatWidget.noReply');

      // replace loading placeholder with AI reply (single replacement)
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `b-${Date.now()}`, sender: 'bot', text: reply, time: new Date().toISOString(), type: 'bot' } : m)));

      // notify widget wrapper about new message (for unread badge) only when widget is closed
      if (onNewMessage && !visible) onNewMessage();
    } catch (err) {
      // Try a local predefined solution first (single replacement). If none matches, show a single error message.
      try {
        const lower = (text || '').toLowerCase();
        const match = PREDEFINED_ISSUES.find((it) => lower.includes(it.text.toLowerCase()) || lower.includes(it.title.toLowerCase()));
        if (match) {
          setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `fb-${Date.now()}`, sender: 'bot', text: match.solution, time: new Date().toISOString(), type: 'bot' } : m)));
        } else {
          const fallback = getLocalGeneralFallback(text);
          setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `fb-${Date.now()}`, sender: 'bot', text: fallback, time: new Date().toISOString(), type: 'bot' } : m)));
        }
      } catch (silent) {
        const fallback = getLocalGeneralFallback(text);
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `fb-${Date.now()}`, sender: 'bot', text: fallback, time: new Date().toISOString(), type: 'bot' } : m)));
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Clicking a chip should autofill input; quick-send icon will directly send it
  const sendPredefined = async (issue) => {
    if (!issue) return;
    setInput(issue.text || '');
    inputRef.current?.focus();
  };

  const quickSendPredefined = async (issue) => {
    if (!issue || isTyping) return;
    await sendMessageFromText(issue.text || '');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollPresets = (direction) => {
    if (!presetScrollRef.current) return;
    const amount = direction === 'left' ? -220 : 220;
    presetScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const clearChat = () => {
    const next = [{ id: 'welcome', sender: 'bot', text: `${t('chatWidget.greetingPrefix')} ${user?.name ? user.name.split(' ')[0] : t('chatWidget.there')} — ${t('chatWidget.greetingBody')}`, time: new Date().toISOString() }];
    setMessages(next);
    try {
      localStorage.setItem(storageKeyRef.current, JSON.stringify(next));
    } catch (err) {}
  };

  const exportChat = () => {
    try {
      const lines = messages
        .filter((m) => m.type !== 'loading')
        .map((m) => `[${new Date(m.time || Date.now()).toLocaleString()}] ${m.sender === 'bot' ? 'Assistant' : 'You'}: ${m.text || ''}`)
        .join('\n\n');
      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rojgarsathi-ai-chat-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export chat:', err);
    }
  };

  const copyMessage = async (msg) => {
    if (!msg?.text) return;
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 1200);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript.trim()));
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const visibleMessages = messages.filter((m) => {
    if (!searchText.trim()) return true;
    return String(m.text || '').toLowerCase().includes(searchText.trim().toLowerCase());
  });

  const retryMessage = async (msg) => {
    if (!msg || !msg.originalText) return;
    // replace error message with new loading placeholder and resend
    const loadingId = `rl-${Date.now()}`;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { id: loadingId, sender: 'bot', type: 'loading', text: '', time: new Date().toISOString() } : m)));
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg.originalText, role: user?.role || 'guest' }),
      });
      if (!res.ok) throw new Error(t('chatWidget.aiServiceError'));
      const data = await res.json();
      const reply = (data && (data.reply || data.message)) || t('chatWidget.noReply');
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `b-${Date.now()}`, sender: 'bot', text: reply, time: new Date().toISOString(), type: 'bot' } : m)));
      if (onNewMessage && !visible) onNewMessage();
    } catch (err) {
      try {
        const lower = (msg.originalText || '').toLowerCase();
        const match = PREDEFINED_ISSUES.find((it) => lower.includes(it.text.toLowerCase()) || lower.includes(it.title.toLowerCase()));
        if (match) {
          setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `fb-${Date.now()}`, sender: 'bot', text: match.solution, time: new Date().toISOString(), type: 'bot' } : m)));
          if (onNewMessage && !visible) onNewMessage();
        } else {
          const fallback = getLocalGeneralFallback(msg.originalText);
          setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `fb-${Date.now()}`, sender: 'bot', text: fallback, time: new Date().toISOString(), type: 'bot' } : m)));
          if (onNewMessage && !visible) onNewMessage();
        }
      } catch (silent) {
        const fallback = getLocalGeneralFallback(msg.originalText);
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? { id: `fb-${Date.now()}`, sender: 'bot', text: fallback, time: new Date().toISOString(), type: 'bot' } : m)));
        if (onNewMessage && !visible) onNewMessage();
      }
    }
  };

  return (
    <div className={`chat-window ${inline ? 'chat-window--inline' : ''} ${visible ? 'visible' : 'hidden'} ${isExpanded ? 'chat-window--expanded' : ''}`} role="dialog" aria-label={t('chatWidget.ariaLabel')}>
      <div className="chat-header gradient">
        <div>
          <div className="chat-title">{t('chatWidget.title')}</div>
          <div className="chat-subtitle">{user ? `${user.name?.split(' ')[0] || t('chatWidget.user')} · ${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : t('common.guest')}` : t('common.guest')}</div>
        </div>
        <div className="chat-actions">
          <button className="chat-clear" title={isExpanded ? 'Shrink chat' : 'Expand chat'} onClick={() => setIsExpanded((v) => !v)}>{isExpanded ? 'Shrink' : 'Expand'}</button>
          <button className="chat-clear" title="Export chat" onClick={exportChat}>Export</button>
          <button className="chat-clear" title={t('chatWidget.clearChat')} onClick={clearChat}>{t('common.clear')}</button>
          <a href="/ai-chat" className="chat-open-page" title={t('chatWidget.openFullChat')}>{t('common.open')}</a>
          <button onClick={onClose} className="chat-close" aria-label={t('chatWidget.closeChat')}>×</button>
        </div>
      </div>

      <div className="chat-search-row">
        <input
          type="text"
          placeholder="Search chat..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="chat-tabs">
        <div className="tab-headers">
          <button className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>{t('chatWidget.suggestions')}</button>
          <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>{t('chatWidget.allIssues')}</button>
        </div>

        <div className="tab-content">
          {activeTab === 'suggestions' && (
            <div className="preset-slider-wrap" aria-hidden={false}>
              <button className="preset-nav" type="button" title="Slide left" onClick={() => scrollPresets('left')}>
                ‹
              </button>
              <div className="chat-presets" ref={presetScrollRef}>
                {PREDEFINED_ISSUES.map((issue) => (
                  <div key={issue.id} className="preset-chip-wrap">
                    <button className="preset-chip" onClick={() => sendPredefined(issue)}>
                      {issue.title}
                    </button>
                    <button className="preset-send" title={t('chatWidget.sendNow')} onClick={() => quickSendPredefined(issue)}>
                      ➤
                    </button>
                  </div>
                ))}
              </div>
              <button className="preset-nav" type="button" title="Slide right" onClick={() => scrollPresets('right')}>
                ›
              </button>
            </div>
          )}

          {activeTab === 'all' && (
            <div className="all-issues-list" role="list">
              {PREDEFINED_ISSUES.map((issue) => (
                <div key={issue.id} className="all-issue-item" role="listitem">
                  <div className="issue-row">
                    <div className="issue-title">{issue.title}</div>
                    <div className="issue-actions">
                      <button className="issue-use" onClick={() => sendPredefined(issue)}>{t('chatWidget.use')}</button>
                      <button className="issue-send" onClick={() => quickSendPredefined(issue)}>{t('chatWidget.send')}</button>
                    </div>
                  </div>
                  <div className="issue-solution">{issue.solution}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {visibleMessages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.sender === 'bot' ? 'bot' : 'user'} ${m.type || ''}`}>
            <div className="chat-msg-text">
              {m.type === 'loading' ? <div className="bubble-loading"><div className="spinner"/></div> : m.text}
              {m.type === 'error' && (
                <div className="error-actions">
                  <button className="retry-btn" onClick={() => retryMessage(m)}>{t('chatWidget.retry')}</button>
                </div>
              )}
            </div>
            <div className="chat-msg-meta">
              <span className="chat-msg-time">{formatTime(m.time)}</span>
              {m.sender === 'bot' && m.type !== 'loading' && m.text && (
                <button className="chat-copy-btn" onClick={() => copyMessage(m)}>{copiedMessageId === m.id ? 'Copied' : 'Copy'}</button>
              )}
            </div>
          </div>
        ))}

        {isTyping && <div className="chat-msg bot typing"><div className="chat-msg-text"><TypingIndicator /></div></div>}
      </div>

      <div className="chat-input">
        <button
          className={`chat-mic ${isListening ? 'listening' : ''}`}
          type="button"
          title="Voice input"
          onClick={toggleVoiceInput}
        >
          {isListening ? '●' : '🎙'}
        </button>
        <textarea
          ref={inputRef}
          placeholder={t('chatWidget.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <button className="chat-send" onClick={sendMessage} disabled={isTyping || !input.trim()} aria-disabled={isTyping || !input.trim()}>
          {/* send icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
