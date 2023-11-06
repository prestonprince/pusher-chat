import "../../index.css";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useNavigate } from "react-router-dom";
import { useGetUserTeams } from "./api";
import { ProgressBar } from "@/components/custom/ProgressBar";

import { Nav } from "@/components/custom/Nav";
import { TeamCard } from "@/components/custom/TeamCard";

export interface TTeam {
  id: string;
  creatorId: string;
  name: string;
}

export interface TTeamMembers {
  id: string;
  userId: string;
  teamId: string;
}

export interface TTeamObj {
  teams: TTeam;
  team_members: TTeamMembers;
}

export const Dash = () => {
  const { isAuthenticated, isLoading, user } = useKindeAuth();
  const navigate = useNavigate();
  const userId = user && user.id ? user.id : "";
  const { isLoading: isLoadingTeams, data, isError } = useGetUserTeams(userId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ProgressBar />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login", { replace: true });
  }

  if (isLoadingTeams || isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ProgressBar />
      </div>
    );
  }

  const teams: TTeamObj[] = data?.data.result;

  const handleTeamClick = (id: string) => {
    navigate(`/teams/${id}`, { replace: true });
  };

  return (
    <>
      <Nav />
      <div className="flex gap-2 flex-col items-center justify-center h-screen w-screen">
        <div className="flex flex-row gap-2">
          {teams && teams.length > 0 ? (
            teams.map((team) => (
              <TeamCard
                key={team.teams.id}
                team={team}
                handleTeamClick={handleTeamClick}
              />
            ))
          ) : (
            <ProgressBar />
          )}
        </div>
      </div>
    </>
  );
};
