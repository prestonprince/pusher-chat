import { Member } from "./Member";

export interface TTeamMember {
  id: string;
  userId: string;
  teamId: string;
}

export interface TTeamMembersProps {
  teamMembers: TTeamMember[];
  userId: string | null;
}

export const TeamMembers = (props: TTeamMembersProps) => {
  return (
    <div>
      <h2>Team Members:</h2>
      {props.teamMembers && props.teamMembers.length > 0
        ? props.teamMembers.map((member) => (
            <Member key={member.id} userId={props.userId} member={member} />
          ))
        : null}
    </div>
  );
};
