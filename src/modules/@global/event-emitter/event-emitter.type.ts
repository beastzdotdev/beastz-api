export type EmitterEvents = {
  'admin.test': { message: string };
  'admin.socket.test': { message: string; type: 'namespace' | 'all' };

  'document.pull.doc.full': { userId: number; doc?: string | null };
  'document.share.disabled': { sharedUniqueHash: string };
};
