import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ========== SUPABASE CONFIG ==========
// ⚠️ 以下の値をSupabaseの設定情報に書き換えてください
const SUPABASE_URL = "https://fdpujjudmnqlzrfcewll.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcHVqanVkbW5xbHpyZmNld2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTYxMzIsImV4cCI6MjA5Mzc5MjEzMn0.8WxFY14THw5I87b7BK0C6MmUAsG1aPDFfL50CPxILhI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DEFAULT STATE ==========
const defaultQuestions = () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i,
    text: "",
    answer: null,
    is_open: false,
    is_closed: false,
  }));

const defaultQuizState = () => ({
  questions: defaultQuestions(),
  current_q: -1,
  phase: "waiting",
  ranking_index: -1,
});

// ========== STYLES ==========
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Noto+Serif+JP:wght@300;400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body { font-family: 'Noto Serif JP', serif; background: #140f05; color: #f5ead0; min-height: 100vh; }
    :root {
      --gold: #c9a84c; --gold-l: #e8c97a; --gold-d: #8b6914;
      --cream: #f5ead0; --bg: #140f05; --bg2: #1e1508; --bg3: #281c0c;
      --yes: #4caf50; --no: #c94c4c;
    }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
    @keyframes confetti { 0%{transform:translateY(-60px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
    @keyframes slideIn { from{opacity:0;transform:translateY(40px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }

    .fade { animation: fadeUp .5s ease both; }
    .gold { background: linear-gradient(90deg,var(--gold-d),var(--gold-l),var(--gold),var(--gold-l),var(--gold-d)); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
    .card { background: linear-gradient(135deg,var(--bg2),var(--bg3)); border:1px solid var(--gold-d); border-radius:16px; box-shadow:0 4px 32px rgba(0,0,0,.6),inset 0 1px 0 rgba(201,168,76,.15); }
    .divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,var(--gold-d),transparent); margin:20px 0; }
    .btn { cursor:pointer; border:none; border-radius:8px; font-family:inherit; font-size:1rem; padding:12px 24px; transition:all .2s; }
    .btn-gold { background:linear-gradient(135deg,var(--gold-d),var(--gold),var(--gold-l)); color:#140f05; font-weight:600; }
    .btn-gold:hover { filter:brightness(1.1); transform:translateY(-1px); }
    .btn-gold:disabled { opacity:.35; cursor:not-allowed; transform:none; filter:none; }
    .btn-outline { background:transparent; border:1px solid var(--gold-d); color:var(--gold); }
    .btn-outline:hover { background:rgba(201,168,76,.1); }
    .btn-yes { background:linear-gradient(135deg,#2a7a2a,#4caf50); color:#fff; font-size:1.2rem; font-weight:700; width:110px; height:110px; border-radius:16px; border:none; cursor:pointer; transition:all .2s; font-family:inherit; }
    .btn-yes:hover:not(:disabled) { filter:brightness(1.15); transform:scale(1.04); }
    .btn-no { background:linear-gradient(135deg,#7a2a2a,#c94c4c); color:#fff; font-size:1.2rem; font-weight:700; width:110px; height:110px; border-radius:16px; border:none; cursor:pointer; transition:all .2s; font-family:inherit; }
    .btn-no:hover:not(:disabled) { filter:brightness(1.15); transform:scale(1.04); }
    .sel-yes { outline:3px solid #4caf50; outline-offset:4px; }
    .sel-no { outline:3px solid #c94c4c; outline-offset:4px; }
    input[type=text],input[type=password],textarea { background:rgba(255,255,255,.05); border:1px solid var(--gold-d); border-radius:8px; color:var(--cream); font-family:inherit; font-size:.95rem; padding:10px 14px; width:100%; outline:none; transition:border-color .2s; resize:vertical; }
    input:focus,textarea:focus { border-color:var(--gold); }
    input::placeholder,textarea::placeholder { color:rgba(245,234,208,.3); }
  `}</style>
);

const Ornament = () => <div style={{ textAlign:"center", color:"var(--gold)", letterSpacing:".6rem", margin:"8px 0", fontSize:".9rem" }}>✦ ✦ ✦</div>;

const Confetti = () => (
  <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:999 }}>
    {Array.from({length:30},(_,i)=>({
      left:Math.random()*100, delay:Math.random()*2, dur:2.5+Math.random()*2,
      color:["var(--gold)","var(--gold-l)","#fff","#f9c6d0","#ffd700"][i%5], size:5+Math.random()*10,
    })).map((p,i)=>(
      <div key={i} style={{ position:"absolute", left:`${p.left}%`, top:-20, width:p.size, height:p.size,
        borderRadius:"2px", background:p.color, animation:`confetti ${p.dur}s ${p.delay}s linear infinite` }} />
    ))}
  </div>
);

const ProgressBar = ({ current, total=10 }) => (
  <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:16 }}>
    {Array.from({length:total},(_,i)=>(
      <div key={i} style={{ width:22, height:4, borderRadius:2, transition:"background .4s",
        background: i < current ? "var(--gold)" : i===current ? "var(--gold-l)" : "rgba(201,168,76,.2)" }} />
    ))}
  </div>
);

// =============================================
// PARTICIPANT SCREENS
// =============================================

function WelcomeScreen({ onJoin, onHost }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeUp .8s ease" }}>
      <div style={{ fontSize:"2.5rem", marginBottom:12, animation:"pulse 2s ease infinite" }}>💍</div>
      <h1 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"clamp(2.2rem,8vw,3.5rem)", fontWeight:300, letterSpacing:".1em", textAlign:"center" }}>
        Wedding Quiz
      </h1>
      <p style={{ color:"rgba(245,234,208,.55)", fontSize:".85rem", marginTop:8, letterSpacing:".2em" }}>ふたりのことを、どれだけ知っていますか？</p>
      <Ornament />
      <div style={{ display:"flex", flexDirection:"column", gap:14, width:"100%", maxWidth:300, marginTop:8 }}>
        <button className="btn btn-gold" style={{ fontSize:"1.05rem", padding:16 }} onClick={onJoin}>Yes/No クイズに参加する</button>
        <button className="btn btn-outline" style={{ fontSize:".8rem" }} onClick={onHost}>進行者はこちら</button>
      </div>
    </div>
  );
}

function JoinScreen({ onEnter }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const t = name.trim();
    if (!t) { setErr("ニックネームを入力してください"); return; }
    if (t.length > 16) { setErr("16文字以内でお願いします"); return; }
    setLoading(true);
    // Check duplicate
    const { data } = await supabase.from("participants").select("nickname").eq("nickname", t).single();
    if (data) { setErr("このニックネームはすでに使われています"); setLoading(false); return; }
    // Register
    await supabase.from("participants").insert({ nickname: t, answers: Array(10).fill(null), score: 0 });
    setLoading(false);
    onEnter(t);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:360, width:"100%", padding:"40px 32px", textAlign:"center" }}>
        <div style={{ fontSize:"2rem" }}>💍</div>
        <h2 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"1.9rem", fontWeight:300, marginTop:10 }}>参加登録</h2>
        <div className="divider" />
        <p style={{ fontSize:".88rem", color:"rgba(245,234,208,.6)", marginBottom:18, lineHeight:1.9 }}>ランキングに表示される<br/>ニックネームを入力してください</p>
        <input type="text" placeholder="例: たろうくん" value={name} maxLength={16}
          onChange={e=>{setName(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&submit()} />
        {err && <p style={{ color:"#e87070", fontSize:".78rem", marginTop:6 }}>{err}</p>}
        <button className="btn btn-gold" style={{ width:"100%", marginTop:14, fontSize:"1rem" }} onClick={submit} disabled={loading}>
          {loading ? "登録中…" : "参加する ✦"}
        </button>
      </div>
    </div>
  );
}

function WaitingScreen({ nickname }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:360, width:"100%", padding:"40px 32px", textAlign:"center" }}>
        <div style={{ fontSize:"1.8rem" }}>💍</div>
        <h2 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"1.8rem", fontWeight:300, marginTop:10 }}>{nickname} さん</h2>
        <div className="divider" />
        <p style={{ color:"rgba(245,234,208,.65)", lineHeight:2.2, fontSize:".92rem" }}>クイズの開始を<br/>お待ちください 🎉</p>
        <div style={{ display:"flex", justifyContent:"center", gap:10, marginTop:24 }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"var(--gold)", animation:`pulse 1.4s ${i*.35}s ease infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizScreen({ question, qNum, myAnswer, onAnswer }) {
  const [selected, setSelected] = useState(myAnswer);
  function choose(val) { setSelected(val); onAnswer(val); }
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:440, width:"100%", padding:"36px 28px", textAlign:"center" }}>
        <ProgressBar current={qNum-1} />
        <p style={{ fontSize:".72rem", color:"var(--gold)", letterSpacing:".2em", marginBottom:10 }}>QUESTION {qNum} / 10</p>
        <div className="divider" />
        <p style={{ fontSize:"clamp(.95rem,3.5vw,1.15rem)", lineHeight:2, margin:"24px 0 32px", fontFamily:"'Noto Serif JP'" }}>
          {question.text}
        </p>
        <div style={{ display:"flex", gap:20, justifyContent:"center" }}>
          <button className={`btn-yes ${selected===true?"sel-yes":""}`} onClick={()=>choose(true)}>Yes</button>
          <button className={`btn-no ${selected===false?"sel-no":""}`} onClick={()=>choose(false)}>No</button>
        </div>
        {selected !== null && (
          <p style={{ marginTop:20, color:"var(--gold)", fontSize:".82rem", animation:"fadeUp .4s ease" }}>
            ✓ 回答しました — 変更できます
          </p>
        )}
      </div>
    </div>
  );
}

function AnswerRevealScreen({ question, myAnswer }) {
  const correct = question.answer;
  const isCorrect = myAnswer === correct;
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:440, width:"100%", padding:"36px 28px", textAlign:"center" }}>
        <p style={{ fontSize:".72rem", color:"var(--gold)", letterSpacing:".2em", marginBottom:16 }}>正解発表</p>
        <div className="divider" />
        <p style={{ fontSize:"clamp(.95rem,3.5vw,1.1rem)", lineHeight:2, margin:"20px 0", fontFamily:"'Noto Serif JP'", color:"rgba(245,234,208,.7)" }}>
          {question.text}
        </p>
        <div style={{ fontSize:"5rem", margin:"16px 0", animation:"slideIn .5s ease" }}>
          {correct === true ? "Yes" : "No"}
        </div>
        <div style={{ padding:"14px", borderRadius:12,
          background: isCorrect ? "rgba(201,168,76,.12)" : "rgba(201,76,76,.1)",
          border: `1px solid ${isCorrect ? "var(--gold-d)" : "rgba(201,76,76,.3)"}`, marginTop:8 }}>
          <p style={{ fontSize:"1rem", color: isCorrect ? "var(--gold-l)" : "#e87070" }}>
            {isCorrect ? "🎉 正解！" : "😢 不正解…"}
          </p>
          <p style={{ fontSize:".78rem", color:"rgba(245,234,208,.45)", marginTop:4 }}>
            あなたの回答: {myAnswer === true ? "Yes" : myAnswer === false ? "No" : "未回答"}
          </p>
        </div>
        <p style={{ marginTop:20, fontSize:".8rem", color:"rgba(245,234,208,.4)" }}>次の問題をお待ちください…</p>
      </div>
    </div>
  );
}

function ParticipantResultScreen({ nickname, score }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:400, width:"100%", padding:"40px 28px", textAlign:"center" }}>
        <div style={{ fontSize:"2.5rem" }}>🎊</div>
        <h2 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"2rem", fontWeight:300, marginTop:10 }}>クイズ終了！</h2>
        <div className="divider" />
        <p style={{ color:"rgba(245,234,208,.6)", fontSize:".88rem" }}>{nickname} さんの結果</p>
        <div style={{ margin:"20px 0", background:"rgba(201,168,76,.08)", borderRadius:12, padding:"24px 16px" }}>
          <div className="gold" style={{ fontFamily:"'Noto Serif JP'", fontSize:"4.5rem", fontWeight:600, lineHeight:1, letterSpacing:".05em" }}>
            {score}<span style={{ fontSize:"1.4rem" }}>点</span>
          </div>
          <p style={{ fontSize:".78rem", color:"rgba(245,234,208,.45)", marginTop:6 }}>10問中 {score}問正解</p>
        </div>
        <p style={{ fontSize:".88rem", color:"rgba(245,234,208,.6)", lineHeight:2 }}>ランキング発表をお待ちください 🏆</p>
        <Ornament />
        <p style={{ fontSize:".75rem", color:"rgba(245,234,208,.35)" }}>ありがとうございました 💕</p>
      </div>
    </div>
  );
}

// =============================================
// HOST SCREENS
// =============================================
const HOST_PW = "keitaro2026";

function HostLogin({ onLogin }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  function login() { if(pw===HOST_PW) onLogin(); else setErr("パスワードが違います"); }
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:340, width:"100%", padding:"40px 28px", textAlign:"center" }}>
        <h2 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"1.8rem", fontWeight:300 }}>進行者ログイン</h2>
        <div className="divider" />
        <input type="password" placeholder="パスワード" value={pw}
          onChange={e=>{setPw(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&login()} style={{ marginBottom:8 }} />
        {err && <p style={{ color:"#e87070", fontSize:".78rem", marginBottom:6 }}>{err}</p>}
        <button className="btn btn-gold" style={{ width:"100%", marginTop:6 }} onClick={login}>ログイン</button>
        <p style={{ marginTop:16, fontSize:".68rem", color:"rgba(245,234,208,.25)" }}>初期PW: keitaro2026</p>
      </div>
    </div>
  );
}

