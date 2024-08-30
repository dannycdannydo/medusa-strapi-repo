const strapi = require('@strapi/strapi');
strapi(/* {...} */).start();

module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  build: {
    backend: env('STRAPI_BACKEND_URL', 'https://your-app-url.com'),
  },
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "default-secret-here"),
    },
  },
});
