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
  trial_question: { text: "", answer: null, is_open: false, is_closed: false },
  current_q: -1,   // -1=waiting, -2=trial中, 0-9=本番問題
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

// 練習問題画面（スコアなし）
function TrialScreen({ question }) {
  const [selectedAns, setSelectedAns] = useState(null);
  const [selectedBet, setSelectedBet] = useState(null);
  const submitted = selectedAns !== null && selectedBet !== null;

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:460, width:"100%", padding:"36px 28px", textAlign:"center" }}>
        <div style={{ display:"inline-block", padding:"4px 16px", borderRadius:20, background:"rgba(100,200,100,.12)",
          border:"1px solid rgba(100,200,100,.3)", marginBottom:16 }}>
          <p style={{ fontSize:".72rem", color:"rgba(100,220,100,.8)", letterSpacing:".15em" }}>🎯 練習問題 — スコアに影響しません</p>
        </div>
        <div className="divider" />
        <p style={{ fontSize:"clamp(.95rem,3.5vw,1.15rem)", lineHeight:2, margin:"20px 0 24px", fontFamily:"'Noto Serif JP'" }}>
          {question.text}
        </p>
        <p style={{ fontSize:".75rem", color:"rgba(245,234,208,.5)", marginBottom:10, letterSpacing:".1em" }}>回答を選んでください</p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", marginBottom:24 }}>
          <button className={`btn-yes ${selectedAns===true?"sel-yes":""}`}
            onClick={()=>setSelectedAns(true)}>Yes</button>
          <button className={`btn-no ${selectedAns===false?"sel-no":""}`}
            onClick={()=>setSelectedAns(false)}>No</button>
        </div>
        <p style={{ fontSize:".75rem", color:"rgba(245,234,208,.5)", marginBottom:10, letterSpacing:".1em" }}>自信度を選んでください（練習なので結果に影響しません）</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          {[1,2,3].map(b => (
            <button key={b} onClick={()=>setSelectedBet(b)} style={{
              width:72, height:72, borderRadius:12, border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:"1.3rem", fontWeight:700, transition:"all .2s",
              background: selectedBet===b ? "linear-gradient(135deg,var(--gold-d),var(--gold),var(--gold-l))" : "rgba(201,168,76,.1)",
              color: selectedBet===b ? "#140f05" : "var(--gold)",
              outline: selectedBet===b ? "3px solid var(--gold)" : "none",
              outlineOffset: 3,
              transform: selectedBet===b ? "scale(1.08)" : "scale(1)",
            }}>{b}点</button>
          ))}
        </div>
        {submitted ? (
          <p style={{ marginTop:20, color:"rgba(100,220,100,.8)", fontSize:".82rem", animation:"fadeUp .4s ease" }}>
            ✓ 練習回答完了！本番もこの調子で！
          </p>
        ) : (
          <p style={{ marginTop:20, color:"rgba(245,234,208,.3)", fontSize:".78rem" }}>
            回答と自信度の両方を選んでください
          </p>
        )}
      </div>
    </div>
  );
}

