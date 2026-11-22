"use client";
import { useState, useRef, useEffect } from "react";
import { SOURCES } from "../lib/sources";

const CREATOR = process.env.NEXT_PUBLIC_CREATOR || "Your Name";
const IDEAS = [
  "What commonly causes headaches, and when are they serious?",
  "How much sleep do adults need?",
  "What can I do to lower my blood pressure?",
  "When should a fever worry me?",
];

export default function Home() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const d = await r.json();
      setMsgs([...next, { role: "assistant", content: d.reply || d.error || "Something went wrong. Please try again.", sources: d.sources, emergency: d.emergency }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Couldn't reach the server. Check your connection and try again." }]);
    }
    setBusy(false);
  }

  return (
    <>
      <div className="wm">Made by {CREATOR}</div>
      <main className="wrap">
        <div className="top">
          <div className="brand">Aria<small>AI health guide</small></div>
          <div className="sos-pill">Emergency? Call 911 or your local number</div>
        </div>

        {msgs.length === 0 && (
          <section>
            <h1>Health answers, checked against ten medical sources.</h1>
            <p className="lede">Aria explains symptoms, conditions and healthy habits in plain language. It can't diagnose you or replace a doctor.</p>
            <ul className="idx">
              {SOURCES.map((s) => (<li key={s.domain}><b>{s.name}</b><span>{s.domain}</span></li>))}
            </ul>
            <div className="ideas">
              {IDEAS.map((q) => (<button key={q} onClick={() => send(q)}>{q}</button>))}
            </div>
          </section>
        )}

        <section className="chat" aria-live="polite">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="q">{m.content}</div>
            ) : (
              <div key={i} className="a">
                {m.emergency && <div className="sos">If this may be an emergency, call 911 or your local emergency number now. In the US or Canada you can also call or text 988 for crisis support.</div>}
                {m.content}
                {m.sources?.length > 0 && (
                  <ol className="refs">
                    {m.sources.map((s) => (<li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>))}
                  </ol>
                )}
              </div>
            )
          )}
          {busy && <div className="a"><span className="dots"><span /><span /><span /></span></div>}
          <div ref={end} />
        </section>

        <form onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a health question" maxLength={1000} aria-label="Your health question" />
          <button disabled={busy || !input.trim()}>Ask Aria</button>
        </form>
        <footer>
          For information only, not a substitute for care from a licensed clinician.<br />
          Built by {CREATOR}
        </footer>
      </main>
    </>
  );
}
