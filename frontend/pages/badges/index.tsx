
import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import api from '../../utils/api';
import BadgeCard from '../../components/BadgeCard';

export default function Badges() {
  const [badges, setBadges] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/badges')
      .then(res => {
        setBadges(res.data.data.badges || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch badges');
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={900} color="#1565c0" gutterBottom>Badges</Typography>
        {badges.length === 0 ? (
          <Typography>No badges found.</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, mt: 4 }}>
            {badges.map(b => (
              <BadgeCard key={b._id} badge={b} />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}
