// Kept short-to-medium on purpose: races should take 20-40s, not 3 minutes.
export const TEXTS = [
  "The quick brown fox jumps over the lazy dog while the sun sets slowly behind the distant mountains.",
  "Programming is the art of telling another human what one wants the computer to do, as clearly as possible.",
  "In the middle of difficulty lies opportunity, and in the middle of chaos there is also great confusion.",
  "The only way to do great work is to love what you do, and to keep doing it even when nobody is watching.",
  "A journey of a thousand miles begins with a single step, but it also requires a map and a decent pair of shoes.",
  "Simplicity is the ultimate sophistication, yet most people confuse it with the absence of features entirely.",
  "Code is read far more often than it is written, so clarity should always win over cleverness in the end.",
  "The best error message is the one that never shows up, because the system anticipated the problem in advance.",
  "Not all those who wander are lost, some are simply taking the scenic route through unfamiliar territory.",
  "First, solve the problem. Then, write the code. Most people try to do both at exactly the same time.",
];

export function randomText() {
  return TEXTS[Math.floor(Math.random() * TEXTS.length)];
}
