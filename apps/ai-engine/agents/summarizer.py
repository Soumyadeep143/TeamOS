import os
import re


class Summarizer:
    """
    Page/document summarizer (FR-13). Uses a real Gemini or OpenAI call when an
    API key is configured, falling back to a local extractive summary otherwise
    so the feature still produces a real (non-fabricated) result without keys.
    """

    def summarize(self, text: str, max_sentences: int = 3) -> dict:
        text = (text or "").strip()
        if not text:
            return {"summary": "", "source": "empty"}

        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if gemini_key:
            try:
                return {"summary": self._summarize_with_gemini(text, gemini_key), "source": "gemini"}
            except Exception:
                pass  # fall through to local heuristic

        if openai_key:
            try:
                return {"summary": self._summarize_with_openai(text, openai_key), "source": "openai"}
            except Exception:
                pass

        return {"summary": self._extractive_summary(text, max_sentences), "source": "extractive_fallback"}

    def _summarize_with_gemini(self, text: str, api_key: str) -> str:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            f"Summarize the following in 2-3 sentences for a busy teammate:\n\n{text[:8000]}"
        )
        return response.text.strip()

    def _summarize_with_openai(self, text: str, api_key: str) -> str:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Summarize the given text in 2-3 sentences for a busy teammate."},
                {"role": "user", "content": text[:8000]},
            ],
        )
        return response.choices[0].message.content.strip()

    def _extractive_summary(self, text: str, max_sentences: int) -> str:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        summary = " ".join(s for s in sentences[:max_sentences] if s).strip()
        return summary if summary else text[:200]
