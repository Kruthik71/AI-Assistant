import asyncio
import traceback

from playwright.async_api import async_playwright
import json
import os
import sys

def build_selector(el):
  tag = el.get("tag")
  id_attr = el.get("attributes", {}).get("id", "")
  class_attr = el.get("attributes", {}).get("class", "").replace("\n", "").strip()
  selector = tag
  if id_attr:
    selector += f"#{id_attr}"
  if class_attr:
    class_names = ".".join(class_attr.split())
    selector += f".{class_names}"
  return selector

def extract_text(el):
  return el.get("text", "").strip()

def flatten_dom(node, path=""):
  flat = []
  current_path = f"{path} > {node['tag'].upper()}:nth-child({node.get('nth', 1)})"
  selector = build_selector(node)

  flat.append({
    "path": current_path,
    "selector": selector,
    "text": extract_text(node),
    "styles": node.get("computedStyles", {}),
    "tag": node["tag"]
  })

  for i, child in enumerate(node.get("children", [])):
    child["nth"] = i + 1
    flat.extend(flatten_dom(child, current_path))
  return flat

def diff_flat_dom(base_flat, test_flat):
  print(" Comparing DOM trees...")
  changes = []
  path_to_test_el = {el["path"]: el for el in test_flat}

  for base_el in base_flat:
    path = base_el["path"]
    test_el = path_to_test_el.get(path)

    if not test_el:
      continue

    if base_el["text"] != test_el["text"]:
      changes.append({
        "selector": base_el["selector"],
        "path": path,
        "type": "text",
        "from": base_el["text"],
        "to": test_el["text"]
      })

    for style_key, base_val in base_el["styles"].items():
      test_val = test_el["styles"].get(style_key)
      if test_val and base_val != test_val:
        changes.append({
          "selector": base_el["selector"],
          "path": path,
          "type": f"style:{style_key}",
          "from": base_val,
          "to": test_val
        })

  print(f" Found {len(changes)} changes.")
  return deduplicate_changes(changes)

def deduplicate_changes(changes):
  seen = set()
  deduped = []
  for change in changes:
    key = (change["type"], change["from"], change["to"])
    if key in seen:
      continue
    seen.add(key)
    deduped.append(change)
  return deduped

async def extract_dom_styles(page):
  print(" Extracting DOM and styles...")
  return await page.evaluate("""() => {
        function walk(node) {
            const computed = window.getComputedStyle(node);
            const styleObj = {};
            for (let i = 0; i < computed.length; i++) {
                const prop = computed[i];
                styleObj[prop] = computed.getPropertyValue(prop);
            }

            const element = {
                tag: node.tagName.toLowerCase(),
                text: node.innerText || "",
                attributes: {},
                computedStyles: {
                    backgroundColor: styleObj['background-color'],
                    fontSize: styleObj['font-size'],
                    fontWeight: styleObj['font-weight'],
                    color: styleObj['color'],
                    width: styleObj['width'],
                    height: styleObj['height']
                },
                children: []
            };

            for (let attr of node.attributes || []) {
                element.attributes[attr.name] = attr.value;
            }

            for (let child of node.children) {
                element.children.push(walk(child));
            }

            return element;
        }

        return walk(document.body);
    }""")

async def main(base_url, test_url, label):
  print(f" Starting DOM diff for label: {label}")
  try:
    async with async_playwright() as p:
      print(" Launching browser...")
      browser = await p.chromium.launch()
      page = await browser.new_page()

      print(f" Navigating to base URL: {base_url}")
      await page.goto(base_url)
      await page.wait_for_timeout(2000)
      base_dom = await extract_dom_styles(page)

      print(f" Navigating to test URL: {test_url}")
      await page.goto(test_url)
      await page.wait_for_timeout(2000)
      test_dom = await extract_dom_styles(page)

      await browser.close()
      print(" Browser closed.")

    print("Flattening DOM trees...")
    base_flat = flatten_dom(base_dom)
    test_flat = flatten_dom(test_dom)

    changes = diff_flat_dom(base_flat, test_flat)

    output = {
      "label": label,
      "changes": changes
    }

    output_dir = os.path.join(os.path.dirname(__file__), "dom_diff_outputs")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"{label}_diff.json")

    print(f"Saving diff result to {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
      json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Done! {len(changes)} changes written to {output_path}\n")
    print(json.dumps(output, indent=2))

  except Exception as e:
    print(f" Exception occurred: {e}")
    traceback.print_exc()
    sys.exit(2)

if __name__ == "__main__":
  if len(sys.argv) < 3:
    print("Usage: python dom.py <base_url> <test_url> [label]")
    sys.exit(1)
  base_url = sys.argv[1]
  test_url = sys.argv[2]
  label = sys.argv[3] if len(sys.argv) > 3 else "default"
  asyncio.run(main(base_url, test_url, label))
