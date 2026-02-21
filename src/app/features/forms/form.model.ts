export type FieldType = 'text' | 'email' | 'number' | 'date' | 'textarea' | 'checkbox' | 'select' | 'content';
export type FormStatus = 'draft' | 'published';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  fieldType: FieldType;
  label: string;
  placeholder: string | null;
  required: boolean;
  fieldOrder: number;
  options: FormFieldOption[] | null;
  content: string | null;
}

export interface FormSummary {
  id: string;
  name: string;
  description: string | null;
  status: FormStatus;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Form {
  id: string;
  name: string;
  description: string | null;
  status: FormStatus;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
