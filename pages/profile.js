import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProfileView from '../components/ProfileView';
import { useUser } from './_app';

export default function ProfilePage() {
  const { playerId } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!playerId) { setLoading(false); return; }
    fetch(`/api/get-profile?id=${encodeURIComponent(playerId)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [playerId]);

  return (
    <Layout title={profile?.player ? `${profile.player.username} — TEZ Games` : 'Profile — TEZ Games'}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
          Loading profile...
        </div>
      )}
      {!loading && !playerId && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            No profile yet
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
            Claim a username to start tracking your stats.
          </div>
        </div>
      )}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)', fontFamily: "'Nunito', sans-serif" }}>
          Failed to load profile. Try refreshing.
        </div>
      )}
      {!loading && profile?.player && (
        <ProfileView
          player={profile.player}
          perGame={profile.perGame}
          recent={profile.recent}
          isOwn={true}
          backHref="/"
          backLabel="Back to Games"
        />
      )}
    </Layout>
  );
}
