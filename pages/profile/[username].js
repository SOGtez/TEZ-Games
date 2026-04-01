import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProfileView from '../../components/ProfileView';
import { useUser } from '../_app';

export default function PublicProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { playerId } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/get-profile?username=${encodeURIComponent(username)}`)
      .then(r => { if (r.status === 404) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(data => { if (data) { setProfile(data); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  const isOwn = profile?.player && playerId && profile.player.id === playerId;

  return (
    <Layout title={profile?.player ? `${profile.player.username} — TEZ Games` : 'Player Profile — TEZ Games'}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
          Loading profile...
        </div>
      )}
      {!loading && notFound && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            Player not found
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
            No player with that username exists.
          </div>
        </div>
      )}
      {!loading && profile?.player && (
        <ProfileView
          player={profile.player}
          perGame={profile.perGame}
          recent={profile.recent}
          isOwn={isOwn}
          backHref="/leaderboard"
          backLabel="Back to Leaderboard"
        />
      )}
    </Layout>
  );
}
