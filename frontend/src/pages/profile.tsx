import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
const getMe = async () => {
  const { data } = await api.get("/users/me");
  return data;
};

export default function Profile() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      <p>{user?.role}</p>
    </div>
  );
}
