import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import api from "../../utils/api";
import Link from "next/link";
import CaseCard from "../../components/CaseCard";

export default function Cases() {
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    api
      .get("/cases", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCases(res.data.data.cases || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch cases");
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={900} color="#1565c0" gutterBottom sx={{ letterSpacing: 1 }}>
          Medical Cases
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={2} sx={{ fontSize: '1.15rem', fontWeight: 500 }}>
          Discover, review, and contribute to real-world medical cases. Dive into interactive case studies and expand your clinical knowledge.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 2, borderRadius: 3, fontWeight: 700, px: 4, py: 1.2, fontSize: '1.08rem', boxShadow: '0 2px 8px #2193b044', transition: 'all 0.2s', '&:hover': { background: '#1565c0', boxShadow: '0 4px 16px #2193b066' } }}
          component={Link}
          href="/cases/create"
        >
          + Create New Case
        </Button>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, animation: 'fadeIn 1s' }}>
        {cases.length === 0 ? (
          <Typography>No cases found.</Typography>
        ) : (
          cases.map((c, i) => (
            <Box key={c._id} sx={{ animation: `slideUp 0.6s ${i * 0.1}s both` }}>
              <CaseCard caseData={c} />
            </Box>
          ))
        )}
      </Box>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Container>
  );
}
