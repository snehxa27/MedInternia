
import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import api from '../../utils/api';
import LeaderboardTable from '../../components/LeaderboardTable';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    api.get('/leaderboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setLeaders(res.data.data.leaderboard || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch leaderboard');
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h3" fontWeight={900} color="#1565c0" gutterBottom>Leaderboard</Typography>
        <LeaderboardTable leaders={leaders} />
      </Box>
    </Container>
  );
}
