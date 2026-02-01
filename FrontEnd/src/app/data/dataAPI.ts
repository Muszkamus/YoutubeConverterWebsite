import { env } from "process";

const envBase = process.env.NEXT_PUBLIC_BACKEND_BASE;

if (!envBase) {
  throw new Error("NEXT_PUBLIC_BACKEND_BASE is not defined");
}

console.log(envBase);
export const BACKEND_BASE = envBase;
