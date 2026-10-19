"""Offline security regression checks (no cloud access)."""
import json
import re
import unittest
from pathlib import Path
root=Path(__file__).resolve().parent.parent

class SecurityHardening(unittest.TestCase):
    def test_rtdb_denies_read_and_write(self):
        data=json.loads((root/'database.rules.json').read_text())
        self.assertIs(data['rules']['.read'],False)
        self.assertIs(data['rules']['.write'],False)

    def test_storage_deny_by_default(self):
        rules=(root/'storage.rules').read_text()
        self.assertIn('allow read, write: if false;',rules)

    def test_firestore_guards(self):
        rules=(root/'firestore.rules').read_text()
        self.assertIn('allow create: if validRsvp()',rules)
        self.assertIn('allow get, list: if isAdmin()',rules)
        self.assertIn('match /admins/{userId}',rules)
        self.assertIn('allow list, create, update, delete: if false;',rules)
        self.assertIn('allow read, write: if false;',rules)
        self.assertNotRegex(rules,r'allow\s+read\s*,\s*write\s*:\s*if\s+true')

    def test_appcheck_hook_is_present_not_fake_enabled(self):
        cfg=(root/'assets/firebase-config.js').read_text()
        js=(root/'assets/firebase.js').read_text()
        self.assertIn('export const appCheckSiteKey',cfg)
        self.assertIn('initializeAppCheck',js)
        self.assertIn('ReCaptchaEnterpriseProvider',js)
        self.assertNotIn('RECAPTCHA_SECRET',cfg)

    def test_confirmation_only_after_server_write(self):
        js=(root/'assets/guest.js').read_text()
        self.assertLess(js.index('await addDoc('), js.index('byId("thanksOverlay").hidden = false;'))

    def test_no_privileged_secrets_in_bundle(self):
        for path in (root/'assets').glob('*.js'):
            js=path.read_text()
            self.assertNotIn('BEGIN PRIVATE KEY',js)
            self.assertNotIn('private_key',js)

if __name__=='__main__': unittest.main()
