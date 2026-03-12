export interface CreateCategoryInput {
  name:          string;
  description?:  string;
  display_order?: number;
}

export interface UpdateCategoryInput {
  name?:          string;
  description?:   string;
  display_order?: number;
}