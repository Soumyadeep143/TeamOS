import logging
import os

logger = logging.getLogger("teamos.ai_engine.browser_agent")


class BrowserAgent:
    """
    Wraps the `browser-use` autonomous browser agent (FR-15 to FR-18).

    Falls back to a "not_configured" result when the package isn't installed or
    no LLM key is set, rather than pretending to have browsed the page.
    NOTE: the browser-use call path below is unverified in this environment
    (package not installed here) — test it after `pip install browser-use`,
    `playwright install chromium`, and setting GEMINI_API_KEY/OPENAI_API_KEY.
    """

    async def browse(self, url: str) -> dict:
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if not (gemini_key or openai_key):
            return {"url": url, "status": "not_configured", "content": "", "reason": "no LLM API key configured"}

        try:
            from browser_use import Agent
        except ImportError:
            return {"url": url, "status": "not_configured", "content": "", "reason": "browser-use package not installed"}

        try:
            if gemini_key:
                from browser_use.llm import ChatGoogle
                llm = ChatGoogle(model="gemini-1.5-flash", api_key=gemini_key)
            else:
                from browser_use.llm import ChatOpenAI
                llm = ChatOpenAI(model="gpt-4o-mini", api_key=openai_key)

            agent = Agent(task=f"Go to {url} and summarize the key information on the page.", llm=llm)
            result = await agent.run()
            return {"url": url, "status": "visited", "content": str(result)}
        except Exception as exc:
            logger.exception("browser-use execution failed for %s", url)
            return {"url": url, "status": "error", "content": "", "reason": str(exc)}
