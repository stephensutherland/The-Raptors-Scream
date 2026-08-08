# Pressure-Test Framework (v1)

Your read on "pressure testing" is right, with one addition: it's not just adversarial simulation, it's *any* structured attempt to find where the system breaks before a real incident does. That includes people trying to get away with something, but also plain failure modes — a sensor node losing power, a reviewer being unreachable, a form nobody filled out correctly.

## Categories

**1. Vetting-bypass testing (social)**
A trusted tester attempts to get through intake without qualifying — vague or evasive answers, a fabricated collateral contact, pressuring the interviewer to skip steps. Scored on: did the process catch it, and at which stage?

**2. Distress-signal testing (procedural)**
A tester triggers an alert as if in distress and times the response chain: who's notified, how fast, what they're told to do. This also tests for false-alarm fatigue — what happens if it happens twice in one week.

**3. Network resilience testing (infrastructure)**
Verify the system degrades gracefully, not silently, when a node goes offline or a link drops — e.g. do other nodes/members get a "lost contact with X" signal, or does it just go quiet? Test this by physically powering down a node or moving it out of range, not by transmitting interference on live frequencies: intentionally jamming radio spectrum is federally regulated in the US (and most countries) even on your own hardware, so keep this to controlled-environment or simulated dead-zone testing, ideally in coordination with someone who holds the relevant radio license if you go beyond that.

**4. Unauthorized-join testing (access control)**
Verify a device without the correct channel key can't join the mesh and can't see traffic. This is testing your *own* configuration against Meshtastic's documented encryption model, not developing new exploit techniques.

**5. Data-handling audit**
Who can see collateral-interview answers, background-check flags, and location data — and is that access list actually enforced, or just assumed? Test by trying to access something a given role shouldn't be able to see.

## Running it
- **Rules of engagement, written down first**: what's in scope, what's explicitly off-limits (e.g. no actual RF jamming, no testing on a live/active incident), who's authorized to run tests, how testers identify themselves if a real member gets confused mid-test.
- **One category at a time**, logged, with a named owner reviewing results — not a free-for-all.
- **Findings go to a fix-tracking list**, not just a report that sits in a folder.
- **Retest after a fix**, don't just mark it closed.

## Where this lives in the repo
Keep the *framework* (this doc) wherever your other docs are — it's fine to be public; it doesn't reveal anything exploitable on its own.

Keep *results* (what actually broke, specific node locations, specific gaps found) in a **private** repo or a gitignored path. A pressure-test report is a punch list of your current weaknesses — that's exactly the thing you don't want indexed on a public GitHub repo. This is standard practice for any security program, open-source or not: the methodology is public, the findings are not, until they're fixed.
