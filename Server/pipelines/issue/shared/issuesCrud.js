import CrudService from '../../../core/modules/admin/crud/baseCrudService.js';
import Issues from '../../../core/models/issues.js';

const issuesCrud = new CrudService(Issues);

export const createIssue = (data) => issuesCrud.create(data);
export const getIssueById = (id, projection, options) =>
  issuesCrud.findById(id, projection, options);
export const listIssues = (filter, projection, options) =>
  issuesCrud.findMany(filter, projection, options);
export const updateIssueById = (id, updates, options) =>
  issuesCrud.updateById(id, updates, options);
export const deleteIssueById = (id) => issuesCrud.deleteById(id);

export default issuesCrud;

