import { useState, useRef } from "react";
import Head from "next/head";

export default function Home() {
  const [selectedChars, setSelectedChars] = useState([]);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [searchMode, setSearchMode] = useState("sound"); // "sound" | "meaning"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchTimer = useRef(null);

  // 2단계 상태
  const [convertInput, setConvertInput] = useState("");
  const [convertHint, setConvertHint] = useState("");
  const [convertResult, setConvertResult] = useState(null);
  const [loadingConvert, setLoadingConvert] = useState(false);
  const [convertError, setConvertError] = useState("");

  // 검색 실행
  async function doSearch(query, mode) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await fetch("/api/hanja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "sound"
            ? { syllable: query.trim() }
            : { meaning: query.trim() }
        ),
      });
      const data = await res.json();
      setSearchResults(data.hanja || []);
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }

  function handleSearchInput(e) {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      doSearch(val, searchMode);
    }, 300);
  }

  function switchMode(mode) {
    setSearchMode(mode);
    setSearchResults([]);
    setSearchQuery("");
  }

  function selectHanja(h) {
    setSelectedChars([...selectedChars, {
      korean: h.reading || searchQuery.trim(),
      hanja: h.char,
      meaning: h.meaning,
    }]);
    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeChar(i) {
    setSelectedChars(selectedChars.filter((_, idx) => idx !== i));
  }

  function copyHanja() {
    const full = selectedChars.map(c => c.hanja).join("");
    const hint = selectedChars.map(c => `${c.hanja}(${c.korean})`).join("");
    navigator.clipboard.writeText(full);
    setConvertInput(full);
    setConvertHint(hint);
  }

  async function convertToChinese() {
    if (!convertInput.trim()) return;
    setLoadingConvert(true);
    setConvertResult(null);
    setConvertError("");
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hanja: convertInput.trim(), hint: convertHint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConvertResult(data);
    } catch (e) {
      setConvertError(e.message || "변환 중 오류가 발생했어요.");
    } finally {
      setLoadingConvert(false);
    }
  }

  const fullHanja = selectedChars.map(c => c.hanja).join("");

  return (
    <>
      <Head>
        <title>Star Light Hanja-China Converter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/starlight_hanja-china_converter_logo.png" />
        <link rel="manifest" href="/manifest.json" />

      </Head>

      <main style={s.main}>
        <div style={s.wrap}>

          <div style={s.header}>
            <div style={s.dot} />
            <h1 style={s.title}>한국어 이름 한자-중국어 변환기</h1>
            <p style={s.sub}>한국어 이름 → 한자 선택 → 중국어 변환</p>
          </div>

          {/* 1단계 */}
          <div style={s.card}>
            <div style={s.sectionTitle}>1단계 — 한자 선택</div>

            {selectedChars.length > 0 && (
              <div style={s.selectedRow}>
                {selectedChars.map((c, i) => (
                  <div key={i} style={s.selectedChip}>
                    <span style={s.chipHanja}>{c.hanja}</span>
                    <span style={s.chipKorean}>{c.korean}</span>
                    <button style={s.chipRemove} onClick={() => removeChar(i)}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button style={s.findBtn} onClick={() => setShowModal(true)}>
              + 한자 찾기
            </button>

            {selectedChars.length > 0 && (
              <div style={s.resultRow}>
                <span style={s.fullHanja}>{fullHanja}</span>
                <button style={s.copyBtn} onClick={copyHanja}>
                  복사 + 아래에 붙여넣기
                </button>
              </div>
            )}
          </div>

          {/* 2단계 */}
          <div style={s.card}>
            <div style={s.sectionTitle}>2단계 — 중국어 변환</div>

            <input
              style={s.input}
              value={convertInput}
              onChange={e => setConvertInput(e.target.value)}
              placeholder="한자 입력 또는 위에서 복사"
            />

            <button
              style={{ ...s.convertBtn, ...(loadingConvert ? s.disabled : {}) }}
              onClick={convertToChinese}
              disabled={loadingConvert}
            >
              {loadingConvert ? "변환 중..." : "중국어로 변환 →"}
            </button>

            {convertError && <p style={s.error}>{convertError}</p>}

            {convertResult && (
              <div style={s.resultCard}>
                <div style={s.resultTop}>
                  <div>
                    <div style={s.simplified}>{convertResult.full_simplified}</div>
                    <div style={s.pinyin}>{convertResult.full_pinyin}</div>
                    <div style={s.korPron}>한국어 발음: {convertResult.full_korean_pronunciation}</div>
                  </div>
                  <button
                    style={s.speakBtn}
                    onClick={() => {
                      const utter = new SpeechSynthesisUtterance(convertResult.full_simplified);
                      utter.lang = "zh-CN";
                      utter.rate = 0.8;
                      window.speechSynthesis.speak(utter);
                    }}
                    title="중국어로 듣기"
                  >
                    🔊
                  </button>
                </div>
                <div style={s.charGrid}>
                  {convertResult.chars?.map((c, i) => (
                    <div key={i} style={s.charBox}>
                      <div style={s.charSimp}>{c.simplified}</div>
                      <div style={s.charPinyin}>{c.pinyin}</div>
                      <div style={s.charInfo}>{c.hanja} · {c.korean_reading}</div>
                      <div style={s.charKorPron}>{c.korean_pronunciation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p style={s.footer}>Produced by lunastarlight777</p>
        </div>
      </main>

      {/* 한자 찾기 모달 */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>한자 찾기</span>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <input
              style={s.modalInput}
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder={searchMode === "sound" ? "음 입력" : "뜻 입력"}
              autoFocus
            />

            <div style={s.tabRow}>
              <button
                style={{ ...s.tab, ...(searchMode === "sound" ? s.tabActive : {}) }}
                onClick={() => switchMode("sound")}
              >
                음으로 찾기
              </button>
              <button
                style={{ ...s.tab, ...(searchMode === "meaning" ? s.tabActive : {}) }}
                onClick={() => switchMode("meaning")}
              >
                뜻으로 찾기
              </button>
            </div>

            <div style={s.modalResults}>
              {loadingSearch && <p style={s.modalMsg}>검색 중...</p>}
              {!loadingSearch && searchQuery && searchResults.length === 0 && (
                <p style={s.modalMsg}>결과가 없어요.</p>
              )}
              {!loadingSearch && !searchQuery && (
                <p style={s.modalMsg}>위에 검색어를 입력해보세요.</p>
              )}
              {searchResults.map((h, i) => (
                <button key={i} style={s.resultItem} onClick={() => selectHanja(h)}>
                  <span style={s.resultChar}>{h.char}</span>
                  <span style={s.resultMeaning}>{h.meaning}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  main: {
    minHeight: "100vh",
    background: "#FAFAF8",
    display: "flex",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  wrap: { width: "100%", maxWidth: "520px" },
  header: { textAlign: "center", marginBottom: "1.5rem" },
  dot: { width: 10, height: 10, borderRadius: "50%", background: "#DE2910", margin: "0 auto 1rem" },
  title: { fontSize: 22, fontWeight: 500, color: "#1a1a1a", margin: "0 0 6px" },
  sub: { fontSize: 13, color: "#999", margin: 0 },
  card: {
    background: "#fff",
    border: "1px solid #E8E8E4",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  sectionTitle: { fontSize: 12, color: "#DE2910", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 },
  selectedRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  selectedChip: {
    display: "flex", alignItems: "center", gap: 4,
    background: "#FEF0EE", border: "1px solid #f5c6be",
    borderRadius: 8, padding: "4px 10px",
  },
  chipHanja: { fontSize: 18, fontWeight: 600, color: "#1a1a1a" },
  chipKorean: { fontSize: 11, color: "#999" },
  chipRemove: { background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 },
  findBtn: {
    width: "100%", padding: "10px 0", background: "#FAFAF8",
    border: "1.5px dashed #D0D0CA", borderRadius: 10,
    fontSize: 14, color: "#888", cursor: "pointer", fontFamily: "inherit",
  },
  resultRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0F0EC" },
  fullHanja: { fontSize: 28, fontWeight: 600, letterSpacing: "0.1em", color: "#1a1a1a" },
  copyBtn: {
    padding: "8px 14px", background: "#1a1a1a", border: "none",
    borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  },
  input: {
    width: "100%", boxSizing: "border-box", fontSize: 16, padding: "10px 12px",
    border: "1px solid #E8E8E4", borderRadius: 8,
    background: "#FAFAF8", outline: "none", fontFamily: "inherit",
  },
  convertBtn: {
    width: "100%", padding: 13, background: "#DE2910", border: "none",
    borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", marginTop: 10,
  },
  disabled: { opacity: 0.6, cursor: "not-allowed" },
  error: { color: "#c0392b", fontSize: 14, marginTop: 8 },
  resultCard: { marginTop: 16, paddingTop: 16, borderTop: "1px solid #F0F0EC" },
  resultTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  simplified: { fontSize: 36, fontWeight: 700, letterSpacing: "0.12em", color: "#1a1a1a", marginBottom: 4 },
  pinyin: { fontSize: 18, color: "#555", letterSpacing: "0.06em", marginBottom: 4 },
  korPron: { fontSize: 14, color: "#888", marginTop: 4 },
  speakBtn: { fontSize: 28, background: "none", border: "none", cursor: "pointer", padding: 8 },
  charGrid: { display: "flex", gap: 10, flexWrap: "wrap" },
  charBox: {
    background: "#FAFAF8", border: "1px solid #E8E8E4",
    borderRadius: 10, padding: "10px 14px", textAlign: "center",
  },
  charSimp: { fontSize: 26, fontWeight: 600, color: "#1a1a1a" },
  charPinyin: { fontSize: 13, color: "#DE2910", marginTop: 2 },
  charInfo: { fontSize: 11, color: "#aaa", marginTop: 2 },
  charKorPron: { fontSize: 12, color: "#888", marginTop: 2 },
  footer: { textAlign: "center", fontSize: 12, color: "#ccc", marginTop: "1.5rem" },

  // 모달
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: "16px 16px 0 0",
    width: "100%", maxWidth: 520,
    padding: "1.25rem", paddingBottom: "2rem",
    maxHeight: "80vh", display: "flex", flexDirection: "column",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: 600, color: "#1a1a1a" },
  modalClose: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#aaa", padding: 4 },
  modalInput: {
    width: "100%", boxSizing: "border-box", fontSize: 16, padding: "10px 12px",
    border: "1px solid #E8E8E4", borderRadius: 8,
    background: "#FAFAF8", outline: "none", fontFamily: "inherit",
    marginBottom: 10,
  },
  tabRow: { display: "flex", gap: 8, marginBottom: 12 },
  tab: {
    flex: 1, padding: "8px 0", border: "1px solid #E8E8E4",
    borderRadius: 8, background: "#FAFAF8", fontSize: 13,
    color: "#888", cursor: "pointer", fontFamily: "inherit",
  },
  tabActive: {
    background: "#DE2910", color: "#fff", border: "1px solid #DE2910",
  },
  modalResults: {
    overflowY: "auto", flex: 1,
    display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start",
    paddingTop: 4,
  },
  modalMsg: { fontSize: 13, color: "#aaa", width: "100%", textAlign: "center", marginTop: 20 },
  resultItem: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "10px 14px", border: "1px solid #E8E8E4",
    borderRadius: 10, background: "#fff", cursor: "pointer",
    minWidth: 60, fontFamily: "inherit",
  },
  resultChar: { fontSize: 24, fontWeight: 600, color: "#1a1a1a" },
  resultMeaning: { fontSize: 11, color: "#999", marginTop: 2, whiteSpace: "nowrap" },
};