function QuizScreen({ question, qNum, myAnswer, onAnswer }) {
  const [selectedAns, setSelectedAns] = useState(myAnswer?.answer ?? null);
  const [selectedBet, setSelectedBet] = useState(myAnswer?.bet ?? null);

  function choose(ans, bet) {
    const newAns = ans !== undefined ? ans : selectedAns;
    const newBet = bet !== undefined ? bet : selectedBet;
    if (ans !== undefined) setSelectedAns(ans);
    if (bet !== undefined) setSelectedBet(bet);
    if ((ans !== undefined ? ans : selectedAns) !== null && (bet !== undefined ? bet : selectedBet) !== null) {
      onAnswer(ans !== undefined ? ans : selectedAns, bet !== undefined ? bet : selectedBet);
    }
  }

  const canSubmit = selectedAns !== null && selectedBet !== null;

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:460, width:"100%", padding:"36px 28px", textAlign:"center" }}>
        <ProgressBar current={qNum-1} />
        <p style={{ fontSize:".72rem", color:"var(--gold)", letterSpacing:".2em", marginBottom:10 }}>QUESTION {qNum} / 10</p>
        <div className="divider" />
        <p style={{ fontSize:"clamp(.95rem,3.5vw,1.15rem)", lineHeight:2, margin:"20px 0 24px", fontFamily:"'Noto Serif JP'" }}>
          {question.text}
        </p>

        {/* Yes/No */}
        <p style={{ fontSize:".75rem", color:"rgba(245,234,208,.5)", marginBottom:10, letterSpacing:".1em" }}>回答を選んでください</p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", marginBottom:24 }}>
          <button className={`btn-yes ${selectedAns===true?"sel-yes":""}`} onClick={()=>choose(true, undefined)}>Yes</button>
          <button className={`btn-no ${selectedAns===false?"sel-no":""}`} onClick={()=>choose(false, undefined)}>No</button>
        </div>

        {/* Bet */}
        <p style={{ fontSize:".75rem", color:"rgba(245,234,208,.5)", marginBottom:10, letterSpacing:".1em" }}>自信度を選んでください（正解で＋、不正解で−）</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          {[1,2,3].map(b => (
            <button key={b} onClick={()=>choose(undefined, b)} style={{
              width:72, height:72, borderRadius:12, border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:"1.3rem", fontWeight:700,
              transition:"all .2s",
              background: selectedBet===b
                ? "linear-gradient(135deg,var(--gold-d),var(--gold),var(--gold-l))"
                : "rgba(201,168,76,.1)",
              color: selectedBet===b ? "#140f05" : "var(--gold)",
              outline: selectedBet===b ? "3px solid var(--gold)" : "none",
              outlineOffset: 3,
              transform: selectedBet===b ? "scale(1.08)" : "scale(1)",
            }}>
              {b}点
            </button>
          ))}
        </div>

        {canSubmit ? (
          <p style={{ marginTop:20, color:"var(--gold)", fontSize:".82rem", animation:"fadeUp .4s ease" }}>
            ✓ {selectedAns ? "Yes" : "No"} / {selectedBet}点賭け — 変更できます
          </p>
        ) : (
          <p style={{ marginTop:20, color:"rgba(245,234,208,.3)", fontSize:".78rem" }}>
            回答と自信度の両方を選んでください
          </p>
        )}
      </div>
    </div>
  );
}

function AnswerRevealScreen({ question, myAnswer }) {
  const correct = question.answer;
  const ans = myAnswer?.answer ?? null;
  const bet = myAnswer?.bet ?? null;
  const isCorrect = ans === correct;
  const delta = bet !== null ? (isCorrect ? bet : -bet) : null;

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card fade" style={{ maxWidth:440, width:"100%", padding:"36px 28px", textAlign:"center" }}>
        <p style={{ fontSize:".72rem", color:"var(--gold)", letterSpacing:".2em", marginBottom:16 }}>正解発表</p>
        <div className="divider" />
        <p style={{ fontSize:"clamp(.95rem,3.5vw,1.1rem)", lineHeight:2, margin:"20px 0", fontFamily:"'Noto Serif JP'", color:"rgba(245,234,208,.7)" }}>
          {question.text}
        </p>
        <div style={{ fontSize:"4rem", margin:"12px 0", animation:"slideIn .5s ease" }}>
          {correct === true ? "Yes" : "No"}
        </div>
        <div style={{ padding:"14px", borderRadius:12,
          background: ans === null ? "rgba(255,255,255,.04)" : isCorrect ? "rgba(201,168,76,.12)" : "rgba(201,76,76,.1)",
          border: `1px solid ${ans === null ? "rgba(255,255,255,.1)" : isCorrect ? "var(--gold-d)" : "rgba(201,76,76,.3)"}`, marginTop:8 }}>
          {ans === null ? (
            <p style={{ fontSize:".9rem", color:"rgba(245,234,208,.4)" }}>未回答</p>
          ) : (
            <>
              <p style={{ fontSize:"1.1rem", color: isCorrect ? "var(--gold-l)" : "#e87070", fontWeight:600 }}>
                {isCorrect ? "🎉 正解！" : "😢 不正解…"}
              </p>
              <p style={{ fontSize:".82rem", color:"rgba(245,234,208,.55)", marginTop:6 }}>
                あなたの回答: <strong>{ans ? "Yes" : "No"}</strong> / {bet}点賭け
              </p>
              {delta !== null && (
                <p style={{ fontSize:"1.3rem", fontWeight:700, marginTop:8,
                  color: delta > 0 ? "var(--gold-l)" : "#e87070" }}>
                  {delta > 0 ? `+${delta}点` : `${delta}点`}
                </p>
              )}
            </>
          )}
        </div>
        <p style={{ marginTop:20, fontSize:".8rem", color:"rgba(245,234,208,.4)" }}>次の問題をお待ちください…</p>
      </div>
    </div>
  );
}

