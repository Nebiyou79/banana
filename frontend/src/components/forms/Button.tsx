/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Button({ children, ...props }: any) {
  return (
    <button
      {...props}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      {children}
    </button>
  );
}
