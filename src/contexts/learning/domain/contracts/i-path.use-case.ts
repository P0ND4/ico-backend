import type {
  PathListItemType,
  PathDetailType,
  JobStatusType,
  GeneratePathResultType,
} from '../types/path.types';

export const PATH_USE_CASE = Symbol('PATH_USE_CASE');

export interface GeneratePathParams {
  userId: string;
  topic: string;
  mode: 'standard' | 'deep';
}

export interface UpdatePathParams {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  status?: 'active' | 'archived';
}

export interface IPathUseCase {
  list(userId: string): Promise<PathListItemType[]>;
  generate(params: GeneratePathParams): Promise<GeneratePathResultType>;
  getJobStatus(jobId: string, userId: string): Promise<JobStatusType>;
  get(id: string, userId: string): Promise<PathDetailType>;
  update(params: UpdatePathParams): Promise<PathDetailType>;
  delete(id: string, userId: string): Promise<void>;
}
