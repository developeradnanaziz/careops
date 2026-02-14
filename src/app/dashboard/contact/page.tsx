"use client";

import { useEffect, useState } from "react";
import { createPublicClient } from "@/lib/supabase-public";

export default function Contacts() {
  const supabase = createPublicClient();
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data } = await supabase.from("contacts").select("*");
    setContacts(data || []);
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Contacts</h1>

      <ul className="mt-4 space-y-2">
        {contacts.map((c) => (
          <li key={c.id} className="border p-2">
            {c.name} — {c.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
