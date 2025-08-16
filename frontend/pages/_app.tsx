import type { AppProps } from "next/app";
import MouseTrail from "../components/MouseTrail";
import { CssBaseline } from "@mui/material";
import Navbar from "../components/Navbar";
import { useRouter } from "next/router";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <>
      <CssBaseline />
      <Navbar route={router.pathname} />
  {/* Mouse trail effect */}
  <MouseTrail />
      {/* Add top margin to main content to avoid hiding under navbar */}
      <div style={{ marginTop: 64 }}>
        <Component {...pageProps} />
      </div>
      <style jsx global>{`
        .mouse-droplet {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, #6dd5ed 70%, #2193b0 100%);
          box-shadow: 0 0 8px 2px #6dd5ed88;
          opacity: 0.8;
          pointer-events: none;
          animation: dropletFade 0.4s forwards;
        }
        @keyframes dropletFade {
          0% { opacity: 0.8; transform: scale(1); }
          70% { opacity: 0.4; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
}

export default MyApp;
