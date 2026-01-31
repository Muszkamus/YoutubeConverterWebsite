function extractYouTubeId(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    // strict: only /{id} or /{id}/
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length !== 1) return null;
    return parts[0] || null;
  }

  if (host === "youtube.com" || host === "music.youtube.com") {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    if (u.pathname.startsWith("/shorts/"))
      return u.pathname.split("/")[2] || null;
    if (u.pathname.startsWith("/embed/"))
      return u.pathname.split("/")[2] || null;
  }

  return null;
}

function isAllowedYoutubeUrl(url) {
  try {
    const u = new URL(url);

    // 1) scheme + credentials + port
    if (u.protocol !== "https:") return false;
    if (u.username || u.password) return false;
    if (u.port && u.port !== "443") return false;

    // 2) strict host allowlist (no extra subdomains beyond www handled)
    const host = u.hostname.replace(/^www\./, "");
    if (!["youtube.com", "youtu.be", "music.youtube.com"].includes(host))
      return false;

    // 3) block playlists if unsupported
    // (covers /watch?v=...&list=... and music.youtube.com variants)
    if (u.searchParams.has("list")) return false;

    // 4) extract + validate ID
    const id = (extractYouTubeId(url) || "").trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return false;

    // 5) optional strictness per route
    // - watch: must have v and only allow certain params
    if (host !== "youtu.be" && u.pathname === "/watch") {
      if (!u.searchParams.get("v")) return false;

      // allowlist params (adjust as needed)
      const allowed = new Set(["v", "t", "start"]);
      for (const key of u.searchParams.keys()) {
        if (!allowed.has(key)) return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

module.exports = { isAllowedYoutubeUrl };
