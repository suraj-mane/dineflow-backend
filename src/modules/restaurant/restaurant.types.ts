export interface CreateRestaurantInput {
  name:           string;
  descriptions?:  string;
  phone?:         string;
  address?:       string;
  city?:          string;
  state?:         string;
  postal_code?:   string;
  latitude?:      number;
  longitude?:     number;
  tax_percentage?: number;
}

export interface UpdateRestaurantInput {
  name?:            string;
  descriptions?:    string;
  phone?:           string;
  address?:         string;
  city?:            string;
  state?:           string;
  postal_code?:     string;
  latitude?:        number;
  longitude?:       number;
  tax_percentage?:  number;
  is_open?:         boolean;
  accepting_orders?: boolean;
}