function ParticipantResultScreen({ nickname, score, myAnswers, questions }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 16px 48px" }}>
      <div className="card fade" style={{ maxWidth:480, width:"100%", padding:"32px 24px", textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:"2.5rem" }}>🎊</div>
        <h2 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"2rem", fontWeight:300, marginTop:10 }}>クイズ終了！</h2>
        <div className="divider" />
        <p style={{ color:"rgba(245,234,208,.6)", fontSize:".88rem" }}>{nickname} さんの結果</p>
        <div style={{ margin:"16px 0", background:"rgba(201,168,76,.08)", borderRadius:12, padding:"20px 16px" }}>
          <div style={{ fontFamily:"'Noto Serif JP'", fontSize:"4rem", fontWeight:700, lineHeight:1,
            color: score >= 0 ? "var(--gold-l)" : "#e87070" }}>
            {score >= 0 ? `+${score}` : score}<span style={{ fontSize:"1.2rem" }}>点</span>
          </div>
          <p style={{ fontSize:".75rem", color:"rgba(245,234,208,.4)", marginTop:6 }}>合計スコア</p>
        </div>
        <p style={{ fontSize:".88rem", color:"rgba(245,234,208,.6)", lineHeight:2 }}>ランキング発表をお待ちください 🏆</p>
      </div>

      <div style={{ maxWidth:480, width:"100%", display:"flex", flexDirection:"column", gap:10 }}>
        <p style={{ fontSize:".78rem", color:"var(--gold)", letterSpacing:".15em", textAlign:"center", marginBottom:4 }}>各問の結果</p>
        {(questions||[]).map((q, i) => {
          const a = myAnswers?.[i];
          const ans = a?.answer ?? null;
          const bet = a?.bet ?? null;
          const correct = q.answer;
          const isCorrect = ans === correct && correct !== null;
          const delta = (bet !== null && correct !== null) ? (isCorrect ? bet : -bet) : null;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", borderRadius:10,
              background: delta === null ? "rgba(255,255,255,.03)" : delta > 0 ? "rgba(201,168,76,.08)" : "rgba(201,76,76,.08)",
              border: `1px solid ${delta === null ? "rgba(255,255,255,.08)" : delta > 0 ? "rgba(201,168,76,.25)" : "rgba(201,76,76,.25)"}` }}>
              <span style={{ color:"var(--gold)", fontSize:".8rem", minWidth:28 }}>Q{i+1}</span>
              <span style={{ flex:1, fontSize:".78rem", color:"rgba(245,234,208,.6)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {q.text || "—"}
              </span>
              <span style={{ fontSize:".78rem", color:"rgba(245,234,208,.45)", whiteSpace:"nowrap" }}>
                {ans === null ? "未回答" : `${ans ? "Yes" : "No"} / ${bet}pt`}
              </span>
              <span style={{ fontSize:".9rem", fontWeight:700, minWidth:36, textAlign:"right",
                color: delta === null ? "rgba(245,234,208,.3)" : delta > 0 ? "var(--gold-l)" : "#e87070" }}>
                {delta === null ? "—" : delta > 0 ? `+${delta}` : `${delta}`}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ marginTop:24, fontSize:".72rem", color:"rgba(245,234,208,.3)" }}>ありがとうございました 💕</p>
    </div>
  );
}

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
  const [trialText, setTrialText] = useState(quizState.trial_question?.text || "");
  const [saved, setSaved] = useState(false);

  async function save() {
    const questions = quizState.questions.map((q,i)=>({...q, text:texts[i]}));
    const trial_question = { ...(quizState.trial_question||{}), text:trialText };
    await supabase.from("quiz_state").update({ questions, trial_question }).eq("id", 1);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(201,168,76,.07)", border:"1px solid rgba(139,105,20,.4)", fontSize:".82rem", color:"rgba(245,234,208,.65)", lineHeight:1.9 }}>
        📝 事前に問題文を入力しておきましょう。<br/>
        <strong style={{ color:"var(--gold)" }}>正解（YesかNo）は当日、新郎新婦の答えを聞いてから</strong>「② 当日進行」タブで入力します。
      </div>

      {/* 練習問題 */}
      <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(100,200,100,.05)", border:"1px solid rgba(100,200,100,.2)" }}>
        <p style={{ fontSize:".78rem", color:"rgba(100,220,100,.7)", marginBottom:8, letterSpacing:".1em" }}>🎯 練習問題（スコアに影響しません）</p>
        <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ color:"rgba(100,220,100,.7)", fontFamily:"'Cormorant Garamond'", fontSize:"1.1rem", paddingTop:10, minWidth:30 }}>練習</span>
          <textarea rows={2} placeholder="練習問題の問題文を入力…" value={trialText}
            onChange={e=>setTrialText(e.target.value)} />
        </div>
      </div>

      {/* 本番問題 */}
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

  async function startTrialQuestion() {
    const trial = { ...(quizState.trial_question||{}), is_open:true, is_closed:false, answer:null };
    setLiveAnswer(null);
    await updateQuizState({ trial_question:trial, current_q:-2, phase:"trial" });
  }

  async function closeTrialAndReveal() {
    if (liveAnswer === null) { alert("正解（YesかNo）を選択してください"); return; }
    const trial = { ...(quizState.trial_question||{}), is_open:false, is_closed:true, answer:liveAnswer };
    await updateQuizState({ trial_question:trial, phase:"waiting", current_q:-1 });
    setLiveAnswer(null);
  }

  async function startQuestion(idx) {
    const qs = questions.map((q,i)=> i===idx ? {...q, is_open:true, is_closed:false, answer:null} : q);
    setLiveAnswer(null);
    await updateQuizState({ questions:qs, current_q:idx, phase:"open" });
  }

  async function closeAndScore() {
    if (liveAnswer === null) { alert("正解（YesかNo）を選択してください"); return; }
    const qs = questions.map((q,i)=> i===current_q ? {...q, is_open:false, is_closed:true, answer:liveAnswer} : q);
    // Score participants (bet-based)
    for (const p of participants) {
      const answerData = p.answers?.[current_q] ?? null;
      const given = answerData?.answer ?? null;
      const bet = answerData?.bet ?? 1;
      const delta = given === liveAnswer ? bet : -bet;
      const newScore = (p.score||0) + delta;
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
    if (!confirm("全データをリセットしますか？\n\n※問題文・練習問題のテキストは保持されます")) return;
    const resetData = {
      questions: questions.map(q=>({...q, answer:null, is_open:false, is_closed:false})),
      trial_question: {
        text: quizState.trial_question?.text || "",
        answer: null,
        is_open: false,
        is_closed: false,
      },
      current_q: -1,
      phase: "waiting",
      ranking_index: -1,
    };
    await supabase.from("quiz_state").update(resetData).eq("id", 1);
    await supabase.from("participants").delete().neq("nickname", "");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Status */}
      <div style={{ padding:"12px 18px", borderRadius:10, border:"1px solid var(--gold-d)",
        background: phase==="open" ? "rgba(201,168,76,.12)" : "rgba(255,255,255,.03)",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <span style={{ fontSize:".85rem", color:"var(--gold)" }}>
          {phase==="waiting" && current_q===-1 && "⏳ クイズ開始前"}
          {phase==="waiting" && current_q===-2 && "✅ 練習問題 終了"}
          {phase==="waiting" && current_q>=0 && current_q<10 && `✅ 第${current_q+1}問 終了 — 次の問題を出題してください`}
          {phase==="trial" && "🎯 練習問題 回答受付中"}
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
          ) : phase === "trial" ? (
            <>
              <p style={{ fontSize:".7rem", color:"rgba(100,220,100,.8)", letterSpacing:".15em", marginBottom:10 }}>🎯 練習問題 — 回答受付中（スコアに影響しません）</p>
              <p style={{ fontSize:"1rem", lineHeight:1.9, marginBottom:20, color:"var(--cream)", fontFamily:"'Noto Serif JP'" }}>{quizState.trial_question?.text}</p>
              <div style={{ padding:"14px 16px", borderRadius:10, background:"rgba(100,200,100,.06)", border:"1px solid rgba(100,200,100,.2)", marginBottom:16 }}>
                <p style={{ fontSize:".82rem", color:"rgba(245,234,208,.7)", marginBottom:12 }}>🎤 新郎新婦の答えを聞いて、正解を入力：</p>
                <div style={{ display:"flex", gap:14, justifyContent:"center" }}>
                  <button className={`btn-yes ${liveAnswer===true?"sel-yes":""}`} style={{ opacity:liveAnswer===false?.45:1 }} onClick={()=>setLiveAnswer(true)}>Yes</button>
                  <button className={`btn-no ${liveAnswer===false?"sel-no":""}`} style={{ opacity:liveAnswer===true?.45:1 }} onClick={()=>setLiveAnswer(false)}>No</button>
                </div>
              </div>
              <button className="btn btn-gold" style={{ width:"100%" }} onClick={closeTrialAndReveal} disabled={liveAnswer===null}>
                ✓ 正解確定・練習問題を締め切る
              </button>
            </>
          ) : phase === "revealing" ? (
            <p style={{ textAlign:"center", color:"var(--gold)", fontSize:".9rem", padding:"20px 0" }}>🔍 正解発表中… 4秒後に自動で次へ進みます</p>
          ) : (
            <>
              <p style={{ fontSize:".82rem", color:"rgba(245,234,208,.6)", marginBottom:16 }}>出題する問題を選んでください：</p>

              {/* 練習問題ボタン */}
              {current_q === -1 && quizState.trial_question?.text && !quizState.trial_question?.is_closed && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, padding:"10px 14px", borderRadius:10,
                  background:"rgba(100,200,100,.06)", border:"1px solid rgba(100,200,100,.2)" }}>
                  <span style={{ color:"rgba(100,220,100,.7)", fontSize:".85rem", minWidth:40 }}>練習</span>
                  <span style={{ flex:1, fontSize:".87rem", color:"rgba(245,234,208,.7)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {quizState.trial_question.text}
                  </span>
                  <button className="btn btn-gold" style={{ fontSize:".75rem", padding:"6px 14px", whiteSpace:"nowrap" }}
                    onClick={startTrialQuestion}>
                    🎯 練習出題
                  </button>
                </div>
              )}

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
            {ranked.map((p)=>{
              const rank = ranked.filter(q => (q.score||0) > (p.score||0)).length + 1;
              const isTop3 = rank <= 3;
              return (
                <div key={p.nickname} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px", borderRadius:8,
                  background:isTop3?"rgba(201,168,76,.08)":"transparent",
                  border:isTop3?"1px solid rgba(201,168,76,.18)":"1px solid transparent" }}>
                  <span style={{ minWidth:32, fontSize:".95rem",
                    color:rank===1?"#ffd700":rank===2?"#c0c0c0":rank===3?"#cd7f32":"rgba(245,234,208,.35)" }}>
                    {rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":`${rank}位`}
                  </span>
                  <span style={{ flex:1, fontSize:".92rem" }}>{p.nickname}</span>
                  <span style={{ color:"var(--gold)", fontFamily:"'Cormorant Garamond'", fontSize:"1.15rem" }}>
                    {p.score||0}<span style={{ fontSize:".68rem", color:"rgba(245,234,208,.35)", marginLeft:3 }}>/ {closedCount}</span>
                  </span>
                </div>
              );
            })}
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
// DRUM ROLL COMPONENT（Web Audio API使用）
// =============================================
function DrumRoll({ rank, shownCount }) {
  const prevRef = useRef(-1);

  useEffect(() => {
    if (shownCount <= 0 || shownCount === prevRef.current) return;
    prevRef.current = shownCount;
    if (rank === null || rank > 10) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      if (rank === 1) {
        playFanfare(ctx);
      } else if (rank <= 3) {
        playDrumRoll(ctx, 1.5, 0.8);
      } else {
        playDrumRoll(ctx, 0.6, 0.5);
      }
    } catch(e) {
      console.warn("Audio error:", e);
    }
  }, [rank, shownCount]);

  return null;
}

