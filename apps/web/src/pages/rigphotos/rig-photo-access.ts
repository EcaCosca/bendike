import { Role, type RigPhotoView } from '@bendike/shared';

export function canRemovePhoto(
  photo: Pick<RigPhotoView, 'addedById'>,
  user: { id: string; role: Role },
  rigOwnerId: string,
): boolean {
  return user.role === Role.Admin || user.id === photo.addedById || user.id === rigOwnerId;
}
