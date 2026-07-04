import logging
import sys
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger("teamos.services.ai_engine_client")

# apps/ai-engine is a sibling package, not pip-installed into the backend's venv.
# It has no heavy/native deps (requests, pydantic, python-dotenv) so importing it
# directly via sys.path is simpler than packaging it for a hackathon MVP.
AI_ENGINE_ROOT = Path(__file__).resolve().parents[3] / "ai-engine"
if str(AI_ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ENGINE_ROOT))

try:
    from agents.planner import Planner
    from agents.browser_agent import BrowserAgent
    from agents.summarizer import Summarizer
    AI_ENGINE_AVAILABLE = True
except ImportError:
    logger.exception("Could not import apps/ai-engine agents from %s", AI_ENGINE_ROOT)
    AI_ENGINE_AVAILABLE = False


class AIEngineClient:
    """
    Thin orchestration layer the backend uses to invoke apps/ai-engine agents
    in-process, mirroring the PRD's Browser Use Research Flow:
    Prompt -> Planner -> BrowserAgent -> Summarizer -> result.
    """

    def __init__(self):
        if AI_ENGINE_AVAILABLE:
            self.planner = Planner()
            self.browser_agent = BrowserAgent()
            self.summarizer = Summarizer()
        else:
            self.planner = self.browser_agent = self.summarizer = None

    async def run_prompt(self, prompt: str) -> Dict[str, Any]:
        if not AI_ENGINE_AVAILABLE:
            return {
                "status": "unavailable",
                "message": "apps/ai-engine could not be imported.",
            }

        plan = self.planner.create_plan(prompt)
        urls = plan.get("target_urls", [])
        visits = [await self.browser_agent.browse(url) for url in urls]

        source_text = " ".join(v.get("content", "") for v in visits) or prompt
        summary = self.summarizer.summarize(source_text)

        return {
            "status": "completed",
            "prompt": prompt,
            "plan": plan,
            "visits": visits,
            "summary": summary["summary"],
            "summary_source": summary.get("source", "unknown"),
        }

    def summarize(self, text: str) -> Dict[str, Any]:
        if not AI_ENGINE_AVAILABLE:
            return {"summary": text[:200], "source": "truncation_fallback"}
        return self.summarizer.summarize(text)


ai_engine_client = AIEngineClient()
