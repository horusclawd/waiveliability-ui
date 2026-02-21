export interface SubmissionAnswer {
  [fieldId: string]: string | boolean;
}

export interface Submission {
  id: string;
  formId: string;
  submitterName: string | null;
  submitterEmail: string | null;
  formData: SubmissionAnswer;
  signatureUrl: string | null;
  pdfUrl: string | null;
  status: 'pending' | 'reviewed' | 'archived';
  submittedAt: string;
}

export interface SubmissionSummary {
  id: string;
  formId: string;
  submitterName: string | null;
  submitterEmail: string | null;
  status: 'pending' | 'reviewed' | 'archived';
  submittedAt: string;
}
