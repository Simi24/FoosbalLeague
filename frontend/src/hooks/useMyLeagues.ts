import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchMyLeagues } from "@/features/leagues";

export const useMyLeagues = () => {
  const dispatch = useAppDispatch();
  const { data, status } = useAppSelector((state) => state.leagues);

  useEffect(() => {
    dispatch(fetchMyLeagues());
  }, [dispatch]);

  return {
    leagues: data,
    loading: status === "loading" && data.length === 0,
  };
};
