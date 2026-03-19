import { useGetMyLeaguesQuery } from "@/api/baseApi";

export const useMyLeagues = () => {
  const { data = [], isLoading } = useGetMyLeaguesQuery();
  return { leagues: data, loading: isLoading };
};
