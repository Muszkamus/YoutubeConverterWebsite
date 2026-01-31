function extractYouTubeId(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id;
  }

  if (host === "youtube.com" || host === "music.youtube.com") {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
  }

  return null;
}

function isAllowedYoutubeUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (!["youtube.com", "youtu.be", "music.youtube.com"].includes(host))
      return false;

    const id = extractYouTubeId(url);
    return !!id && /^[A-Za-z0-9_-]{11}$/.test(id);
  } catch {
    return false;
  }
}
module.exports = { isAllowedYoutubeUrl };
