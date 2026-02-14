export type Workspace = {
  id: string;
  name: string;
  created_at: string;
};

export type Contact = {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
};

export type Booking = {
  id: string;
  workspace_id: string;
  contact_id: string;
  date: string;
  time: string;
  service: string;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  notes?: string;
  created_at: string;
  contacts?: Contact;
};

export type Conversation = {
  id: string;
  workspace_id: string;
  contact_id: string;
  subject?: string;
  last_message?: string;
  last_message_at: string;
  unread_count: number;
  status: "open" | "closed" | "archived";
  automation_paused?: boolean;
  created_at: string;
  contacts?: Contact;
};

export type Message = {
  id: string;
  workspace_id: string;
  contact_id: string;
  conversation_id?: string;
  content: string;
  sender: "admin" | "contact";
  created_at: string;
};

export type InventoryItem = {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  cost_per_unit: number;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
};

export type Form = {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  fields: FormField[];
  created_at: string;
};

export type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
};

export type FormSubmission = {
  id: string;
  workspace_id: string;
  form_id: string;
  contact_id: string;
  booking_id?: string;
  status: "pending" | "completed" | "overdue";
  data?: Record<string, string | boolean>;
  sent_at: string;
  completed_at?: string;
  created_at: string;
  contacts?: Contact;
  forms?: Form;
};

export type Alert = {
  id: string;
  workspace_id: string;
  type: "low_stock" | "overdue_form" | "unanswered_message" | "booking_reminder";
  title: string;
  message: string;
  link?: string;
  resolved: boolean;
  created_at: string;
};
