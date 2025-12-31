/* eslint-disable @typescript-eslint/no-explicit-any */
export type UserRole = "candidate" | "company" | "freelancer" | "admin";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profession?: string;
  bio?: string;
  skills?: string[];
  education?: string;
  verificationStatus?: "none" | "partial" | "full";
  examScore?: number;
  cvUrl?: string;
  avatar?: string;
}

export interface IJob {
  _id: string;
  title: any;
  job: any;
  description: string;
  skills: string[];
  salary?: string;
  location?: string;
  postedBy?: { _id: string; name: string };
}

