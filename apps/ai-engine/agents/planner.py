import re

URL_RE = re.compile(r"https?://\S+")


class Planner:
    """
    Produces a lightweight execution plan for a research/monitoring prompt
    (PRD 8.5 Browser Use Flow: Prompt -> Planner -> BrowserAgent -> Summarizer).

    This only extracts URLs already present in the prompt rather than fabricating
    search targets — real web search requires the `browser-use` package wired
    into BrowserAgent (see browser_agent.py).
    """

    def create_plan(self, prompt: str) -> dict:
        urls = URL_RE.findall(prompt or "")
        steps = []
        if urls:
            steps.append(f"Visit {len(urls)} URL(s) extracted from the prompt and extract page content")
        else:
            steps.append("No explicit URL found in prompt; summarize the prompt text directly")

        return {
            "prompt": prompt,
            "target_urls": urls,
            "steps": steps,
        }
