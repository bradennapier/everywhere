// @flow

import dedent from 'dedent';

import type { ProjectLocationType } from 'types/project';

type ProjectEditVariables = {
  +project: {
    +projectIdentityID: string,
    +projectLocation?: ProjectLocationType,
    +projectName?: string,
    +projectImage?: string,
  },
};

/**
 * editProjectMutation
 *   This mutation request handles modifying an existing
 *   project by using GraphQL.
 * @type {String}
 */
const editProjectMutation = dedent`
  mutation($project:DashProjectInputType!) {
    project(project:$project) {
      projectIdentityID
    }
  }
`;

export default function getProjectEditMutation(variables: ProjectEditVariables) {
  const { projectIdentityID } = variables.project;

  if (!projectIdentityID) {
    throw new Error(`[getProjectEditMutation]: Attempted to get the projectModificationMutation but the given data did not include a projectIdentityID.  This is not allowed: ${JSON.stringify(variables)}`);
  }

  const request: GraphQLRequest = {
    query: editProjectMutation,
    variables,
  };

  return request;
}
