# PHP2Shell (2026) — runtime-level RCE research
**Date:** 2026-10-21 (prior to scheduled PHP release, 14:00 UTC)  
**Status:** Independent research; vendor affected/fixed version claims pending.

The PHP project announced two critical CVSS v4.0 9.2 issues but had not yet published affected/fixed versions or confirmed the detailed mechanisms. The linked research labels them CVE-2026-109618 and CVE-2026-109619, describing session upload-progress + LFI, deserialization/UAF, and serializer-handler mismatch chains. These are research claims: do **not** assert that every PHP installation is remotely exploitable.

Triage order:
1. Fingerprint the **web-serving PHP version/SAPI and distro patch level** for WordPress, Joomla, Drupal, Magento or custom PHP (the CMS version alone is not relevant).
2. Prove either a session-upload-progress path **and LFI that includes the session file**, attacker-controlled unserialization, or different session serializer contexts with an application gadget.
3. If no prerequisite is demonstrated, rotate. Memory-corruption PoCs may destabilize a service; test on your own lab first.
4. Compare the final vendor advisory, update PHP/backported packages, and document observed preconditions and evidence.

**Not wp2shell:** WordPress wp2shell is a separate July 2026 REST batch/SQLi exploit chain (CVE-2026-63030 + CVE-2026-60137).

References: https://www.php.net/archive/2026.php | https://github.com/ikow/php2shell-poc | https://github.com/ikow/php2shell-poc/blob/main/docs/ANALYSIS.md

App sections: 6.9A (dedicated gate), 6.3 LFI, 6.4 uploads, 6.9 CMS, 4.5 HTTP enumeration, 22.4 online references.
