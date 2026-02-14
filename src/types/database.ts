export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          workspace_id: string;
          contact_id: string;
          date: string;
          time: string;
          service: string;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          contact_id: string;
          date: string;
          time: string;
          service: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          contact_id?: string;
          date?: string;
          time?: string;
          service?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          workspace_id: string;
          contact_id: string;
          content: string;
          sender: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          contact_id: string;
          content: string;
          sender: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          contact_id?: string;
          content?: string;
          sender?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
