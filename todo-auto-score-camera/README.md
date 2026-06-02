# Auto-Scoring Camera (roadmap)

Replace the human scorekeeper with a camera + **computer vision (CV)**: detect where each
washer lands on the board and feed the result into the existing watch → phone → web sync as
just another score source. The apps already render and sync scores — auto-scoring only
swaps the *input*.

## Concept

- **One camera**, mounted **~10 ft high, centered between the two boards** (the boards are
  10 ft apart per the house rules), on a **pan-tilt-zoom (PTZ)** mount.
- The camera tracks the **target board** (where washers are currently landing). The target
  board alternates once per half-round.
- **Why one camera is enough — the game's rhythm hides the pan latency:** you throw at the
  far board, then everyone walks over, gathers the washers, and grabs a beer before throwing
  back the other way. That natural gap is several seconds — far longer than a PTZ pan — so the
  camera re-aims during the downtime and is always settled before the next throws. No second
  camera, no real latency cost. This is a domain-informed trade-off, not a compromise.

## Hardware (intended)

- **Product:** Arducam 12 MP Pan-Tilt-Zoom (PTZ) Camera for Raspberry Pi and Jetson —
  <https://www.arducam.com/arducam-12mp-pan-tilt-zoom-ptz-camera-fo-raspberry-pi-and-jetson.html>
- **Sensor:** 12 MP **Arducam IMX477** (Sony IMX477 — the Raspberry Pi HQ Camera sensor).
- **Mount:** Arducam **PTZ** unit (remote directional + zoom) for **Raspberry Pi / Jetson**.
- **Motion specs (from product page):**
  - **Pan and tilt range: 0–180°** — and that's the clincher for the center-mount design: the
    two boards sit on opposite sides of the camera, so ~180° pan is exactly enough to swing from
    one board to the other.
  - **Zoom:** 2317 steps @ 0.00396 mm/step (wide → tele) — lets it tighten on a board's hole
    cluster for accurate washer-in-hole classification.
  - **Focus:** 3009 steps @ 0.0047 mm/step (near → far) — programmatic focus per board distance.
- **Compute (open decision):**
  - **Raspberry Pi + IMX477** — full Linux, easy OpenCV/Python, more power; or
  - **Arduino Nicla Vision** (board code `ABX00051`) — tiny on-device TinyML, low power, but
    only a **2 MP** onboard sensor (so it'd be the compute/eval side, not the 12 MP capture
    path). See the OpenMV tooling links (`.url` files) for its toolchain.

## How it integrates

The hard part (multi-platform real-time sync, tournament logic) already exists. Auto-scoring
is a new **writer** on the same data model:

```
camera → CV pipeline → "round result" (which holes, which player) → Firebase
         /games/{namespace}/{table}/current   ← same path the phone/watch write today
```

So the web/phone/watch displays, tournament bracket advancement, and stats all work unchanged
— they don't care whether a human or the camera produced the score.

## CV pipeline (sketch)

1. **Calibrate** board pose once (the 3 holes are fixed: 1 / 3 / 5, known geometry from rules).
2. **Detect** washers per throw-set (color/shape; washers are high-contrast discs).
3. **Classify** each washer's resting hole (or on-board / off-board) → points, with
   cancellation applied (matched holes cancel 1-for-1, per the rules).
4. **Emit** the round result to Firebase; the existing win/bust/round logic takes over.

## Open questions

- Compute platform: Pi + IMX477 vs. Nicla Vision (capture resolution vs. power/cost).
- Detecting *final resting position* only (rules: bounces/knock-ins count by final position) —
  needs motion-settled frame detection, not per-frame.
- Lighting/outdoor glare; washer color vs. board contrast.
- YaKaPoo (one washer in each hole) and mid-round 21/cancel sequences — edge cases the CV
  must report faithfully so the existing rules engine resolves them.
- PTZ aim trigger: detect "players walking / board idle" to know when to re-aim.

## Files in this directory

- `arudcam.url` — the Arducam 12 MP PTZ camera product page.
- `NiclaVision.*.url`, `OpenMV-IDE.url`, `openmv-python.github.url` — Nicla Vision
  getting-started/coding/programming and OpenMV tooling links.

(Vendor PDFs/pinout for the Nicla Vision were dropped — re-download from Arduino if needed.)