function SetupTab({ quizState }) {
  const [texts, setTexts] = useState(quizState.questions.map(q=>q.text));
  const [saved, setSaved] = useState(false);

  async function save() {
    const questions = quizState.questions.map((q,i)=>({...q, text:texts[i]}));
    await supabase.from("quiz_state").update({ questions }).eq("id", 1);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(201,168,76,.07)", border:"1px solid rgba(139,105,20,.4)", fontSize:".82rem", color:"rgba(245,234,208,.65)", lineHeight:1.9 }}>
        📝 事前に問題文を入力しておきましょう。<br/>
        <strong style={{ color:"var(--gold)" }}>正解（YesかNo）は当日、新郎新婦の答えを聞いてから</strong>「② 当日進行」タブで入力します。
      </div>
      {texts.map((t,i)=>(
        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ color:"var(--gold)", fontFamily:"'Cormorant Garamond'", fontSize:"1.1rem", paddingTop:10, minWidth:30 }}>Q{i+1}</span>
          <textarea rows={2} placeholder={`第${i+1}問の問題文を入力…`} value={t}
            onChange={e=>{const a=[...texts];a[i]=e.target.value;setTexts(a);}} />
        </div>
      ))}
      <button className="btn btn-gold" style={{ marginTop:8 }} onClick={save}>
        {saved ? "✓ 保存しました！" : "💾 保存する"}
      </button>
    </div>
  );
}

