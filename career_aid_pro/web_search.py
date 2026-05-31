"""Web search using DuckDuckGo for real-time information."""

from __future__ import annotations

import logging
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Keywords that trigger web search
TEMPORAL_KEYWORDS = [
    "current",
    "latest",
    "recent",
    "now",
    "today",
    "this week",
    "this month",
    "2024",
    "2025",
    "2026",
    "hiring",
    "job openings",
    "salary",
    "trending",
    "news",
    "score",
    "result",
    "match",
    "won",
    "lost",
    "price",
    "weather",
    "what happened",
    "breaking",
    "update",
    "who won",
    "what is the",
    "how to",
    "tutorial",
    "guide",
    "best",
    "top 10",
    "review",
]


def needs_web_search(query: str) -> bool:
    """Check if query needs web search based on keywords."""
    q = query.lower().strip()
    
    # Always search for questions starting with these
    question_words = ["what", "how", "when", "where", "who", "why", "is", "are", "does", "do"]
    words = q.split()
    if words and words[0] in question_words:
        return True
    
    return any(keyword in q for keyword in TEMPORAL_KEYWORDS)


def web_search(query: str, num_results: int = 5) -> str:
    """
    Perform web search using DuckDuckGo HTML.
    Returns formatted context for the AI prompt.
    """
    if not query or len(query.strip()) < 3:
        return ""
    
    encoded_query = quote_plus(query)
    
    # Try multiple approaches
    urls = [
        f"https://html.duckduckgo.com/html/?q={encoded_query}",
        f"https://api.duckduckgo.com/?q={encoded_query}&format=json&no_redirect=1",
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
    }
    
    results = []
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            if "duckduckgo.com/html" in url:
                # Parse HTML results
                soup = BeautifulSoup(response.text, "html.parser")
                
                for result_div in soup.find_all("div", class_="result")[:num_results]:
                    title_elem = result_div.find("a", class_="result__a")
                    snippet_elem = result_div.find("a", class_="result__snippet")
                    
                    if title_elem and snippet_elem:
                        title = title_elem.get_text(strip=True)
                        snippet = snippet_elem.get_text(strip=True)
                        if title and snippet:
                            results.append({"title": title, "snippet": snippet})
            
            elif "api.duckduckgo.com" in url:
                # Parse JSON API results
                data = response.json()
                
                if data.get("AbstractText"):
                    results.append({
                        "title": data.get("Heading", "Info"),
                        "snippet": data["AbstractText"]
                    })
                
                for related in data.get("RelatedTopics", [])[:num_results]:
                    if isinstance(related, dict) and related.get("Text"):
                        results.append({
                            "title": related.get("Text", "")[:100],
                            "snippet": related.get("Text", "")[100:] if len(related.get("Text", "")) > 100 else ""
                        })
            
            if results:
                break
                
        except Exception as e:
            logger.debug(f"Search attempt failed for {url}: {e}")
            continue
    
    if not results:
        # Return a helpful message if no results
        return f"[Web search returned no results for: '{query}'. Proceeding with general knowledge.]"
    
    # Format results
    context = "\n📡 WEB SEARCH RESULTS:\n"
    context += "─" * 40 + "\n"
    for i, result in enumerate(results[:num_results], 1):
        title = result.get("title", "").strip()
        snippet = result.get("snippet", "").strip()
        if title and snippet:
            context += f"{i}. {title}\n"
            if snippet:
                context += f"   {snippet}\n"
        elif title:
            context += f"{i}. {title}\n"
    
    context += "─" * 40 + "\n"
    context += "Use this information to provide accurate, up-to-date responses.\n"
    
    return context