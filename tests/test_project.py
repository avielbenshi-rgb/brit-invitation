"""Offline structural checks. Run: python -m unittest discover -s tests -v"""
import re
import subprocess
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.urls = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag in ("script", "link", "a"):
            self.urls.extend([attrs.get("src", ""), attrs.get("href", "")])

class ProjectTests(unittest.TestCase):
    def test_all_js_files_parse(self):
        for path in (ROOT / "assets").glob("*.js"):
            result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, f"{path.name}: {result.stderr}")

    def test_dom_references_and_static_paths(self):
        for page, js in (("index.html", "guest.js"), ("admin.html", "admin.js")):
            parser = Parser()
            parser.feed((ROOT / page).read_text(encoding="utf-8"))
            self.assertEqual(len(parser.ids), len(set(parser.ids)), "duplicate HTML id")
            source = (ROOT / "assets" / js).read_text(encoding="utf-8")
            references = set(re.findall(r'byId\("([^"]+)"\)', source))
            self.assertFalse(references - set(parser.ids), references - set(parser.ids))
            for link in parser.urls:
                if link.startswith("./"):
                    self.assertTrue((ROOT / link.removeprefix("./")).exists(), link)

    def test_required_security_guards(self):
        rules = (ROOT / "firestore.rules").read_text(encoding="utf-8")
        self.assertIn("allow create: if validRsvp();", rules)
        self.assertIn("allow get, list: if isAdmin();", rules)
        self.assertIn("allow list, create, update, delete: if false;", rules)
        self.assertNotIn("allow read, write: if true", rules)

if __name__ == "__main__":
    unittest.main()