function playDrumRoll(ctx, duration, volume) {
  const startTime = ctx.currentTime;
  const steps = Math.floor(duration * 20);
  for (let i = 0; i < steps; i++) {
    const t = startTime + (i / steps) * duration;
    const interval = 0.05 - (i / steps) * 0.04; // だんだん速くなる
    if (i % Math.max(1, Math.floor((steps - i) / 8)) === 0) {
      playSnare(ctx, t, volume * (0.5 + (i / steps) * 0.5));
    }
  }
  // 最後にシンバル
  playCymbal(ctx, startTime + duration, volume);
}

function playFanfare(ctx) {
  const startTime = ctx.currentTime;
  // ドラムロール（長め）
  playDrumRoll(ctx, 2.0, 1.0);

  // ファンファーレ音（ド・ミ・ソ・ド）
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const times = [2.1, 2.4, 2.7, 3.0];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, startTime + times[i], 0.4, 0.8);
  });
  // 最後に和音
  [523.25, 659.25, 783.99].forEach(freq => {
    playTone(ctx, freq, startTime + 3.5, 1.0, 0.6);
  });
}

function playSnare(ctx, time, volume) {
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(time);
}

function playCymbal(ctx, time, volume) {
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 8000;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(time);
}

function playTone(ctx, frequency, time, duration, volume) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.frequency.value = frequency;
  osc.type = "triangle";
  gainNode.gain.setValueAtTime(volume, time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration);
}

