const PINYIN_GUIDE = `
================================================================
한어병음(汉语拼音) 발음 규칙 - korean_pronunciation 작성 기준
================================================================

[성모 발음]
b[ㅂ] p[ㅍ] m[ㅁ] f[영어f, ㅍ아님]
d[ㄷ] t[ㅌ] n[ㄴ] l[ㄹ]
g[ㄱ] k[ㅋ] h[ㅎ]
j[ㅈ] q[ㅊ] x[ㅅ/ㅆ]
zh[쯔/혀말기ㅈ] ch[츠/혀말기ㅊ] sh[스/혀말기ㅅ] r[르/혀말기]
z[쯔] c[츠] s[스]

평음(무기음): b d g j zh z → 된소리에 가깝게
유기음(기음): p t k q ch c → 강한 기식, 거센소리

[운모 발음]
a[아] o[오] e[으/어] i[이] u[우] ü[위]
ai[아이] ei[에이] ui[웨이] ao[아오] ou[오우] iu[여우]
ia[이아] ie[이에] ua[우아] uo[우어] üe[위에]
iao[이아오]
an[안] en[언] in[인] un[운] ün[윈]
ang[앙] eng[엉] ing[잉] ong[옹]
ian[이엔] uan[우안] üan[위엔]
iang[이앙] uang[우앙] iong[이옹]
er[얼]

[특수 음절]
zhi[쯔] chi[츠] shi[스] ri[르]
zi[쯔] ci[츠] si[스]
yi[이] wu[우] yu[위]
ye[이에] yue[위에] yuan[위엔] yin[인] yun[윈] ying[잉]
wan[완] wang[왕] wen[원]

[j q x y 뒤의 u → ü 발음]
ju[쥐] qu[취] xu[쉬] yu[위]

[성조 표기 - 한국어 표기 시 반영]
1성(─): 높고 평탄 → 길고 높게
2성(↗): 올라감 → 약간 강조
3성(∨): 내려갔다 올라옴
4성(↘): 짧고 강하게 내려감

[자주 혼동 주의]
- b/p: ba→바/pa→파 (p는 거센소리)
- d/t: da→다/ta→타
- g/k: ga→가/ka→카
- j/zh: j→평설(혀 평탄)/zh→권설(혀말기)
- f: 영어 f 발음 (윗니+아랫입술), ㅍ 아님
- e 단독: [으/어], ie의 e: [에]
- o in bo/po/mo/fo: [워]

[한국어 표기 원칙]
- 실제 중국어 보통화 발음 기준으로 표기
- 절대로 한국식 한자 음(김→김, 하→하 등)으로 쓰면 안 됨
- 예시: 金→찐, 美→메이, 河→흐어, 李→리, 朴→뽀,
        林→린, 張→쨩, 王→왕, 陽→양, 龍→롱,
        英→잉, 月→위에, 山→샨, 花→화, 龜→꾸에이,
        志→쯔, 秀→씨우, 正→쩡, 海→하이, 明→밍
================================================================
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { hanja, hint } = req.body;
  if (!hanja) return res.status(400).json({ error: "한자를 입력해주세요." });

  const systemPrompt = `당신은 한자→중국어 변환 전문가입니다. 반드시 순수 JSON만 응답하고 설명, 마크다운, 백틱은 절대 포함하지 마세요.

아래 한어병음 발음 규칙을 반드시 참고하여 korean_pronunciation을 작성하세요:
${PINYIN_GUIDE}`;

  const userPrompt = `한자 이름 "${hanja}"를 중국어로 변환해줘.
${hint ? `각 한자의 한국어 음 힌트: ${hint} (예: 金(김)은 성씨 김, 金(금)은 쇠 금으로 구분해서 처리)` : ""}

반드시 아래 JSON 형식으로만 응답해. 설명, 마크다운, 백틱 없이 순수 JSON만:
{
  "original": "${hanja}",
  "chars": [
    {
      "hanja": "金",
      "simplified": "金",
      "pinyin": "Jīn",
      "korean_reading": "김",
      "korean_pronunciation": "찐"
    }
  ],
  "full_pinyin": "Jīn Jīn Měi",
  "full_simplified": "金金美",
  "full_korean_pronunciation": "찐찐메이"
}

규칙:
- chars는 각 글자별로 분리
- simplified는 중국 간화자로 변환
- pinyin은 성조 포함
- korean_reading은 해당 한자의 한국어 음 (예: 김, 금, 미)
- korean_pronunciation은 위 발음 규칙을 참고해서 실제 중국어 보통화 발음을 한국어로 표기. 절대 한국어 음(김,하,미 등)으로 쓰면 안 됨
- full_korean_pronunciation도 마찬가지로 실제 중국어 발음 한국어 표기 (예: 金河覽→찐흐어란)`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "변환 중 오류가 발생했어요." });
  }
}