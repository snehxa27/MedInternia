import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import Link from "next/link";

export default function CaseCard({ caseData }: { caseData: any }) {
  // Status accent color and icon
  const statusMap = {
    Open: { color: "#43a047", icon: "🟢" },
    Closed: { color: "#bdbdbd", icon: "🔒" },
    Pending: { color: "#ffb300", icon: "⏳" },
  };
  const status: keyof typeof statusMap =
    (caseData?.status as keyof typeof statusMap) || "Open";
  const accent = statusMap[status] || statusMap["Open"];

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 4,
        background: "linear-gradient(120deg, #f8f9fa 0%, #e0eafc 100%)",
        boxShadow: "0 2px 12px #2193b022",
        transition: "box-shadow 0.3s, transform 0.3s",
        '&:hover': {
          boxShadow: '0 8px 32px #2193b044',
          transform: 'scale(1.025)',
        },
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        animation: 'fadeInCard 0.7s',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography fontSize={28} sx={{ color: accent.color }}>
            {accent.icon}
          </Typography>
          <Typography
            variant="h5"
            fontWeight={800}
            color="#1565c0"
            sx={{ flex: 1, letterSpacing: 0.5 }}
          >
            {caseData?.title || 'Untitled Case'}
          </Typography>
          <Box
            sx={{
              px: 2,
              py: 0.7,
              borderRadius: 2,
              background: accent.color,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 1px 4px #2193b022',
            }}
          >
            {status}
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontWeight: 500, fontSize: '1.08rem' }}>
          {caseData?.description || 'No description provided.'}
        </Typography>
        <Button
          variant="contained"
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.1,
            fontWeight: 700,
            fontSize: '1.05rem',
            background: accent.color,
            color: '#fff',
            boxShadow: '0 2px 8px #2193b044',
            mt: 1,
            transition: 'all 0.2s',
            '&:hover': {
              background: '#1565c0',
              color: '#fff',
              boxShadow: '0 4px 16px #2193b066',
            },
          }}
          component={Link}
          href={caseData?._id ? `/cases/${caseData._id}` : '#'}
        >
          View Details
        </Button>
      </CardContent>
      <style jsx global>{`
        @keyframes fadeInCard { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </Card>
  );
}
