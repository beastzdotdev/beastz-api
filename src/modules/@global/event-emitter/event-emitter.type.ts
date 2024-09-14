export type EmitterEvents = {
  'admin.test': { message: string };
  'admin.socket.test': { message: string; type: 'namespace' | 'all' };
};
