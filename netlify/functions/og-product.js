// netlify/functions/og-product.js
// Función serverless que consulta Supabase en vivo y devuelve HTML con meta tags
// específicos del producto. Solo los robots (Facebook, WhatsApp, Google, etc.) los leen;
// los humanos son redirigidos a la SPA de React.

exports.handler = async (event) => {
  // Extraer el ID del producto desde la URL original
  const path = event.path; // ej: /producto/25d4508e-29f4-4b06-b172-6a4a4e2e5666
  const parts = path.split('/producto/');
  const id = parts[1] ? parts[1].split('?')[0] : null;

  if (!id) {
    return {
      statusCode: 302,
      headers: { Location: '/' },
    };
  }

  // Leer variables de entorno (ya las tenés en Netlify con esos nombres exactos)
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      statusCode: 500,
      body: 'Error de configuración del servidor',
    };
  }

  try {
    // Consultar el producto desde Supabase usando la API REST
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/productos?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const products = await response.json();
    const product = products && products.length > 0 ? products[0] : null;

    if (!product) {
      return {
        statusCode: 404,
        body: 'Producto no encontrado',
      };
    }

    // Preparar datos para los meta tags
    const nombre = product.nombre || 'Producto LIVOshop';
    const precio = product.precio_gs
      ? `Gs. ${product.precio_gs.toLocaleString('es-PY')}`
      : 'Consultar precio';
    const descripcion = (product.descripcion || '')
      .replace(/<[^>]*>/g, '')
      .substring(0, 200);
    const imagen = product.imagenes?.[0] || 'https://livoshop.netlify.app/og-image.jpg';
    const urlProducto = `https://livoshop.netlify.app/producto/${id}`;

    // HTML mínimo con meta tags reales
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${nombre} — ${precio} | LIVOshop Paraguay</title>
  <meta name="description" content="${descripcion} | Pedí por WhatsApp, envío a todo Paraguay." />

  <meta property="og:type" content="product" />
  <meta property="og:url" content="${urlProducto}" />
  <meta property="og:title" content="${nombre} — ${precio} | LIVOshop" />
  <meta property="og:description" content="${descripcion} | Envío a todo Paraguay por WhatsApp." />
  <meta property="og:image" content="${imagen}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="es_PY" />
  <meta property="og:site_name" content="LIVOshop" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${nombre} — ${precio} | LIVOshop" />
  <meta name="twitter:description" content="${descripcion} | Envío a todo Paraguay." />
  <meta name="twitter:image" content="${imagen}" />

  <link rel="canonical" href="${urlProducto}" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${nombre}",
    "description": "${descripcion}",
    "image": "${imagen}",
    "offers": {
      "@type": "Offer",
      "price": "${product.precio_gs || 0}",
      "priceCurrency": "PYG",
      "availability": "https://schema.org/InStock",
      "url": "${urlProducto}"
    }
  }
  </script>

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/logo.png" />
  <link rel="preconnect" href="https://api.fontshare.com" />
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@300,400,500,700&display=swap" rel="stylesheet" />

  <!-- Redirigir a la SPA si el visitante NO es un robot -->
  <script>
    if (!/facebookexternalhit|Facebot|Twitterbot|WhatsApp|Telegram|Slack|LinkedIn|Discord|bingbot|Googlebot|DuckDuckBot|PetalBot|Yeti|Baiduspider|Yandex/i.test(navigator.userAgent)) {
      window.location.replace("${urlProducto}");
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      body: html,
    };
  } catch (error) {
    return {
      statusCode: 302,
      headers: { Location: '/' },
    };
  }
};
