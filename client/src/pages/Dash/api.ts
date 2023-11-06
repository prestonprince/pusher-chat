import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const QUERY_KEYS = {
  GET_USER_TEAMS: "GET_USER_TEAMS",
};

export function useGetUserTeams(userId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_TEAMS, userId],

    queryFn: () => axios.get(`http://localhost:3000/api/user/${userId}/teams`),
  });
}