function LiveTab({ quizState, participants }) {
  const { questions, current_q, phase, ranking_index } = quizState;
  const [liveAnswer, setLiveAnswer] = useState(null);
  const closedCount = questions.filter(q=>q.is_closed).length;
  const ranked = [...participants].sort((a,b)=>(b.score||0)-(a.score||0));

  async function updateQuizState(updates) {
    await supabase.from("quiz_state").update(updates).eq("id", 1);
  }

  async function startQuestion(idx) {
    const qs = questions.map((q,i)=> i===idx ? {...q, is_open:true, is_closed:false, answer:null} : q);
    setLiveAnswer(null);
    await updateQuizState({ questions:qs, current_q:idx, phase:"open" });
  }

  async function closeAndScore() {
    if (liveAnswer === null) { alert("正解（YesかNo）を選択してください"); return; }
    const qs = questions.map((q,i)=> i===current_q ? {...q, is_open:false, is_closed:true, answer:liveAnswer} : q);
    // Score participants
    for (const p of participants) {
      const given = p.answers?.[current_q] ?? null;
      const newScore = (p.score||0) + (given === liveAnswer ? 1 : 0);
      await supabase.from("participants").update({ score: newScore }).eq("nickname", p.nickname);
    }
    const isLast = current_q === 9;
    await updateQuizState({ questions:qs, phase: isLast ? "finished" : "revealing", current_q: isLast ? 10 : current_q });
    setLiveAnswer(null);
    if (!isLast) setTimeout(() => updateQuizState({ phase:"waiting" }), 4000);
  }

  async function startRanking() { await updateQuizState({ ranking_index: 0 }); }
  async function nextRank() { await updateQuizState({ ranking_index: (ranking_index||0) + 1 }); }

  async function resetAll() {
    if (!confirm("全データをリセットしますか？")) return;
    const fresh = defaultQuizState();
    fresh.questions = fresh.questions.map((q,i)=>({...q, text:questions[i]?.text||""}));
    await supabase.from("quiz_state").update(fresh).eq("id", 1);
    await supabase.from("participants").delete().neq("nickname", "");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Status */}
      <div style={{ padding:"12px 18px", borderRadius:10, border:"1px solid var(--gold-d)",
        background: phase==="open" ? "rgba(201,168,76,.12)" : "rgba(255,255,255,.03)",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <span style={{ fontSize:".85rem", color:"var(--gold)" }}>
          {phase==="waiting" && current_q<0 && "⏳ クイズ開始前"}
          {phase==="waiting" && current_q>=0 && current_q<10 && `✅ 第${current_q+1}問 終了 — 次の問題を出題してください`}
          {phase==="open" && `📢 第${current_q+1}問 回答受付中`}
          {phase==="revealing" && `🔍 第${current_q+1}問 正解発表中`}
          {phase==="finished" && "🏆 全問終了！ランキングを発表してください"}
        </span>
        <span style={{ fontSize:".78rem", color:"rgba(245,234,208,.45)" }}>参加者 {participants.length}人</span>
      </div>

      {/* Question control */}
      {phase !== "finished" && (
        <div className="card" style={{ padding:"20px" }}>
          {phase === "open" && current_q >= 0 ? (
            <>
              <p style={{ fontSize:".7rem", color:"var(--gold)", letterSpacing:".15em", marginBottom:10 }}>第{current_q+1}問 — 回答受付中</p>
              <p style={{ fontSize:"1rem", lineHeight:1.9, marginBottom:20, color:"var(--cream)", fontFamily:"'Noto Serif JP'" }}>{questions[current_q]?.text}</p>
              <div style={{ padding:"14px 16px", borderRadius:10, background:"rgba(201,168,76,.06)", border:"1px solid rgba(139,105,20,.5)", marginBottom:16 }}>
                <p style={{ fontSize:".82rem", color:"rgba(245,234,208,.7)", marginBottom:12 }}>🎤 新郎新婦の答えを聞いて、正解を入力：</p>
                <div style={{ display:"flex", gap:14, justifyContent:"center" }}>
                  <button className={`btn-yes ${liveAnswer===true?"sel-yes":""}`} style={{ opacity:liveAnswer===false?.45:1 }} onClick={()=>setLiveAnswer(true)}>Yes</button>
                  <button className={`btn-no ${liveAnswer===false?"sel-no":""}`} style={{ opacity:liveAnswer===true?.45:1 }} onClick={()=>setLiveAnswer(false)}>No</button>
                </div>
              </div>
              <button className="btn btn-gold" style={{ width:"100%" }} onClick={closeAndScore} disabled={liveAnswer===null}>
                ✓ 正解確定・回答を締め切る
              </button>
            </>
          ) : phase === "revealing" ? (
            <p style={{ textAlign:"center", color:"var(--gold)", fontSize:".9rem", padding:"20px 0" }}>🔍 正解発表中… 4秒後に自動で次へ進みます</p>
          ) : (
            <>
              <p style={{ fontSize:".82rem", color:"rgba(245,234,208,.6)", marginBottom:16 }}>出題する問題を選んでください：</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {questions.map((q,i)=>{
                  const done = q.is_closed;
                  const canStart = !!q.text?.trim();
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, opacity:done?.45:1 }}>
                      <span style={{ color:done?"var(--gold)":"rgba(245,234,208,.35)", minWidth:28, fontSize:".85rem" }}>{done?"✓":`Q${i+1}`}</span>
                      <span style={{ flex:1, fontSize:".87rem", color:q.text?"var(--cream)":"rgba(245,234,208,.28)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {q.text||"（問題文未設定）"}
                      </span>
                      {!done && (
                        <button className={`btn ${canStart?"btn-gold":"btn-outline"}`}
                          style={{ fontSize:".75rem", padding:"6px 14px", whiteSpace:"nowrap" }}
                          onClick={()=>canStart&&startQuestion(i)} disabled={!canStart}>
                          {canStart?"▶ 出題":"未設定"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Ranking control */}
      {phase === "finished" && (
        <div className="card" style={{ padding:"20px", textAlign:"center" }}>
          <p style={{ fontSize:".88rem", color:"rgba(245,234,208,.7)", marginBottom:16, lineHeight:1.8 }}>
            投影画面でランキングカウントダウンを開始します。<br/>ボタンを押すたびに1人ずつ発表されます。
          </p>
          {(ranking_index ?? -1) < 0 ? (
            <button className="btn btn-gold" style={{ width:"100%" }} onClick={startRanking}>🏆 ランキング発表を開始する</button>
          ) : (
            <button className="btn btn-gold" style={{ width:"100%" }} onClick={nextRank}
              disabled={(ranking_index||0) >= Math.min(ranked.length, 20)}>
              {(ranking_index||0) >= Math.min(ranked.length,20) ? "✓ 発表完了" : `▶ 次の順位を発表 (残り${Math.min(ranked.length,20)-(ranking_index||0)}人)`}
            </button>
          )}
        </div>
      )}

      {/* Ranking */}
      <div className="card" style={{ padding:"20px" }}>
        <h3 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"1.3rem", fontWeight:300, marginBottom:16 }}>
          🏆 ランキング {closedCount > 0 && <span style={{ fontSize:".75rem", WebkitTextFillColor:"rgba(245,234,208,.4)", background:"none", animation:"none" }}>（{closedCount}問終了時点）</span>}
        </h3>
        {ranked.length === 0 ? (
          <p style={{ color:"rgba(245,234,208,.3)", fontSize:".85rem" }}>まだ参加者がいません</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {ranked.map((p,i)=>(
              <div key={p.nickname} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px", borderRadius:8,
                background:i<3?"rgba(201,168,76,.08)":"transparent", border:i<3?"1px solid rgba(201,168,76,.18)":"1px solid transparent" }}>
                <span style={{ minWidth:32, fontSize:".95rem", color:i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":"rgba(245,234,208,.35)" }}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}位`}
                </span>
                <span style={{ flex:1, fontSize:".92rem" }}>{p.nickname}</span>
                <span style={{ color:"var(--gold)", fontFamily:"'Cormorant Garamond'", fontSize:"1.15rem" }}>
                  {p.score||0}<span style={{ fontSize:".68rem", color:"rgba(245,234,208,.35)", marginLeft:3 }}>/ {closedCount}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="btn btn-outline" style={{ fontSize:".75rem", color:"rgba(245,234,208,.35)", borderColor:"rgba(245,234,208,.12)" }} onClick={resetAll}>
        ⚠ 全データをリセット
      </button>
    </div>
  );
}

function HostPanel({ quizState, participants }) {
  const [tab, setTab] = useState("setup");
  return (
    <div style={{ maxWidth:680, margin:"0 auto", padding:"24px 16px 48px" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
        <h1 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"1.8rem", fontWeight:300 }}>🎩 進行者パネル</h1>
      </div>
      <div style={{ display:"flex", marginBottom:24, border:"1px solid var(--gold-d)", borderRadius:10, overflow:"hidden" }}>
        {[["setup","① 事前設定"],["live","② 当日進行"]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ flex:1, cursor:"pointer", border:"none",
            padding:"12px 0", fontFamily:"inherit", fontSize:".88rem", transition:"all .2s",
            background:tab===key?"linear-gradient(135deg,var(--gold-d),var(--gold))":"transparent",
            color:tab===key?"#140f05":"var(--gold)", fontWeight:tab===key?600:400 }}>
            {label}
          </button>
        ))}
      </div>
      {tab==="setup" ? <SetupTab quizState={quizState} /> : <LiveTab quizState={quizState} participants={participants} />}
    </div>
  );
}

// =============================================
// PROJECTION SCREEN
// =============================================
function ProjectionScreen({ quizState, participants }) {
  const { questions, current_q, phase, ranking_index } = quizState;
  const ranked = [...participants].sort((a,b)=>(b.score||0)-(a.score||0));

  if (phase === "finished" && (ranking_index ?? -1) >= 0) {
    const totalToShow = Math.min(ranked.length, 20);
    const shownCount = ranking_index || 0;
    // 20位〜(20-shownCount+1)位までを表示（逆順：下位から上位へ）
    const displayEntries = ranked.slice(0, totalToShow).reverse().slice(0, shownCount);
    return (
      <div style={{ minHeight:"100vh", background:"#0a0700", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40 }}>
        {shownCount >= totalToShow && <Confetti />}
        <h2 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:300, marginBottom:40, letterSpacing:".15em" }}>
          🏆 ランキング発表
        </h2>
        <div style={{ width:"100%", maxWidth:700, display:"flex", flexDirection:"column", gap:12 }}>
          {displayEntries.map((entry, i) => {
            const actualRank = ranked.indexOf(entry) + 1;
            return (
              <div key={entry.nickname} style={{ display:"flex", alignItems:"center", gap:20, padding:"16px 28px", borderRadius:12,
                animation:"slideIn .6s ease both",
                background: actualRank===1?"rgba(255,215,0,.15)":actualRank<=3?"rgba(201,168,76,.1)":"rgba(255,255,255,.04)",
                border: actualRank===1?"1px solid gold":actualRank<=3?"1px solid var(--gold-d)":"1px solid rgba(201,168,76,.2)" }}>
                <span style={{ fontSize:"clamp(1.5rem,4vw,2.5rem)", minWidth:60, textAlign:"center",
                  color:actualRank===1?"#ffd700":actualRank===2?"#c0c0c0":actualRank===3?"#cd7f32":"rgba(245,234,208,.5)" }}>
                  {actualRank===1?"🥇":actualRank===2?"🥈":actualRank===3?"🥉":`${actualRank}位`}
                </span>
                <span style={{ flex:1, fontSize:"clamp(1.2rem,3.5vw,2rem)", fontFamily:"'Noto Serif JP'" }}>{entry.nickname}</span>
                <span className="gold" style={{ fontFamily:"'Noto Serif JP'", fontSize:"clamp(1.5rem,4vw,2.5rem)", fontWeight:600 }}>
                  {entry.score||0}<span style={{ fontSize:".6em" }}>点</span>
                </span>
              </div>
            );
          })}
        </div>
        {shownCount === 0 && <p style={{ color:"rgba(245,234,208,.4)", fontSize:"1rem", marginTop:20 }}>進行者がボタンを押すと発表が始まります</p>}
      </div>
    );
  }

  if (phase === "waiting" || current_q < 0) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0a0700" }}>
        <div style={{ fontSize:"4rem", marginBottom:20, animation:"pulse 2s ease infinite" }}>💍</div>
        <h1 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"clamp(3rem,8vw,6rem)", fontWeight:300, letterSpacing:".15em" }}>Wedding Quiz</h1>
        <p style={{ color:"rgba(245,234,208,.4)", fontSize:"1.1rem", marginTop:16, letterSpacing:".3em" }}>ふたりのことを、どれだけ知っていますか？</p>
        {current_q >= 0 && <p style={{ color:"var(--gold)", fontSize:"1rem", marginTop:40, letterSpacing:".2em" }}>次の問題をお待ちください…</p>}
      </div>
    );
  }

  const q = questions[current_q];
  if (!q) return null;

  if (phase === "revealing") {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0a0700", padding:40, textAlign:"center" }}>
        <p style={{ fontSize:"1rem", color:"var(--gold)", letterSpacing:".2em", marginBottom:20 }}>QUESTION {current_q+1} / 10 — 正解発表</p>
        <p style={{ fontSize:"clamp(1.2rem,3vw,2rem)", color:"rgba(245,234,208,.8)", lineHeight:1.8, maxWidth:800, marginBottom:40, fontFamily:"'Noto Serif JP'" }}>{q.text}</p>
        <div style={{ fontSize:"clamp(6rem,20vw,12rem)", animation:"slideIn .5s ease", color: q.answer?"var(--yes)":"var(--no)" }}>
          {q.answer === true ? "Yes" : "No"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0a0700", padding:40, textAlign:"center" }}>
      <ProgressBar current={current_q} />
      <p style={{ fontSize:"1rem", color:"var(--gold)", letterSpacing:".2em", marginBottom:20 }}>QUESTION {current_q+1} / 10</p>
      <p style={{ fontSize:"clamp(1.5rem,4vw,2.8rem)", color:"var(--cream)", lineHeight:1.8, maxWidth:900, fontFamily:"'Noto Serif JP'", animation:"fadeUp .6s ease" }}>{q.text}</p>
      <div style={{ display:"flex", gap:60, marginTop:60, fontSize:"clamp(4rem,12vw,8rem)", color:"rgba(245,234,208,.2)" }}>
        <span>Yes</span><span>No</span>
      </div>
      <p style={{ marginTop:40, color:"rgba(245,234,208,.4)", fontSize:"1rem", letterSpacing:".2em", animation:"pulse 1.5s ease infinite" }}>スマホで回答してください</p>
    </div>
  );
}

// =============================================
// MAIN
// =============================================
export default function App() {
  const [view, setView] = useState("welcome");
  const [nickname, setNickname] = useState("");
  const [quizState, setQuizState] = useState(defaultQuizState());
  const [participants, setParticipants] = useState([]);
  const [myAnswers, setMyAnswers] = useState(Array(10).fill(null));
  const isProjection = new URLSearchParams(window.location.search).get("mode") === "projection";

  // Initialize quiz_state if not exists
  useEffect(() => {
    async function init() {
      const { data } = await supabase.from("quiz_state").select("*").eq("id", 1).single();
      if (!data) {
        await supabase.from("quiz_state").insert({ id: 1, ...defaultQuizState() });
      } else {
        setQuizState(data);
      }
    }
    init();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const qzChannel = supabase.channel("quiz_state_changes")
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"quiz_state" }, payload => {
        setQuizState(payload.new);
      }).subscribe();

    const ptChannel = supabase.channel("participants_changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"participants" }, async () => {
        const { data } = await supabase.from("participants").select("*");
        setParticipants(data || []);
      }).subscribe();

    // Initial load of participants
    supabase.from("participants").select("*").then(({ data }) => setParticipants(data || []));

    return () => { supabase.removeChannel(qzChannel); supabase.removeChannel(ptChannel); };
  }, []);

  async function submitAnswer(qIdx, val) {
    const newAnswers = [...myAnswers];
    newAnswers[qIdx] = val;
    setMyAnswers(newAnswers);
    await supabase.from("participants").update({ answers: newAnswers }).eq("nickname", nickname);
  }

  if (isProjection) return <><Styles /><ProjectionScreen quizState={quizState} participants={participants} /></>;
  if (view === "host-login") return <><Styles /><HostLogin onLogin={()=>setView("host")} /></>;
  if (view === "host") return <><Styles /><HostPanel quizState={quizState} participants={participants} /></>;

  if (view === "participant") {
    const { phase, current_q, questions } = quizState;
    if (phase === "finished") {
      const me = participants.find(p=>p.nickname===nickname);
      return <><Styles /><ParticipantResultScreen nickname={nickname} score={me?.score||0} /></>;
    }
    if ((phase === "open" || phase === "revealing") && current_q >= 0 && current_q < 10) {
      if (phase === "revealing") {
        return <><Styles /><AnswerRevealScreen question={questions[current_q]} myAnswer={myAnswers[current_q]} /></>;
      }
      return <><Styles /><QuizScreen question={questions[current_q]} qNum={current_q+1}
        myAnswer={myAnswers[current_q]} onAnswer={v=>submitAnswer(current_q,v)} /></>;
    }
    return <><Styles /><WaitingScreen nickname={nickname} /></>;
  }

  return (
    <>
      <Styles />
      {view==="welcome" && <WelcomeScreen onJoin={()=>setView("join")} onHost={()=>setView("host-login")} />}
      {view==="join" && <JoinScreen onEnter={name=>{setNickname(name);setView("participant");}} />}
    </>
  );
}
