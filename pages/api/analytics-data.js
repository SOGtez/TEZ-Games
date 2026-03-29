export default async function handler(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const headers = { Authorization: `Bearer ${token}` };
  const teamId = 'team_rcckPm5SaxpLn0alYNQaAi9M';

  const now = Date.now();
  const from = now - 30 * 24 * 60 * 60 * 1000;
  const filter = encodeURIComponent(JSON.stringify({}));
  const common = `projectId=${projectId}&teamId=${teamId}&from=${from}&to=${now}&filter=${filter}`;

  // Try several candidate endpoint patterns
  const candidates = {
    'web/insights/pageviews':        `https://vercel.com/api/web/insights/pageviews?${common}&limit=5`,
    'v1/web/insights/pageviews':     `https://vercel.com/api/v1/web/insights/pageviews?${common}&limit=5`,
    'web/analytics':                 `https://vercel.com/api/web/analytics?${common}&limit=5`,
    'v1/web/analytics':              `https://vercel.com/api/v1/web/analytics?${common}&limit=5`,
    'v9/projects/analytics':         `https://vercel.com/api/v9/projects/${projectId}/analytics?teamId=${teamId}&from=${from}&to=${now}`,
    'web/insights (no filter)':      `https://vercel.com/api/web/insights?projectId=${projectId}&teamId=${teamId}&from=${from}&to=${now}&metric=pageviews`,
  };

  const results = {};
  await Promise.all(
    Object.entries(candidates).map(async ([key, url]) => {
      try {
        const r = await fetch(url, { headers });
        const text = await r.text();
        let json;
        try { json = JSON.parse(text); } catch { json = text.slice(0, 200); }
        results[key] = { status: r.status, body: json };
      } catch (e) {
        results[key] = { error: e.message };
      }
    })
  );

  res.status(200).json(results);
}
