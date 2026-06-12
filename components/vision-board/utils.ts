import { VisionBoard, BoardCollaborator } from '../../types';

export interface BoardPermissions {
  isOwner: boolean;
  canEdit: boolean;
  canView: boolean;
}

export function getBoardPermissions(
  board: VisionBoard | null,
  userId: string | undefined,
  collaborators: BoardCollaborator[]
): BoardPermissions {
  if (!board || !userId) {
    return { isOwner: false, canEdit: false, canView: !!board?.isPublic };
  }
  const isOwner = board.userId === userId;
  const collab = collaborators.find(c => c.userId === userId);
  const canEdit = isOwner || collab?.role === 'editor';
  const canView = isOwner || !!collab || board.isPublic;
  return { isOwner, canEdit, canView };
}

export function generateId(): string {
  return crypto.randomUUID();
}
