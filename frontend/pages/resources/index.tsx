import { Container, Typography, Box } from '@mui/material';

export default function Resources() {
  return (
    <Container maxWidth="md" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={900} color="#1565c0" gutterBottom>
          Resources
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3} sx={{ fontSize: '1.12rem', fontWeight: 500 }}>
          Explore curated medical resources, guides, and reference materials to support your learning and practice.
        </Typography>
        {/* Add resource cards or links here as needed */}
        <Typography color="text.secondary" mt={4}>More resources coming soon!</Typography>
      </Box>
    </Container>
  );
}