// =============================================
// PROJECTION SCREEN
// =============================================
function ProjectionScreen({ quizState, participants }) {
  const { questions, current_q, phase, ranking_index } = quizState;

  // 同点考慮のランク計算（上位に何人いるかで順位決定）
  const sorted = [...participants].sort((a,b)=>(b.score||0)-(a.score||0));
  const withRank = sorted.map(p => ({
    ...p,
    rank: sorted.filter(q => q.score > p.score).length + 1
  }));

  // 10位以内の人だけ（rank<=10）、低い順に並べ直す（発表は下位から）
  const top10 = withRank.filter(p => p.rank <= 10).reverse();
  const shownCount = ranking_index ?? -1;
  const totalSteps = top10.length;

  // 現在表示する人（shownCount=0は待機、1〜がボタンを押した回数）
  const currentEntry = shownCount > 0 && shownCount <= totalSteps ? top10[shownCount - 1] : null;
  const actualRank = currentEntry ? currentEntry.rank : null;
  const isFirst = actualRank === 1;
  const isTop3 = actualRank !== null && actualRank <= 3;

  // ランキング発表画面
  if (phase === "finished" && shownCount >= 0) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0700", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
        {isFirst && <Confetti />}
        <DrumRoll rank={actualRank} shownCount={shownCount} />
        <h2 className="gold" style={{ fontFamily:"'Cormorant Garamond'", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:300, marginBottom:40, letterSpacing:".15em" }}>
          🏆 ランキング発表
        </h2>
        {shownCount === 0 ? (
          <p style={{ color:"rgba(245,234,208,.4)", fontSize:"1.2rem", letterSpacing:".2em", textAlign:"center" }}>
            進行者がボタンを押すと発表が始まります
          </p>
        ) : currentEntry ? (
          <div key={currentEntry.nickname + shownCount} style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:24,
            animation:"slideIn .6s ease both",
            padding:"48px 80px", borderRadius:24, textAlign:"center",
            background: isFirst?"rgba(255,215,0,.15)":isTop3?"rgba(201,168,76,.1)":"rgba(255,255,255,.04)",
            border: isFirst?"2px solid gold":isTop3?"1px solid var(--gold-d)":"1px solid rgba(201,168,76,.2)",
            minWidth:"min(480px, 90vw)",
            boxShadow: isFirst?"0 0 80px rgba(255,215,0,.4)":isTop3?"0 0 40px rgba(201,168,76,.25)":"none"
          }}>
            <span style={{ fontSize:"clamp(3rem,8vw,6rem)",
              color:actualRank===1?"#ffd700":actualRank===2?"#c0c0c0":actualRank===3?"#cd7f32":"rgba(245,234,208,.7)" }}>
              {actualRank===1?"🥇":actualRank===2?"🥈":actualRank===3?"🥉":`${actualRank}位`}
            </span>
            <span style={{ fontSize:"clamp(2rem,5vw,3.5rem)", fontFamily:"'Noto Serif JP'", color:"var(--cream)", fontWeight:300 }}>
              {currentEntry.nickname}
            </span>
            <span style={{ fontFamily:"'Noto Serif JP'", fontSize:"clamp(1.5rem,4vw,2.5rem)", fontWeight:600, color:"var(--gold-l)" }}>
              {currentEntry.score||0}<span style={{ fontSize:".6em", color:"rgba(245,234,208,.5)" }}>点</span>
            </span>
          </div>
        ) : null}
        <p style={{ marginTop:24, color:"rgba(245,234,208,.25)", fontSize:".85rem" }}>
          {shownCount > 0 && shownCount < totalSteps && `残り ${totalSteps - shownCount} 人`}
        </p>
      </div>
    );
  }

  // 練習問題投影画面
  if (phase === "trial") {
    const tq = quizState.trial_question;
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0a0700", padding:40, textAlign:"center" }}>
        <div style={{ display:"inline-block", padding:"6px 24px", borderRadius:20, background:"rgba(100,200,100,.12)",
          border:"1px solid rgba(100,200,100,.3)", marginBottom:24 }}>
          <p style={{ fontSize:"1rem", color:"rgba(100,220,100,.8)", letterSpacing:".2em" }}>🎯 練習問題</p>
        </div>
        <p style={{ fontSize:"clamp(1.5rem,4vw,2.8rem)", color:"var(--cream)", lineHeight:1.8, maxWidth:900, fontFamily:"'Noto Serif JP'", animation:"fadeUp .6s ease" }}>
          {tq?.text}
        </p>
        <div style={{ display:"flex", gap:60, marginTop:60, fontSize:"clamp(4rem,12vw,8rem)", color:"rgba(245,234,208,.2)" }}>
          <span>Yes</span><span>No</span>
        </div>
        <p style={{ marginTop:40, color:"rgba(245,234,208,.4)", fontSize:"1rem", letterSpacing:".2em", animation:"pulse 1.5s ease infinite" }}>スマホで回答してください</p>
      </div>
    );
  }

  // 待機画面
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

  // 正解発表画面
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

  // 出題中画面
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


