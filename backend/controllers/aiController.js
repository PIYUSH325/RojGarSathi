// AI controller: uses Gemini (Google Generative Language) via `GEMINI_API_KEY`
// and optional `GEMINI_MODEL`; replies to ANY query like Gemini, with general/website fallbacks.
const https = require('https');

const fetchJson = (apiKey, method, path, payload = null) => {
  return new Promise((resolve, reject) => {
    try {
      const hostname = 'generativelanguage.googleapis.com';
      const body = payload ? JSON.stringify(payload) : null;
      const options = {
        hostname,
        path: `${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`,
        method,
        headers: body
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            }
          : {},
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data || '{}');
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
              return;
            }
            reject(new Error(json?.error?.message || `Gemini API error ${res.statusCode}`));
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => req.destroy(new Error('Gemini request timed out')));
      if (body) req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

const listSupportedModels = async (apiKey) => {
  const json = await fetchJson(apiKey, 'GET', '/v1beta/models');
  const models = Array.isArray(json?.models) ? json.models : [];
  return models
    .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map((m) => String(m.name || '').replace(/^models\//, ''))
    .filter(Boolean);
};

const callGenerativeAPI = (apiKey, model, promptText) => {
  const safeModel = model || 'gemini-1.5-flash';
  return fetchJson(apiKey, 'POST', `/v1beta/models/${encodeURIComponent(safeModel)}:generateContent`, {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 1024
    }
  });
};

const WEBSITE_ISSUE_REGEX = /login|logout|session|token|apply|application|resume|upload|chat|message|socket|notification|profile|worker|employer|job|dashboard|signup|register|payment|post job|api|server|500|404|cors|slow|bug|error|reset password|forgot password|otp|verify email|verification|search|filter|bookmark|saved jobs|contact form|admin panel|analytics|stats|unread/i;

const generalFallbackReply = (message) => {
  const lower = String(message || '').toLowerCase();

  if (/memory|remember|study|exam|concentration|focus/.test(lower)) {
    return `Great question. To improve memory for studying, use this 5-step routine:\n1) Study in 25-30 minute focused blocks, then take a 5 minute break.\n2) Use active recall: close notes and test yourself.\n3) Apply spaced repetition: review after 1 day, 3 days, 7 days.\n4) Teach the topic in simple words to someone (or yourself).\n5) Sleep 7-8 hours; memory consolidation depends on sleep.\n\nIf you want, I can also make a subject-wise weekly memory plan.`;
  }

  if (/interview|resume|cv|career|job switch|job search/.test(lower)) {
    return `Here is a practical career plan:\n1) Define one clear target role.\n2) Update resume with measurable achievements (numbers/results).\n3) Build 2-3 strong project stories using STAR format.\n4) Practice top interview questions daily for 20 minutes.\n5) Apply consistently (quality applications each week) and track responses.\n\nIf you share your target role, I can tailor this plan.`;
  }

  if (/code|coding|programming|javascript|react|node|python|bug|debug/.test(lower)) {
    return `Try this debugging workflow:\n1) Reproduce the issue with exact steps.\n2) Check logs/console and isolate the first failing point.\n3) Validate inputs, state, and API responses.\n4) Create a minimal fix and retest edge cases.\n5) Add a test to prevent regression.\n\nIf you paste the error message and code snippet, I can help you fix it quickly.`;
  }

  if (/health|fitness|workout|gym|diet|exercise/.test(lower)) {
    return `Quick fitness starter plan:\n1) Bodyweight circuit: 3 rounds of 10 pushups, 15 squats, 20 mountain climbers (30s rest).\n2) Walk/brisk 30 mins daily.\n3) Eat protein each meal (eggs, dal, paneer, chicken).\n4) Sleep 7+ hours.\n5) Track progress weekly.\n\nShare your goal (lose fat/gain muscle) for custom plan.`;
  }

  if (/finance|money|budget|invest|stock|crypto|bitcoin/.test(lower)) {
    return `Personal finance basics:\n1) Track all expenses 1 month (use Excel/app).\n2) Build 3-6 months emergency fund in savings.\n3) Budget 50/30/20 (needs/wants/savings).\n4) Start SIP in index funds (5k/month min).\n5) Avoid debt (credit cards).\n\nShare your income/age/goal for tailored advice.`;
  }

  if (/recipe|cook|food|recipe|kitchen/.test(lower)) {
    return `Quick 15-min pasta:\n1) Boil 100g pasta, reserve 1/2 cup water.\n2) Sauté garlic+chili in olive oil, add tomato puree.\n3) Mix pasta + sauce + pasta water + cheese.\n4) Garnish basil. Done!\n\nTell me ingredients available for custom recipe.`;
  }

  if (/travel|trip|vacation|place|destination/.test(lower)) {
    return `Budget India travel tips:\n1) Book trains early (IRCTC app).\n2) Use hostels/OYO for stay.\n3) Eat street food wisely (hot/fresh).\n4) Local SIM + Google Maps.\n5) Carry powerbank+cash.\n\nWhere to/when/budget? I can plan itinerary.`;
  }

  if (/motivation|motivated|depressed|anxious|stress/.test(lower)) {
    return `Quick motivation boost:\n1) 5 min walk outside.\n2) Write 3 things grateful for.\n3) Do 1 small task now.\n4) Talk to friend/family.\n5) Breathe deep 4-7-8 (4in,7hold,8out).\n\nYou're capable - one step at a time.`;
  }

  return `I can help with anything like Gemini! Topics: health, finance, recipes, travel, tech, motivation, science, history, etc. Share details for personalized step-by-step advice.`;
};

const buildPrompt = (message, isWebsiteIssue) => {
  const mode = isWebsiteIssue
    ? 'The query is about RojgarSathi website/app issues or troubleshooting.'
    : 'This is a general query on any topic - respond like Gemini AI: helpful, accurate, unrestricted on ANY subject.';

  return `You are RojgarSathi AI - general assistant like Gemini.

Key:
- Website issues: Step-by-step user fixes first, "Dev:" checklist.
- ANY other topic: Direct, accurate, maximally helpful responses (health, finance, recipes, coding, science, fun facts - no limits).

Rules:
- Concise (under 400 words), actionable, step-by-step.
- Natural, engaging tone.

User question: "${message}"`;
};

const extractReplyFromResponse = (json) => {
  if (!json) return null;
  if (Array.isArray(json.candidates) && json.candidates[0]?.content?.parts) {
    return json.candidates[0].content.parts
      .map((p) => (typeof p?.text === 'string' ? p.text : ''))
      .join('')
      .trim();
  }
  if (Array.isArray(json.candidates) && json.candidates.length) {
    const c = json.candidates[0];
    if (typeof c.content === 'string') return c.content;
    if (Array.isArray(c.content)) {
      return c.content.map((p) => (typeof p === 'string' ? p : p.text || '')).join('');
    }
  }
  if (Array.isArray(json.output) && json.output.length) {
    const o = json.output[0];
    if (typeof o === 'string') return o;
    if (o.content) {
      if (typeof o.content === 'string') return o.content;
      if (Array.isArray(o.content)) return o.content.map((p) => p.text || '').join('');
    }
  }
  if (json.reply) return json.reply;
  if (json.choices && Array.isArray(json.choices) && json.choices[0]) {
    return json.choices[0].content || json.choices[0].text || null;
  }
  return null;
};

const chat = async (req, res) => {
  try {
    const message = (req.body && req.body.message) ? String(req.body.message).trim() : '';

    if (!message) {
      return res.status(200).json({ reply: "Hi! I'm your RojgarSathi AI like Gemini. Ask anything: jobs, website help, recipes, fitness, finance, coding - or general questions!" });
    }

    const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GENERATIVE_API_KEY;
    const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    let geminiAttempted = false;
    let geminiLastError = '';

    const isWebsiteIssue = WEBSITE_ISSUE_REGEX.test(message);
    const promptText = buildPrompt(message, isWebsiteIssue);
    console.log(`AI Query | Type: ${isWebsiteIssue ? 'Website' : 'General'} | Msg: "${message.slice(0, 50)}..."`);

    let replySource = 'unknown';

    if (API_KEY) {
      geminiAttempted = true;
      let discoveredModels = [];
      try {
        discoveredModels = await listSupportedModels(API_KEY);
      } catch (err) {
        console.error('Gemini ListModels failed:', err.message || err);
        geminiLastError = err.message || 'Failed to list Gemini models';
      }

      const modelCandidates = [
        MODEL,
        ...discoveredModels,
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro-latest'
      ].filter((v, i, arr) => v && arr.indexOf(v) === i);

      for (const candidateModel of modelCandidates) {
        try {
          const apiJson = await callGenerativeAPI(API_KEY, candidateModel, promptText);
          const reply = extractReplyFromResponse(apiJson);
          if (reply) {
            replySource = 'Gemini';
            console.log(`AI Success - ${replySource} | Website: ${isWebsiteIssue} | Len: ${reply.length}`);
            return res.status(200).json({ reply: String(reply) });
          }
          console.warn(`Gemini returned no extractable reply for model: ${candidateModel}`);
        } catch (err) {
          console.error(`Gemini API error (${candidateModel}):`, err.message || err);
          geminiLastError = err.message || 'Gemini request failed';
        }
      }
    }

    // Fallback responses when Gemini is unavailable
    const lower = message.toLowerCase();
    const canned = [
      { test: /login fails|cannot login|can't login|unable to login|login/, reply: `Login fails - User: verify credentials, check Caps Lock, clear cache/cookies, and try Incognito. Dev: inspect auth logs, hashing/user lookup, and rate-limit/lockout logic.` },
      { test: /random logout|keeps logging out|auto logout|session expired/, reply: `Random logout/session expired - User: login again and check device time/timezone. Dev: verify token expiry, refresh flow, cookie settings, and server clock skew.` },
      { test: /token invalid|token expired|refresh token|jwt/, reply: `Token issues - User: log out and log in for fresh tokens. Dev: validate JWT sign/verify keys, token rotation, and client refresh flow handling.` },
      { test: /register|signup|sign up|registration/, reply: `Registration failed - User: confirm email format and password rules, then retry. Dev: check registration validations, duplicate-user handling, and field-level error responses.` },
      { test: /otp|verification code|verify email|verification mail/, reply: `OTP not received - User: check spam/promotions, wait 2-3 minutes, then resend OTP. Dev: inspect email/SMS gateway logs, resend throttling, and OTP expiry config.` },
      { test: /forgot password|reset password/, reply: `Password reset - User: use the latest reset link and check spam folder. Dev: verify SMTP delivery, reset token generation, and token-expiry handling.` },

      { test: /apply button|apply not working|cannot apply|apply/, reply: `Apply button not working - User: ensure you are logged in and required profile fields are complete. Dev: check click handler wiring, endpoint URL, auth headers, and server validation messages.` },
      { test: /resume upload failed|cv upload failed|upload resume|upload/, reply: `Resume upload failed - User: use supported type (PDF/DOCX) and reduce file size. Dev: validate multipart/multer config, storage permissions, and size-limit errors.` },
      { test: /application not saved|application failed|submit not saved/, reply: `Application not saved - User: retry submit and check success confirmation. Dev: inspect API/DB write errors and transaction consistency for multi-step writes.` },
      { test: /already applied not visible|applied but not visible|my applications not showing/, reply: `Applied but not visible - User: refresh My Applications and check confirmation email. Dev: verify application record creation and user-job relation query/pagination.` },
      { test: /job list not loading|jobs not loading|no jobs|job feed/, reply: `Jobs not loading - User: refresh and remove filters. Dev: verify listing endpoint, pagination/query params, and DB query performance/timeouts.` },
      { test: /search not working|job search not working|keyword search/, reply: `Search not working - User: try shorter keywords and clear filters. Dev: validate search parser/indexing and frontend debounce/request cancellation behavior.` },
      { test: /filter not working|location filter|category filter|salary filter/, reply: `Filters not working - User: reset all filters and apply one-by-one. Dev: ensure UI filter params map correctly to backend query builder.` },
      { test: /save job not working|bookmark job|saved jobs|wishlist/, reply: `Save/bookmark job issue - User: re-login and refresh Saved Jobs. Dev: verify save/unsave API, user-job mapping, and optimistic update rollback.` },

      { test: /messages not sending|message failed|cannot send message/, reply: `Messages not sending - User: check login state and connectivity, then reload. Dev: inspect message endpoint, auth headers, and socket/server timeout logs.` },
      { test: /chat not opening|chat crash|chat ui not opening/, reply: `Chat not opening - User: re-login and open from Messages page. Dev: add null checks for conversation/job and validate route params before render.` },
      { test: /undefined id|invalid id/, reply: `Undefined id error - User: refresh and share exact URL/steps. Dev: validate route params/DB ids and show fallback UI when id is missing.` },
      { test: /socket connection failed|socket disconnected|socket/, reply: `Socket connection failed - User: check internet/firewall and reload. Dev: review Socket.IO CORS/upgrades and reconnect settings (pingTimeout/pingInterval).` },

      { test: /api not responding|network error|request failed|cors/, reply: `API/network issue - User: retry later and check proxy/network settings. Dev: verify API health, firewall/load balancer rules, CORS config, and monitoring.` },
      { test: /500|internal server error/, reply: `500 server error - User: retry later and report action/time. Dev: inspect stack traces, add input validation/sanitization, and improve API error responses.` },
      { test: /slow loading|slow page|slow api|performance/, reply: `Slow loading - User: test another network and clear cache. Dev: profile DB/API latency, add caching/pagination, and optimize heavy queries/assets.` },

      { test: /profile not updating|profile changes not saved/, reply: `Profile not updating - User: fill required fields and confirm save success. Dev: verify payload mapping, endpoint validation, and surfaced field errors.` },
      { test: /image upload failed|profile image upload|photo upload failed/, reply: `Image upload failed - User: use JPG/PNG and smaller image size. Dev: validate storage keys/config and enforce image validation with clear errors.` },
      { test: /missing required fields|required fields/, reply: `Missing required fields - User: complete all fields marked with *. Dev: align frontend and backend validation and return structured field-level errors.` },

      { test: /404|page not found/, reply: `404 page not found - User: verify URL and navigate from homepage/menu. Dev: add friendly 404 page, log broken links, and verify router configuration.` },
      { test: /wrong redirects|redirecting wrong page|redirect issue/, reply: `Wrong redirects - User: report source link and destination page. Dev: review route guards and redirect rules to prevent incorrect navigation.` },
      { test: /button not working|nav button not working|action button/, reply: `Button not working - User: refresh and retry in another browser. Dev: inspect JS errors, event bindings, and accessibility role/button semantics.` },

      { test: /language not changing|language selection/, reply: `Language not changing - User: change language then refresh and clear cache. Dev: verify i18n init, language persistence, and loaded translation bundles.` },
      { test: /mixed language|wrong language ui/, reply: `Mixed language UI - User: refresh and report affected pages. Dev: replace hard-coded strings with i18n keys and confirm fallback locale behavior.` },
      { test: /notifications not showing|notification missing/, reply: `Notifications not showing - User: check notification settings and refresh Notifications page. Dev: verify notification creation pipeline and socket/background dispatch.` },
      { test: /wrong unread count|unread count incorrect/, reply: `Wrong unread count - User: open Notifications to sync status and refresh. Dev: validate mark-read endpoint, client state updates, and server reconciliation.` },
      { test: /email notifications not received|notification email not received/, reply: `Email notifications not received - User: check spam and whitelist sender email. Dev: verify SMTP credentials/sender reputation and queue retry processing.` },
      { test: /contact form not submitting|contact us not working|contact form/, reply: `Contact form not submitting - User: fill required fields and disable ad blockers before retry. Dev: validate payload, anti-spam rules, and email/log persistence flow.` },
      { test: /admin dashboard stats are wrong|dashboard data mismatch|analytics mismatch/, reply: `Admin dashboard data mismatch - User: refresh and compare with detailed pages. Dev: verify aggregation queries/date range/timezone and refresh stale cached metrics.` }
    ];

    for (const itm of canned) {
      if (itm.test.test(lower)) {
        replySource = 'Canned';
        console.log(`AI Success - ${replySource} | Website: true`);
        return res.status(200).json({ reply: itm.reply });
      }
    }

    if (geminiAttempted && geminiLastError && isWebsiteIssue) {
      replySource = 'GeminiError-Website';
      return res.status(200).json({
        reply: `AI service temporarily unavailable: ${geminiLastError}. Try again soon or contact support.`
      });
    }

    if (geminiAttempted && geminiLastError && !isWebsiteIssue) {
      replySource = 'Fallback';
      console.log(`AI Fallback - ${replySource} | Error: ${geminiLastError.slice(0,50)}`);
      return res.status(200).json({
        reply: generalFallbackReply(message)
      });
    }

    replySource = 'Default';
    console.log(`AI Default - ${replySource}`);
    return res.status(200).json({ reply: "I'm ready for any question! Try 'pasta recipe', 'workout plan', 'fix login error', or anything else." });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ reply: 'Chat service busy. Try again in a moment!' });
  }
};

module.exports = { chat };

