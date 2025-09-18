"use client";
import React, { useEffect, useState } from "react";
import { IUser } from "@/types/user";
import { updateMe } from "@/services/userService";

export default function ProfileForm({ initial }: { initial?: IUser }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    skills: (initial?.skills || []).join(", "),
    education: initial?.education || "",
    profession: initial?.profession || "",
    bio: initial?.bio || "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        email: initial.email || "",
        skills: (initial.skills || []).join(", "),
        education: initial.education || "",
        profession: initial.profession || "",
        bio: initial.bio || "",
      });
    }
  }, [initial]);

  const save = async () => {
    const payload = {
      name: form.name,
      email: form.email,
      skills: form.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
      education: form.education,
      profession: form.profession,
      bio: form.bio,
    };
    await updateMe(payload);
    alert("Profile saved");
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-xl font-semibold mb-3">Edit Profile</h3>
      <input className="w-full border p-2 mb-2 rounded" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Full name" />
      <input className="w-full border p-2 mb-2 rounded" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email" />
      <input className="w-full border p-2 mb-2 rounded" value={form.profession} onChange={e=>setForm({...form, profession:e.target.value})} placeholder="Profession" />
      <input className="w-full border p-2 mb-2 rounded" value={form.skills} onChange={e=>setForm({...form, skills:e.target.value})} placeholder="Skills (comma separated)" />
      <input className="w-full border p-2 mb-2 rounded" value={form.education} onChange={e=>setForm({...form, education:e.target.value})} placeholder="Education" />
      <textarea className="w-full border p-2 mb-2 rounded" value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} placeholder="Bio" />
      <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
    </div>
  );
}
