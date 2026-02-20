import { FormFieldOption } from '../forms/form.model';

export interface TemplateField {
  id: string;
  fieldType: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  fieldOrder: number;
  options: FormFieldOption[] | null;
}

export interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPremium: boolean;
  usageCount: number;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPremium: boolean;
  usageCount: number;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}
