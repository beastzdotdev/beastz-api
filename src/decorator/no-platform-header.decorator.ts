import { SetMetadata } from '@nestjs/common';

export const NO_PLATFORM_HEADER = 'no_platform_header';
export const NoPlatformHeader = () => SetMetadata(NO_PLATFORM_HEADER, true);
