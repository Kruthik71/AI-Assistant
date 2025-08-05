import json
import os
import sys
import requests

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import config

OLLAMA_ENDPOINT = f"{config.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
MODEL = config.MODEL_NAME

# ---- Logging helper (stderr so it doesn't mix with stdout JSON) ----
def log(*args, **kwargs):
  print(*args, file=sys.stderr, **kwargs)

# ---- Prompt builder ----
def build_prompt(change):
  if change["type"].startswith("style:"):
    prop = change["type"].split(":", 1)[1]
    return (
      f"A style change was detected on `{change['selector']}`.\n"
      f"The `{prop}` changed from `{change['from']}` to `{change['to']}`.\n"
      "explain it how to fix it in very short words."
    )
  elif change["type"] == "text":
    return (
      f"A text change was detected on `{change['selector']}`.\n"
      f"The text changed from:\n\"{change['from']}\"\nTo:\n\"{change['to']}\"\n"
      "explain it how to fix it in very short words."
    )
  return (
    f"A DOM change of type `{change['type']}` was detected at `{change['selector']}`.\n"
    f"From: {change['from']} To: {change['to']}.\nSuggest a fix."
  )

# ---- Query Ollama ----
def query_llama(prompt):
  res = requests.post(OLLAMA_ENDPOINT, json={
    "model": MODEL,
    "prompt": prompt,
    "stream": False
  })
  res.raise_for_status()
  return res.json()["response"]

# ---- Main enrichment function ----
def enrich_diff_from_file(label):
  diff_path = os.path.join(os.path.dirname(__file__), "dom_diff_outputs", f"{label}_diff.json")
  if not os.path.exists(diff_path):
    log(f"❌ No diff file found at {diff_path}")
    sys.exit(1)

  with open(diff_path, "r", encoding="utf-8") as f:
    diff_json = json.load(f)

  changes = diff_json.get("changes", [])
  log(f"🔍 Processing {len(changes)} changes with LLaMA...")

  for change in changes:
    prompt = build_prompt(change)
    suggestion = query_llama(prompt)
    change["ai_suggestion"] = suggestion.strip()

  enriched_output = {
    "label": label,
    "changes": changes
  }

  enriched_path = os.path.join(os.path.dirname(__file__), "dom_diff_outputs", f"{label}_diff_with_ai.json")
  os.makedirs(os.path.dirname(enriched_path), exist_ok=True)

  with open(enriched_path, "w", encoding="utf-8") as f:
    json.dump(enriched_output, f, indent=2, ensure_ascii=False)

  log(f"✅ Enriched diff saved to {enriched_path}")

  # ---- Return pure JSON to stdout ----
  sys.stdout.write(json.dumps(enriched_output, ensure_ascii=False))
  sys.stdout.flush()

# ---- CLI entrypoint ----
if __name__ == "__main__":
  if len(sys.argv) < 2:
    sys.stdout.write(json.dumps({"error": "Usage: python VisualLama.py <label>"}))
    sys.exit(1)

  label = sys.argv[1]
  enrich_diff_from_file(label)
