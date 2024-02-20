import path from 'path';
import { FileMimeType } from '@prisma/client';
import { constants } from '../../common/constants';

export const fileStructureHelper = Object.freeze({
  fileTypeEnumToRawMime: <Record<FileMimeType, string>>{
    [FileMimeType.TEXT_PLAIN]: 'text/plain', // Plain text files
    [FileMimeType.TEXT_MARKDOWN]: 'text/markdown', // markdowns
    [FileMimeType.APPLICATION_JSON]: 'application/json', // JSON data
    [FileMimeType.APPLICATION_XML]: 'application/xml', // XML documents
    [FileMimeType.APPLICATION_PDF]: 'application/pdf', // Portable Document Format (PDF) files
    [FileMimeType.IMAGE_JPG]: 'image/jpeg', // JPEG images
    [FileMimeType.IMAGE_PNG]: 'image/png', // PNG images
    [FileMimeType.IMAGE_GIF]: 'image/gif', // GIF images
    [FileMimeType.IMAGE_WEBP]: 'image/webp', // WebP images
    [FileMimeType.IMAGE_BMP]: 'image/bmp', // BMP (Bitmap) is a standard Windows image
    [FileMimeType.AUDIO_MPEG]: 'audio/mpeg', // MP3 audio files
    [FileMimeType.AUDIO_WAV]: 'audio/wav', // WAV audio files
    [FileMimeType.VIDEO_MP4]: 'video/mp4', // MP4 video files
    [FileMimeType.VIDEO_MPEG]: 'video/mpeg', // MPEG video files
    [FileMimeType.VIDEO_WEBM]: 'video/webm', // WebM video files
    [FileMimeType.VIDEO_QUICKTIME]: 'video/quicktime', // QuickTime video files.
  },

  fileTypeRawMimeToEnum: <Record<string, FileMimeType>>{
    'text/plain': FileMimeType.TEXT_PLAIN, // Plain text files
    'text/markdown': FileMimeType.TEXT_MARKDOWN, // markdowns
    'application/json': FileMimeType.APPLICATION_JSON, // JSON data
    'application/xml': FileMimeType.APPLICATION_XML, // XML documents
    'application/pdf': FileMimeType.APPLICATION_PDF, // Portable Document Format (PDF) files
    'image/jpeg': FileMimeType.IMAGE_JPG, // JPEG images
    'image/png': FileMimeType.IMAGE_PNG, // PNG images
    'image/gif': FileMimeType.IMAGE_GIF, // GIF images
    'image/webp': FileMimeType.IMAGE_WEBP, // WebP images
    'image/bmp': FileMimeType.IMAGE_BMP, // BMP (Bitmap) is a standard Windows image
    'audio/mpeg': FileMimeType.AUDIO_MPEG, // MP3 audio files
    'audio/wav': FileMimeType.AUDIO_WAV, // WAV audio files
    'video/mp4': FileMimeType.VIDEO_MP4, // MP4 video files
    'video/mpeg': FileMimeType.VIDEO_MPEG, // MPEG video files
    'video/webm': FileMimeType.VIDEO_WEBM, // WebM video files
    'video/quicktime': FileMimeType.VIDEO_QUICKTIME, // QuickTime video files.
  },
});

export const getUserRootContentPath = (uuid: string) => {
  const distPath = require.main!.path;
  const userRootContentPath = path.join(distPath, '..', constants.userContentFolderName, uuid);

  return userRootContentPath;
};
