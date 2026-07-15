/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Los medios sirven sus imágenes de portada desde estos dominios.
    // Agregá el dominio de cada medio que actives en lib/rss/sources.ts.
    remotePatterns: [
      { protocol: "https", hostname: "**.infobae.com" },
      { protocol: "https", hostname: "**.lanacion.com.ar" },
      { protocol: "https", hostname: "**.clarin.com" },
      { protocol: "https", hostname: "**.ambito.com" },
      { protocol: "https", hostname: "**.cronista.com" },
      { protocol: "https", hostname: "**.tn.com.ar" },
      { protocol: "https", hostname: "**.perfil.com" },
      { protocol: "https", hostname: "**.pagina12.com.ar" },
      { protocol: "https", hostname: "**.bbci.co.uk" },
      { protocol: "https", hostname: "**.reutersmedia.net" },
      { protocol: "https", hostname: "**.cnbc.com" },
      { protocol: "https", hostname: "**.cnn.com" },
      { protocol: "https", hostname: "**.theguardian.com" },
    ],
  },
};

module.exports = nextConfig;
