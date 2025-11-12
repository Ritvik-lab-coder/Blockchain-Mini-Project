// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'voter' | 'observer';
  blockchainAddress?: string;
  isActive: boolean;
  createdAt: string;
}

// Voter types
// Voter types
export interface Voter {
  _id: string;  // ← Changed from 'id' to '_id'
  userId: string | {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  voterCommitment: string;
  isRegisteredOnChain: boolean;
  registrationTxHash?: string;
  registrationDate?: string;
  eligibleElections: string[];
  votedElections: VotedElection[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  updatedAt: string;
}


export interface VotedElection {
  electionId: string;
  votedAt: string;
  nullifier: string;
  txHash: string;
}

// Candidate types
export interface Candidate {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  party?: string;
}

// Election types
export type ElectionState = 'created' | 'registration' | 'voting' | 'ended';
export type ElectionType = 'general' | 'local' | 'organizational' | 'poll';

export interface Election {
  _id: string;  // ← Changed from 'id' to '_id'
  title: string;
  description: string;
  electionType: ElectionType;
  candidates: Candidate[];
  startTime: string;
  endTime: string;
  state: ElectionState;
  blockchainElectionId?: number;
  contractAddress?: string;
  createdBy: string | {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  eligibleVoters: string[];
  totalVotersRegistered: number;
  totalVotesCast: number;
  results: Record<string, number>;
  isResultsPublished: boolean;
  metadata: ElectionMetadata;
  createdAt: string;
  updatedAt: string;
}


export interface ElectionMetadata {
  visibility: 'public' | 'private' | 'restricted';
  requiresVerification: boolean;
  allowMultipleVotes: boolean;
}

// Vote Record types
export interface VoteRecord {
  electionId: string;
  voterId: string;
  nullifier: string;
  candidateId: number;
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: number;
  timestamp: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

// Audit Log types
export interface AuditLog {
  _id: string;
  action: string;
  userId?: string;
  targetId?: string;
  targetModel?: string;
  description: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
  blockchainTxHash?: string;
  timestamp: string;
}

// Dashboard Stats types
export interface DashboardStats {
  users: {
    total: number;
  };
  voters: {
    total: number;
    approved: number;
    pending: number;
  };
  elections: {
    total: number;
    active: number;
  };
  votes: {
    total: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'voter' | 'observer';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Form types
export interface CreateElectionForm {
  title: string;
  description: string;
  electionType: ElectionType;
  candidates: Omit<Candidate, 'id'>[];
  startTime: string;
  endTime: string;
  metadata?: Partial<ElectionMetadata>;
}

export interface CastVoteForm {
  electionId: string;
  candidateId: number;
}

// Election Results types
export interface ElectionResults {
  election: {
    id: string;
    title: string;
    totalVotesCast: number;
    totalVotersRegistered: number;
  };
  results: CandidateResult[];
}

export interface CandidateResult {
  candidateId: number;
  name: string;
  party?: string;
  votes: number;
  percentage?: number;
}
