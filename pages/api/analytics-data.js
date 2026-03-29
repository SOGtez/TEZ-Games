export default async function handler(req, res) {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Verify token + get account context
  const [userRes, projectRes] = await Promise.all([
    fetch('https://vercel.com/api/v9/user', { headers }),
    fetch(`https://vercel.com/api/v9/projects/${projectId}`, { headers }),
  ]);
  const user = await userRes.json();
  const project = await projectRes.json();

  // The analytics API needs either teamId (team) or just projectId (personal)
  // For personal accounts, teamId = user.id in some cases
  const teamId = project.accountId ?? null;

  const now = Date.now();
  const from = now - 30 * 24 * 60 * 60 * 1000;
  const filter = encodeURIComponent(JSON.stringify({}));
  const teamParam = teamId ? `&teamId=${teamId}` : '';
  const params = `projectId=${projectId}&from=${from}&to=${now}&filter=${filter}${teamParam}`;
  const base = `https://vercel.com/api/web/insights`;

  const [statsRes, pagesRes] = await Promise.all([
    fetch(`${base}/pageviews?${params}&limit=30`, { headers }),
    fetch(`${base}/breakdown?${params}&metric=path&limit=5`, { headers }),
  ]);
  const stats = await statsRes.json();
  const pages = await pagesRes.json();

  res.status(200).json({
    _debug: {
      userId: user?.user?.id,
      projectFound: !!project?.id,
      projectAccountId: project?.accountId,
      teamId,
    },
    stats,
    pages,
  });
}
