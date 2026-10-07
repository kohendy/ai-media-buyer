export class MetaWriteBlockedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "MetaWriteBlockedError";
  }
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Penyimpanan objek belum dikonfigurasi (S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID).");
    this.name = "StorageNotConfiguredError";
  }
}
