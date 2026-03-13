import CrudService from './baseCrudService.js';
import Leave from '../models/leave.js';

const leaveCrud = new CrudService(Leave);

export const createLeave = (data) => leaveCrud.create(data);
export const getLeaveById = (id, projection, options) =>
  leaveCrud.findById(id, projection, options);
export const listLeaves = (filter, projection, options) =>
  leaveCrud.findMany(filter, projection, options);
export const updateLeaveById = (id, updates, options) =>
  leaveCrud.updateById(id, updates, options);
export const deleteLeaveById = (id) => leaveCrud.deleteById(id);

export default leaveCrud;
