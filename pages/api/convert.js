export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { hanja, hint } = req.body;
  if (!hanja) return res.status(400).json({ error: "한자를 입력해주세요." });

  const prompt = `한자 이름 "${hanja}"를 중국어로 변환해줘.
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
- korean_pronunciation은 반드시 중국어 보통화 실제 발음을 한국어로 표기. 절대 한국어 음(김,하,미 등)으로 쓰면 안 됨. 예: 金→찐, 美→메이, 河→흐어, 覽→란, 李→리, 朴→뽀, 林→린, 張→쨩, 王→왕, 陽→양, 龍→롱, 英→잉, 月→위에, 山→샨
- full_korean_pronunciation도 마찬가지로 실제 중국어 발음 한국어 표기. 예: 金河覽→찐흐어란
- full_korean_pronunciation은 전체 중국어 발음을 한국어로 표기 (예: 찐찐메이)`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 800,
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