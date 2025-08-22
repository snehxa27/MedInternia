import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import api from '../../utils/api';
import { useRouter } from 'next/router';

export default function UpdateProfile() {
  const [form, setForm] = useState({
    firstName: '',
    phone: '',
    address: { city: '', state: '' },
    profilePicture: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    const userId = localStorage.getItem('userId');
    api.get(`/users/${userId}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const user = res.data.data?.user || res.data;
        setForm({
          firstName: user.firstName || '',
          phone: user.phone || '',
          address: {
            city: user.address?.city || '',
            state: user.address?.state || ''
          },
          profilePicture: user.profilePicture || ''
        });
      })
      .catch(() => {});
  }, [router]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === 'city' || name === 'state') {
      setForm({ ...form, address: { ...form.address, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await api.put('/auth/profile', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        {/* Show profile image if available */}
        {form.profilePicture && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img
              src={form.profilePicture}
              alt="Profile"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #bdbdbd' }}
            />
          </Box>
        )}
        <Typography variant="h4" gutterBottom>Update Profile</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="First Name" name="firstName" fullWidth margin="normal" value={form.firstName} onChange={handleChange} required />
          <TextField label="Phone" name="phone" fullWidth margin="normal" value={form.phone} onChange={handleChange} />
          <TextField label="City" name="city" fullWidth margin="normal" value={form.address.city} onChange={handleChange} />
          <TextField label="State" name="state" fullWidth margin="normal" value={form.address.state} onChange={handleChange} />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Update Profile
          </Button>
        </form>
      </Box>
    </Container>
  );
}
