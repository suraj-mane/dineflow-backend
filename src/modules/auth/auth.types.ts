export interface RegisterInput {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  role:      "admin" | "owner" | "kitchen" | "cashier" | "customer";
}

export interface LoginInput {
  email:    string;
  password: string;
}