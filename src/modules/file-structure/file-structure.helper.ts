import sanitizeHtml from 'sanitize-html';
import sanitizeFileName from 'sanitize-filename';
import path from 'path';
import { FileMimeType, FileStructure } from '@prisma/client';
import { constants } from '../../common/constants';
import { escapeRegExp } from '../../common/helper';
import { FileStructureFromRaw } from './model/file-structure-from-raw';

export const fileStructureHelper = Object.freeze({
  fileTypeEnumToRawMime: <Record<FileMimeType, string>>{
    [FileMimeType.TEXT_PLAIN]: 'text/plain', // Plain text files¡
    [FileMimeType.TEXT_MARKDOWN]: 'text/markdown', // markdowns
    [FileMimeType.APPLICATION_JSON]: 'application/json', // JSON data
    [FileMimeType.APPLICATION_XML]: 'application/xml', // XML documents
    [FileMimeType.APPLICATION_PDF]: 'application/pdf', // Portable Document Format (PDF) files
    [FileMimeType.APPLICATION_OCTET_STREAM]: 'application/octet-stream', // binary file
    [FileMimeType.IMAGE_JPG]: 'image/jpeg', // JPEG images and JPG images
    [FileMimeType.IMAGE_PNG]: 'image/png', // PNG images
    [FileMimeType.IMAGE_GIF]: 'image/gif', // GIF images
    [FileMimeType.IMAGE_WEBP]: 'image/webp', // WebP images
    [FileMimeType.IMAGE_BMP]: 'image/bmp', // BMP (Bitmap) is a standard Windows image
    [FileMimeType.IMAGE_SVG]: 'image/svg+xml', // Svg images
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
    'image/svg+xml': FileMimeType.IMAGE_SVG, // Svg images
    'audio/mpeg': FileMimeType.AUDIO_MPEG, // MP3 audio files
    'audio/wav': FileMimeType.AUDIO_WAV, // WAV audio files
    'video/mp4': FileMimeType.VIDEO_MP4, // MP4 video files
    'video/mpeg': FileMimeType.VIDEO_MPEG, // MPEG video files
    'video/webm': FileMimeType.VIDEO_WEBM, // WebM video files
    'video/quicktime': FileMimeType.VIDEO_QUICKTIME, // QuickTime video files.
    'application/octet-stream': FileMimeType.APPLICATION_OCTET_STREAM, // binary file
  },
});

const rooPath = path.join(require.main!.path, '../..');
const {
  //
  publicAssets,
  publicAssetsImage,
  userContentFolderName,
  userUploadFolderName,
  userBinFolderName,
} = constants.assets;

export const absPublicPath = (extraPath?: string) => path.join(rooPath, publicAssets, extraPath ?? '');
export const absPublicImgPath = (extraPath?: string) => path.join(rooPath, publicAssetsImage, extraPath ?? '');
export const absUserContentPath = (uuid?: string) => path.join(rooPath, userContentFolderName, uuid ?? '');
export const absUserUploadPath = (uuid?: string) => path.join(rooPath, userUploadFolderName, uuid ?? '');
export const absUserBinPath = (uuid?: string) => path.join(rooPath, userBinFolderName, uuid ?? '');

/**
 * @example
 * ```ts
 * const string1 = 'anything here including text and symbols and numbers and etc (123)';
 * const string2 = 'This is another example (456)';
 * const string3 = 'NoSpaceHere(789)';
 * console.log(regex.test(string1)); // Output: true
 * console.log(regex.test(string2)); // Output: true
 * console.log(regex.test(string3)); // Output: false
 * ```
 */
export const fileStructureNameDuplicateRegex = new RegExp(/.*\([1-9]\d*\)$/);
export const fileStructureNameDuplicateNumberCatcherRegex = new RegExp(/.*\(([1-9]\d*)\)$/);

/**
 * @description
 * functions same as fileStructureNameDuplicateRegex method but instead of any symbol,number,string
 * at the start of string before " (" there must be constant text which is given
 */
export const constFileStructureNameDuplicateRegex = (t: string): RegExp =>
  new RegExp(`${escapeRegExp(t)}\\s\\([1-9]\\d*\\)$`);

/**
 * @description
 * extracts integer from this kind of string only 'This is another example (456)' -> 456
 * not from this NoSpaceHere(789) -> undesired response
 *
 */
export const extractNumber = (title: string): number => {
  return parseInt(fileStructureNameDuplicateNumberCatcherRegex.exec(title)?.at(1) || '0');
};

/**
 * @description
 * Remove all unecessary characters from the dir relative path
 *
 * @example
 * ```ts
 * sanitizeRelativePathForFolder('/something/something/'); // -> /something/something/
 * sanitizeRelativePathForFolder('/something..//x'); // -> /something/x
 * sanitizeRelativePathForFolder('/some//'); // -> /some/
 * sanitizeRelativePathForFolder('/asom/.'); // -> /asom/
 * sanitizeRelativePathForFolder('/soem/some.x'); // -> /soem/somex
 * sanitizeRelativePathForFolder('/soem/some.x/file'); // -> /soem/somex/file
 * sanitizeRelativePathForFolder('/soem/some.x/file/subfile'); // -> /soem/somex/file/subfile
 * ```
 */
export const sanitizeRelativePathForFolder = (path: string) => {
  return path
    .split('/')
    .map(e => sanitizeHtml(sanitizeFileName(e)))
    .join('/')
    .replace('.', '')
    .replace(/\/+/g, '/'); // replace all / which are more than 1;
};

export const makeTreeSingle = (data: FileStructureFromRaw[]): FileStructureFromRaw | null => {
  const map: Partial<FileStructureFromRaw> = {}; // Create a map to store references to each node by its ID

  // First pass: Create a map of nodes indexed by their ID
  data.forEach(node => {
    map[node.id] = node;
  });

  // Second pass: Connect each node to its parent node, finding the root
  let rootNode: FileStructure | null = null;

  data.forEach(node => {
    if (node.parentId === null) {
      rootNode = map[node.id]; // If no parent, it's the root
    } else {
      map[node.parentId].children.push(map[node.id]); // Add child to parent
    }
  });

  return rootNode; // Return the root node (single object)
};

export const makeTreeMultiple = (flatList: FileStructureFromRaw[]): FileStructureFromRaw[] => {
  const map = new Map();
  const roots: FileStructureFromRaw[] = [];

  // First, create a map of all nodes keyed by their id
  flatList.forEach(node => {
    map.set(node.id, node);
  });

  // Then, iterate over the flat list again to build the tree
  flatList.forEach(node => {
    const parentNode = map.get(node.parentId);

    if (parentNode) {
      parentNode.children.push(map.get(node.id));
    } else {
      // If a node has no parent, it's a root node
      roots.push(map.get(node.id));
    }
  });

  return roots;
};