export default function App() {
  const [view, setView] = useState("welcome");
  const [nickname, setNickname] = useState("");
  const [quizState, setQuizState] = useState(defaultQuizState());
  const [participants, setParticipants] = useState([]);
  const [myAnswers, setMyAnswers] = useState(Array(10).fill(null).map(()=>({answer:null,bet:null})));
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

  async function submitAnswer(qIdx, answerVal, betVal) {
    const newAnswers = [...myAnswers];
    newAnswers[qIdx] = { answer: answerVal, bet: betVal };
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
      return <><Styles /><ParticipantResultScreen nickname={nickname} score={me?.score||0} myAnswers={myAnswers} questions={quizState.questions} /></>;
    }
    // 練習問題フェーズ
    if (phase === "trial") {
      const trialQ = quizState.questions ? quizState.trial_question : null;
      const tq = quizState.trial_question;
      if (tq) {
        return <><Styles /><TrialScreen question={tq} /></>;
      }
    }

    if ((phase === "open" || phase === "revealing") && current_q >= 0 && current_q < 10) {
      if (phase === "revealing") {
        return <><Styles /><AnswerRevealScreen question={questions[current_q]} myAnswer={myAnswers[current_q]} /></>;
      }
      return <><Styles /><QuizScreen question={questions[current_q]} qNum={current_q+1}
        myAnswer={myAnswers[current_q]}
        onAnswer={(ans, bet) => submitAnswer(current_q, ans, bet)} /></>;
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
