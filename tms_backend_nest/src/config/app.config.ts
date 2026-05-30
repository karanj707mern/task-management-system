export default () => ({
  port: parseInt(process.env.PORT ?? '5000', 10),

  nodeEnv: process.env.NODE_ENV,

  logLevel: process.env.LOG_LEVEL,
});
