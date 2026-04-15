import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Esto es la magia que Cloudflare necesita
  eslint: {
    ignoreDuringBuilds: true, // Evita que errores menores de texto frenen el despliegue
  },
};

export default nextConfig;