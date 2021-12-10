interface SequenceFileMetadata {
  file_id: string;
  file_type: string | null;
  drs_filename: string | null;
  drs_filepath: string | null;
}

export interface SequenceResult {
  sequenceId: string;
  files: SequenceFileMetadata[];
}

// types from https://ga4gh.github.io/data-repository-service-schemas/preview/release/drs-1.0.0/docs/#_accessmethod
// will only be using https
export enum DRSProtocols {
  HTTPS = 'https',
  S3 = 's3',
  GS = 'gs',
  FTP = 'ftp',
  FILE = 'file',
  GSIFTP = 'gsiftp',
  GLOBUS = 'globus',
  HTSGET = 'htsget',
}

export interface AccessUrl {
  type: DRSProtocols;
  access_url: { url: string };
  region: string;
}

export interface DRSMetada {
  name: string;
  accessUrls: AccessUrl[];
}

export type ParseDRSPath = (filepath: string) => { domain: string; objectId: string };
export type DownloadFilesFunc = (sequence: SequenceResult) => Promise<
  {
    name: string;
    stream: NodeJS.ReadableStream;
  }[]
>;
