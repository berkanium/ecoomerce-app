require("dotenv").config();

/*
 *Uygulamanın yaplandırma ayarları, tüm env değişkenleri burada merkezi olarak yönetilir.
 *
 */

const config = {
  //Server settings
  port: process.env.PORT,
  env: process.env.NODE_ENV,

  //Database setting
  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  //Redis settings
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },

  //JWT Setitings
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },

  //Session Settings
  session: {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 24 * 7, //7 day,
    },
  },

  //CORS settings
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },

  //rate settings
  rateLimit: {
    windowsMs: 15 * 60 * 100, //15 Dkaika
    max: 100,
  },

  security: {
    bcryptSaltRounts: 12,
  },
};

if (config.env === "production") {
  const requiredEnvVars = [
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "SESSION_SECRET",
    "MONGODB_URI",
  ];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.log(`Enviroment variable is required: ${envVar}`);
      process.exit(1);
    }
  });
}
module.exports = config;
