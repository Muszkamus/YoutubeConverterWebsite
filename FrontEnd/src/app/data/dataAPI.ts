const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE;

if (!BACKEND_BASE) {
  throw new Error("NEXT_PUBLIC_BACKEND_BASE is not defined");
}

export { BACKEND_BASE };
