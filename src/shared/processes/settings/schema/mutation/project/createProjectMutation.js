// @flow
import dedent from 'dedent';

import type { ProjectLocationType } from 'types/project';

type ProjectCreateVariables = {
  +project: {
    +projectIdentityID: void | null,
    +projectName: string,
    +projectLocation: ProjectLocationType,
    +projectImage?: string,
  },
};

/**
 * createProjectMutation
 *   This mutation request handles creating a new
 *   project by using GraphQL.
 * @type {String}
 */
const createProjectMutation = dedent`
  mutation($project:DashProjectInputType!) {
    project(project:$project) {
      projectIdentityID
    }
  }
`;

export default function getProjectCreationMutation(variables: ProjectCreateVariables) {
  const {
    projectName,
    projectLocation,
    projectIdentityID,
  } = variables.project;

  if (projectIdentityID) {
    throw new Error(`[getProjectCreationMutation]: Can not create a project while specifying the projectIdentityID.  Did you mean to edit rather than create?: ${projectIdentityID}`);
  } else if (!projectName || !projectLocation) {
    throw new Error(`[getProjectCreationMutation]: Required values were missing while attempting to build the project mutation query.  projectName: ${projectName} | projectLocation: ${JSON.stringify(projectLocation)}`);
  }

  const request: GraphQLRequest = {
    query: createProjectMutation,
    variables,
  };

  return request;
}
