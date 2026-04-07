export type AttachmentKind = 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'file';

export type PendingAttachment = {
  id: string;
  file: File;
  kind: AttachmentKind;
};

export type UploadedAttachment = {
  id: string;
  url: string;
  kind: AttachmentKind;
  name: string;
};
