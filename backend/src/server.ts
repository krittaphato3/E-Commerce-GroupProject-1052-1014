import { app } from "./app.js";
import { env } from "./config/env.js";
import { sessionRepository } from "./repositories/sessionRepository.js";

const PORT = env.PORT || 3000;

void sessionRepository.deleteExpired().catch((err) => {
  console.error("[Omazon Server] Failed to clean up expired sessions on startup:", err);
});

app.listen(PORT, () => {
  console.log(`[Omazon Server] Listening on http://localhost:${PORT}`);
});
