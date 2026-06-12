import type { JobStatusType } from '../../domain/types/path.types';

export class JobStatusDto implements JobStatusType {
  id!: string;
  status!: string;
  pathId!: string;
  progress!: number;
  progressLabel!: string | null;
  errorMsg!: string | null;
  createdAt!: Date;
}
