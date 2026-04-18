import { connect, disconnect, clearDatabase } from '../setup.js';
import mongoose from 'mongoose';

let Issue;
let Resident;

beforeAll(async () => {
  await connect();
  Issue = (await import('../../models/issues.js')).default;
});

beforeAll(async () => {
  await connect();
  Issue = (await import('../../models/issues.js')).default;
  // ADD THIS LINE to register the model:
  Resident = (await import('../../models/resident.js')).default; 
});

afterEach(async () => await clearDatabase());
afterAll(async () => await disconnect());

describe('Issue Model', () => {
const validIssue = {
    title: 'Broken pipe in lobby',
    description: 'Water leaking from ceiling pipe',
    category: 'Plumbing',      
    categoryType: 'Resident', // <-- Changed from 'Personal' to 'Resident'
    resident: new mongoose.Types.ObjectId(),
    community: new mongoose.Types.ObjectId(),
    location: 'Block A',
  };

  test('should create issue with valid data', async () => {
    const issue = await Issue.create(validIssue);
    expect(issue.title).toBe('Broken pipe in lobby');
    expect(issue._id).toBeDefined();
  });

  test('should default status to Pending Assignment', async () => {
    const issue = await Issue.create(validIssue);
    expect(issue.status).toBe('Pending Assignment');
  });

  test('should require title', async () => {
    const { title, ...noTitle } = validIssue;
    await expect(Issue.create(noTitle)).rejects.toThrow();
  });

  test('should require community', async () => {
    const { community, ...noCommunity } = validIssue;
    await expect(Issue.create(noCommunity)).rejects.toThrow();
  });

  test('should accept attachments array', async () => {
    const issue = await Issue.create({
      ...validIssue,
      attachments: ['https://cloudinary.com/img1.jpg'],
    });
    expect(issue.attachments).toHaveLength(1);
  });

  test('should have createdAt timestamp', async () => {
    const issue = await Issue.create(validIssue);
    expect(issue.createdAt).toBeDefined();
  });
});