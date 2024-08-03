export default function getEnvToLogger(environment: string): any {
  const envToLogger: Record<string, Boolean | Object> = {
    development: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    production: true,
    test: false,
  };

  return envToLogger[environment];
}
