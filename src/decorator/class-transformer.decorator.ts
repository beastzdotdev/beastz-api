import { Transform, Type } from 'class-transformer';

export const TransformDate = () => Type(() => Date);
export const TransformNumber = () => Type(() => Number);
export const TransformBoolean = () => Transform(({ value }) => value === 'true' || value === true);
