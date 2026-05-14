type RuntimeEnvironment = {
  apiUrl?: string;
};

const runtimeEnvironment = (globalThis as typeof globalThis & { __env?: RuntimeEnvironment }).__env;

export const environment = {
  production: false,
  apiUrl: (runtimeEnvironment?.apiUrl || 'http://localhost:8080').replace(/\/$/, ''),
};
