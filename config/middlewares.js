module.exports = 

module.exports = ({ env }) => ({
  settings: {
    cache: {
      enabled: true,
      type: 'redis',
      maxAge: 2600000,
      models: ['product','product-collection','product-type','country'],
      redisConfig: process.env.AWS_ENABLED?{
        host: process.env.AWS_REDIS_HOST,
        port: process.env.AWS_REDIS_PORT,
       
    }:{
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password:process.env.REDIS_PASSWORD,
      }
    
    
  }
}
},
[
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
]);
